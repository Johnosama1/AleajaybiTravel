import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, bookingsTable, carsTable } from "@workspace/db";
import { logger } from "../lib/logger.js";
import {
  sendWhatsAppToInstructor,
  buildPaymentWhatsAppMessage,
} from "../lib/whatsapp.js";

const router: IRouter = Router();

const DAY_NAMES_AR = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

const paymentWebhookBody = z.object({
  bookingId: z.number().int().positive(),
  status: z.string(),
  transactionId: z.string().optional(),
  method: z.string().optional(),
  amount: z.number().optional(),
});

router.post("/payment-webhook", (req, res, next) => {
  (async () => {
    const parsed = paymentWebhookBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "INVALID_BODY",
        message: parsed.error.message,
      });
      return;
    }

    const { bookingId, status, transactionId, method, amount } = parsed.data;

    if (status !== "success") {
      res.json({ received: true, action: "none" });
      return;
    }

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      res.status(404).json({
        error: "NOT_FOUND",
        message: "الحجز غير موجود.",
      });
      return;
    }

    const [car] = await db
      .select()
      .from(carsTable)
      .where(eq(carsTable.id, booking.carId))
      .limit(1);

    const [updated] = await db
      .update(bookingsTable)
      .set({
        paymentStatus: "paid",
        paymentMethod: method ?? booking.paymentMethod ?? "vodafone_cash",
        paymentReference:
          transactionId ?? booking.paymentReference ?? null,
        paidAt: new Date(),
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    const dayLabel =
      DAY_NAMES_AR[booking.dayOfWeek] ?? `يوم ${booking.dayOfWeek}`;
    const hh = Math.floor(booking.startMinutes / 60)
      .toString()
      .padStart(2, "0");
    const mm = (booking.startMinutes % 60).toString().padStart(2, "0");

    const transmissionLabel =
      car?.transmission === "automatic" ? "أوتوماتيك" : "مانيوال";
    const carType = car
      ? `${car.name} (${transmissionLabel})`
      : "غير محدد";

    const message = buildPaymentWhatsAppMessage({
      name: booking.name,
      phone: booking.phone,
      day: dayLabel,
      time: `${hh}:${mm}`,
      sessions: booking.sessionsCount,
      amount: amount ?? booking.priceEgp,
      method: method ?? booking.paymentMethod ?? "vodafone_cash",
      transactionId: transactionId ?? booking.paymentReference ?? "-",
      carType,
    });

    try {
      await sendWhatsAppToInstructor(message);
      logger.info({ bookingId }, "WhatsApp sent to instructor via webhook");
    } catch (err) {
      logger.error({ err, bookingId }, "Failed to send WhatsApp from webhook");
    }

    res.json({
      received: true,
      action: "paid",
      bookingId: updated.id,
    });
  })().catch(next);
});

export default router;
