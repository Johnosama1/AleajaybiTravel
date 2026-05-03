import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, and, lt } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { db, otpSessionsTable, userSessionsTable, bookingsTable } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

// In-memory rate limiter: phone -> lastSentAt
const rateLimitMap = new Map<string, number>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhone(raw: string): string {
  return raw.replace(/\s+/g, "").replace(/^0/, "20");
}

async function sendOtp(phone: string, code: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    logger.warn({ phone, code }, "Twilio credentials not configured — OTP logged only");
    return;
  }

  // Send OTP via SMS — use the verified Twilio number from this account
  const fromSms = "+12526659913";
  const toSms = `+${phone}`;
  const body = `كود التحقق الخاص بك من Aleajaybi Travel: ${code}\nصالح لمدة 5 دقائق.`;

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);
    await client.messages.create({ from: fromSms, to: toSms, body });
    logger.info({ phone, fromSms, toSms }, "OTP SMS sent");
  } catch (err) {
    logger.error({ err, phone, fromSms, toSms }, "Failed to send OTP SMS");
  }
}

function requireUserToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.header("x-user-token");
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "رمز الجلسة مطلوب." });
    return;
  }
  (async () => {
    const [session] = await db
      .select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.token, token))
      .limit(1);
    if (!session) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "جلسة غير صالحة." });
      return;
    }
    (req as Request & { userPhone: string }).userPhone = session.phone;
    next();
  })().catch(next);
}

const sendOtpBody = z.object({
  phone: z.string().min(6).max(20),
});

const verifyOtpBody = z.object({
  phone: z.string().min(6).max(20),
  code: z.string().length(6),
});

router.post("/auth/send-otp", (req, res, next) => {
  (async () => {
    const parsed = sendOtpBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", message: parsed.error.message });
      return;
    }

    const phone = normalizePhone(parsed.data.phone);

    // Rate limit: 1 per 60s per phone
    const lastSent = rateLimitMap.get(phone) ?? 0;
    if (Date.now() - lastSent < 60_000) {
      res.status(429).json({ error: "RATE_LIMITED", message: "انتظر دقيقة قبل إعادة الإرسال." });
      return;
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Delete any existing OTP for this phone
    await db.delete(otpSessionsTable).where(eq(otpSessionsTable.phone, phone));

    await db.insert(otpSessionsTable).values({ phone, code, expiresAt, attempts: 0 });

    rateLimitMap.set(phone, Date.now());

    await sendOtp(phone, code);

    logger.info({ phone }, "OTP session created");
    res.json({ ok: true, message: "تم إرسال رمز التحقق." });
  })().catch(next);
});

router.post("/auth/verify-otp", (req, res, next) => {
  (async () => {
    const parsed = verifyOtpBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", message: parsed.error.message });
      return;
    }

    const phone = normalizePhone(parsed.data.phone);
    const { code } = parsed.data;

    const [session] = await db
      .select()
      .from(otpSessionsTable)
      .where(eq(otpSessionsTable.phone, phone))
      .limit(1);

    if (!session) {
      res.status(400).json({ error: "NO_OTP", message: "لا يوجد رمز تحقق. اطلب رمزاً جديداً." });
      return;
    }

    if (new Date() > session.expiresAt) {
      await db.delete(otpSessionsTable).where(eq(otpSessionsTable.id, session.id));
      res.status(400).json({ error: "OTP_EXPIRED", message: "انتهت صلاحية الرمز. اطلب رمزاً جديداً." });
      return;
    }

    if (session.attempts >= MAX_ATTEMPTS) {
      await db.delete(otpSessionsTable).where(eq(otpSessionsTable.id, session.id));
      res.status(400).json({ error: "MAX_ATTEMPTS", message: "تجاوزت الحد الأقصى للمحاولات. اطلب رمزاً جديداً." });
      return;
    }

    if (session.code !== code) {
      await db
        .update(otpSessionsTable)
        .set({ attempts: session.attempts + 1 })
        .where(eq(otpSessionsTable.id, session.id));
      const remaining = MAX_ATTEMPTS - session.attempts - 1;
      res.status(400).json({ error: "WRONG_CODE", message: `رمز غير صحيح. تبقى ${remaining} محاولة.` });
      return;
    }

    // OTP is correct — delete session and create user session
    await db.delete(otpSessionsTable).where(eq(otpSessionsTable.id, session.id));

    const token = crypto.randomBytes(32).toString("hex");
    await db.insert(userSessionsTable).values({ token, phone });

    logger.info({ phone }, "User logged in via OTP");
    res.json({ ok: true, token, phone });
  })().catch(next);
});

router.get("/my-bookings", requireUserToken, (req, res, next) => {
  (async () => {
    const phone = (req as Request & { userPhone: string }).userPhone;
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.phone, phone))
      .orderBy(bookingsTable.createdAt);
    res.json(bookings.map((b) => ({
      id: b.id,
      carId: b.carId,
      name: b.name,
      phone: b.phone,
      weekStart: b.weekStart,
      dayOfWeek: b.dayOfWeek,
      startMinutes: b.startMinutes,
      priceEgp: b.priceEgp,
      sessionsCount: b.sessionsCount,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod,
      paymentReference: b.paymentReference,
      paidAt: b.paidAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
    })));
  })().catch(next);
});

router.post("/auth/logout", requireUserToken, (req, res, next) => {
  (async () => {
    const token = req.header("x-user-token")!;
    await db.delete(userSessionsTable).where(eq(userSessionsTable.token, token));
    res.json({ ok: true });
  })().catch(next);
});

// Cleanup expired OTP sessions (called from app startup)
export async function cleanupExpiredOtps(): Promise<void> {
  try {
    await db.delete(otpSessionsTable).where(lt(otpSessionsTable.expiresAt, new Date()));
  } catch (err) {
    logger.error({ err }, "Failed to cleanup expired OTPs");
  }
}

export default router;
