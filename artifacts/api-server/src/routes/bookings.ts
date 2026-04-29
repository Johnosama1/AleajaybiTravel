import { Router, type IRouter } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, bookingsTable, carsTable } from "@workspace/db";
import {
  ListBookingsResponse,
  GetBookingStatsResponse,
} from "@workspace/api-zod";
import {
  DAYS_MANUAL,
  DAYS_AUTOMATIC,
  SLOTS,
  WHATSAPP_PHONE,
} from "./schedule.js";
import { PRICE_EGP, SESSIONS_COUNT } from "./pricing.js";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "weekStart must be YYYY-MM-DD");

const availabilityQuery = z.object({
  carId: z.coerce.number().int().positive(),
  weekStart: dateString,
});

const createBookingBody = z.object({
  carId: z.number().int().positive(),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  weekStart: dateString,
  dayOfWeek: z.number().int().min(0).max(6),
  startMinutes: z.number().int().min(0).max(1439),
  notes: z.string().max(500).optional(),
});

const submitPaymentBody = z
  .object({
    method: z.enum(["vodafone_cash", "instapay"]),
    reference: z.string().min(4).max(80).optional(),
    proofImage: z.string().max(8_000_000).optional(),
  })
  .refine((d) => d.reference || d.proofImage, {
    message: "يجب إدخال رقم العملية أو رفع صورة الإيصال",
  });

const router: IRouter = Router();

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeekSaturday(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = (day - 6 + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

type BookingRow = typeof bookingsTable.$inferSelect;

export function serializeBooking(b: BookingRow) {
  return {
    id: b.id,
    carId: b.carId,
    name: b.name,
    phone: b.phone,
    weekStart: b.weekStart,
    dayOfWeek: b.dayOfWeek,
    startMinutes: b.startMinutes,
    notes: b.notes,
    priceEgp: b.priceEgp,
    sessionsCount: b.sessionsCount,
    paymentStatus: b.paymentStatus as "pending" | "submitted" | "paid",
    paymentMethod: (b.paymentMethod ?? null) as
      | "vodafone_cash"
      | "instapay"
      | null,
    paymentReference: b.paymentReference,
    paymentProofUrl: b.paymentProofUrl ?? null,
    paidAt: b.paidAt ? b.paidAt.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
  };
}

export function buildTrainerWhatsappUrl(b: BookingRow): string {
  const dayNamesAr = [
    "السبت",
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
  ];
  const day = dayNamesAr[b.dayOfWeek] ?? `يوم ${b.dayOfWeek}`;
  const hh = Math.floor(b.startMinutes / 60)
    .toString()
    .padStart(2, "0");
  const mm = (b.startMinutes % 60).toString().padStart(2, "0");
  const lines = [
    "🚗 *حجز جديد مدفوع — Aleajaybi Travel*",
    "",
    `👤 الاسم: ${b.name}`,
    `📞 الهاتف: ${b.phone}`,
    `🗓️ بداية الأسبوع: ${b.weekStart}`,
    `📅 اليوم: ${day}`,
    `🕒 الموعد: ${hh}:${mm}`,
    `📚 عدد الحصص: ${b.sessionsCount}`,
    `💵 المبلغ: ${b.priceEgp} ج.م`,
    `💳 طريقة الدفع: ${
      b.paymentMethod === "instapay" ? "InstaPay" : "Vodafone Cash"
    }`,
    `🔖 رقم العملية: ${b.paymentReference ?? "-"}`,
    "✅ تم تأكيد استلام المبلغ.",
  ];
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_PHONE}?text=${text}`;
}

router.get("/availability", (req, res, next) => {
  (async () => {
    const parsed = availabilityQuery.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "INVALID_QUERY",
        message: parsed.error.message,
      });
      return;
    }
    const { weekStart, carId } = parsed.data;
    const rows = await db
      .select({
        dayOfWeek: bookingsTable.dayOfWeek,
        startMinutes: bookingsTable.startMinutes,
      })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.weekStart, weekStart),
          eq(bookingsTable.carId, carId),
        ),
      );
    res.json({
      carId,
      weekStart,
      bookedSlots: rows.map((r) => `${r.dayOfWeek}-${r.startMinutes}`),
    });
  })().catch(next);
});

router.get("/bookings", (_req, res, next) => {
  (async () => {
    const rows = await db
      .select()
      .from(bookingsTable)
      .orderBy(
        asc(bookingsTable.weekStart),
        asc(bookingsTable.dayOfWeek),
        asc(bookingsTable.startMinutes),
      );
    const data = ListBookingsResponse.parse(rows.map(serializeBooking));
    res.json(data);
  })().catch(next);
});

router.get("/bookings/stats", (_req, res, next) => {
  (async () => {
    const todayWeekStart = toDateString(startOfWeekSaturday(new Date()));

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(bookingsTable);

    const [{ thisWeek }] = await db
      .select({ thisWeek: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(eq(bookingsTable.weekStart, todayWeekStart));

    const popularRows = await db
      .select({
        dayOfWeek: bookingsTable.dayOfWeek,
        cnt: sql<number>`count(*)::int`,
      })
      .from(bookingsTable)
      .groupBy(bookingsTable.dayOfWeek)
      .orderBy(sql`count(*) desc`)
      .limit(1);

    const data = GetBookingStatsResponse.parse({
      totalBookings: total ?? 0,
      thisWeekBookings: thisWeek ?? 0,
      nextAvailableSlot: null,
      popularDay: popularRows[0]?.dayOfWeek ?? null,
    });
    res.json(data);
  })().catch(next);
});

router.get("/bookings/:id", (req, res, next) => {
  (async () => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({
        error: "INVALID_ID",
        message: "Booking id must be a positive integer.",
      });
      return;
    }
    const [row] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "الحجز غير موجود.",
      });
      return;
    }
    res.json(serializeBooking(row));
  })().catch(next);
});

router.post("/bookings", (req, res, next) => {
  (async () => {
    const parsed = createBookingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "INVALID_BODY",
        message: parsed.error.message,
      });
      return;
    }
    const body = parsed.data;

    const [car] = await db
      .select({ transmission: carsTable.transmission })
      .from(carsTable)
      .where(eq(carsTable.id, body.carId))
      .limit(1);

    if (!car) {
      res.status(400).json({
        error: "CAR_NOT_FOUND",
        message: "السيارة المختارة غير موجودة.",
      });
      return;
    }

    const allowedDays =
      car.transmission === "automatic" ? DAYS_AUTOMATIC : DAYS_MANUAL;

    if (!allowedDays.includes(body.dayOfWeek)) {
      res.status(400).json({
        error: "DAY_NOT_AVAILABLE",
        message: "هذا اليوم غير متاح لنوع السيارة المختار.",
      });
      return;
    }

    if (!SLOTS.includes(body.startMinutes)) {
      res.status(400).json({
        error: "SLOT_NOT_AVAILABLE",
        message: "هذا الموعد غير متاح ضمن مواعيد المدرسة.",
      });
      return;
    }

    const existing = await db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.carId, body.carId),
          eq(bookingsTable.weekStart, body.weekStart),
          eq(bookingsTable.dayOfWeek, body.dayOfWeek),
          eq(bookingsTable.startMinutes, body.startMinutes),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({
        error: "SLOT_TAKEN",
        message: "هذا الموعد محجوز بالفعل، الرجاء اختيار موعد آخر.",
      });
      return;
    }

    try {
      const [created] = await db
        .insert(bookingsTable)
        .values({
          carId: body.carId,
          name: body.name,
          phone: body.phone,
          weekStart: body.weekStart,
          dayOfWeek: body.dayOfWeek,
          startMinutes: body.startMinutes,
          notes: body.notes ?? null,
          priceEgp: PRICE_EGP,
          sessionsCount: SESSIONS_COUNT,
          paymentStatus: "pending",
        })
        .returning();

      res.status(201).json(serializeBooking(created));
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        res.status(409).json({
          error: "SLOT_TAKEN",
          message: "هذا الموعد محجوز بالفعل، الرجاء اختيار موعد آخر.",
        });
        return;
      }
      throw err;
    }
  })().catch(next);
});

router.post("/bookings/:id/payment", (req, res, next) => {
  (async () => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({
        error: "INVALID_ID",
        message: "Booking id must be a positive integer.",
      });
      return;
    }
    const parsed = submitPaymentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "INVALID_BODY",
        message: parsed.error.message,
      });
      return;
    }
    const [existing] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "الحجز غير موجود.",
      });
      return;
    }
    if (existing.paymentStatus === "paid") {
      // Already paid — return as-is.
      res.json(serializeBooking(existing));
      return;
    }
    const [updated] = await db
      .update(bookingsTable)
      .set({
        paymentMethod: parsed.data.method,
        paymentReference: parsed.data.reference ?? null,
        paymentProofUrl: parsed.data.proofImage ?? null,
        paymentStatus: "submitted",
      })
      .where(eq(bookingsTable.id, id))
      .returning();
    res.json(serializeBooking(updated));
  })().catch(next);
});

export default router;
