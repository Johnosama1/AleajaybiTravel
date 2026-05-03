import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, bookingsTable, carsTable } from "@workspace/db";
import { serializeBooking, buildTrainerWhatsappUrl } from "./bookings.js";
import { sendWhatsAppToInstructor, buildPaymentWhatsAppMessage } from "../lib/whatsapp.js";
import { logger } from "../lib/logger.js";

const DAY_NAMES_AR = ["السبت","الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];

const ADMIN_TOKEN = process.env["ADMIN_TOKEN"];

function getConfiguredToken(): string | null {
  return ADMIN_TOKEN && ADMIN_TOKEN.length > 0 ? ADMIN_TOKEN : null;
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const expected = getConfiguredToken();
  if (!expected) {
    res.status(401).json({
      error: "ADMIN_NOT_CONFIGURED",
      message: "Admin token is not configured on the server.",
    });
    return;
  }
  const provided = req.header("x-admin-token");
  if (provided !== expected) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Invalid admin token.",
    });
    return;
  }
  next();
}

const loginBody = z.object({ token: z.string().min(1) });

const router: IRouter = Router();

router.post("/admin/login", (req, res, next) => {
  (async () => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "INVALID_BODY",
        message: parsed.error.message,
      });
      return;
    }
    const expected = getConfiguredToken();
    if (!expected || parsed.data.token !== expected) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "كلمة السر غير صحيحة.",
      });
      return;
    }
    res.json({ ok: true });
  })().catch(next);
});

router.get("/admin/bookings", requireAdmin, (_req, res, next) => {
  (async () => {
    const rows = await db
      .select()
      .from(bookingsTable)
      .orderBy(
        asc(bookingsTable.weekStart),
        asc(bookingsTable.dayOfWeek),
        asc(bookingsTable.startMinutes),
      );
    res.json(rows.map(serializeBooking));
  })().catch(next);
});

router.post("/admin/bookings/:id/confirm", requireAdmin, (req, res, next) => {
  (async () => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({
        error: "INVALID_ID",
        message: "Booking id must be a positive integer.",
      });
      return;
    }
    const [updated] = await db
      .update(bookingsTable)
      .set({
        paymentStatus: "paid",
        paidAt: new Date(),
      })
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "الحجز غير موجود.",
      });
      return;
    }

    const [car] = await db
      .select()
      .from(carsTable)
      .where(eq(carsTable.id, updated.carId))
      .limit(1);

    const dayLabel = DAY_NAMES_AR[updated.dayOfWeek] ?? `يوم ${updated.dayOfWeek}`;
    const hh = Math.floor(updated.startMinutes / 60).toString().padStart(2, "0");
    const mm = (updated.startMinutes % 60).toString().padStart(2, "0");
    const transmissionLabel = car?.transmission === "automatic" ? "أوتوماتيك" : "مانيوال";
    const carType = car ? `${car.name} (${transmissionLabel})` : "غير محدد";

    const message = buildPaymentWhatsAppMessage({
      name: updated.name,
      phone: updated.phone,
      day: dayLabel,
      time: `${hh}:${mm}`,
      weekStart: updated.weekStart,
      sessions: updated.sessionsCount,
      amount: updated.priceEgp,
      method: updated.paymentMethod ?? "vodafone_cash",
      transactionId: updated.paymentReference ?? "-",
      carType,
    });

    sendWhatsAppToInstructor(message).catch((err) => {
      logger.error({ err, bookingId: id }, "Failed to send WhatsApp on admin confirm");
    });

    res.json({
      booking: serializeBooking(updated),
      whatsappUrl: buildTrainerWhatsappUrl(updated, carType),
    });
  })().catch(next);
});

router.post("/admin/bookings/:id/reject", requireAdmin, (req, res, next) => {
  (async () => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({
        error: "INVALID_ID",
        message: "Booking id must be a positive integer.",
      });
      return;
    }
    const [updated] = await db
      .update(bookingsTable)
      .set({
        paymentStatus: "pending",
        paymentMethod: null,
        paymentReference: null,
        paidAt: null,
      })
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "الحجز غير موجود.",
      });
      return;
    }
    res.json(serializeBooking(updated));
  })().catch(next);
});

router.get("/admin/stats", requireAdmin, (_req, res, next) => {
  (async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(bookingsTable);

    const [{ paid }] = await db
      .select({ paid: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(eq(bookingsTable.paymentStatus, "paid"));

    const [{ submitted }] = await db
      .select({ submitted: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(eq(bookingsTable.paymentStatus, "submitted"));

    const [{ totalRevenue }] = await db
      .select({ totalRevenue: sql<number>`coalesce(sum(price_egp), 0)::int` })
      .from(bookingsTable)
      .where(eq(bookingsTable.paymentStatus, "paid"));

    const [{ monthlyRevenue }] = await db
      .select({ monthlyRevenue: sql<number>`coalesce(sum(price_egp), 0)::int` })
      .from(bookingsTable)
      .where(
        sql`payment_status = 'paid' and paid_at >= ${monthStart}::timestamptz`
      );

    const [{ yearlyRevenue }] = await db
      .select({ yearlyRevenue: sql<number>`coalesce(sum(price_egp), 0)::int` })
      .from(bookingsTable)
      .where(
        sql`payment_status = 'paid' and paid_at >= ${yearStart}::timestamptz`
      );

    const [{ monthlyCount }] = await db
      .select({ monthlyCount: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(
        sql`payment_status = 'paid' and paid_at >= ${monthStart}::timestamptz`
      );

    const [{ yearlyCount }] = await db
      .select({ yearlyCount: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(
        sql`payment_status = 'paid' and paid_at >= ${yearStart}::timestamptz`
      );

    res.json({
      total: total ?? 0,
      paid: paid ?? 0,
      submitted: submitted ?? 0,
      totalRevenue: totalRevenue ?? 0,
      monthlyRevenue: monthlyRevenue ?? 0,
      yearlyRevenue: yearlyRevenue ?? 0,
      monthlyCount: monthlyCount ?? 0,
      yearlyCount: yearlyCount ?? 0,
    });
  })().catch(next);
});

export default router;
