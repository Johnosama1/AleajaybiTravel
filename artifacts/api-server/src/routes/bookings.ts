import { Router, type IRouter } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, bookingsTable, carsTable } from "@workspace/db";
import {
  ListBookingsResponse,
  GetBookingStatsResponse,
} from "@workspace/api-zod";
import { DAYS_MANUAL, DAYS_AUTOMATIC, SLOTS } from "./schedule.js";

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
    const data = ListBookingsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        carId: r.carId,
        name: r.name,
        phone: r.phone,
        weekStart: r.weekStart,
        dayOfWeek: r.dayOfWeek,
        startMinutes: r.startMinutes,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
      })),
    );
    res.json(data);
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
        })
        .returning();

      res.status(201).json({
        id: created.id,
        carId: created.carId,
        name: created.name,
        phone: created.phone,
        weekStart: created.weekStart,
        dayOfWeek: created.dayOfWeek,
        startMinutes: created.startMinutes,
        notes: created.notes,
        createdAt: created.createdAt.toISOString(),
      });
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

export default router;
