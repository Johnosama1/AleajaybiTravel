import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, bookingsTable } from "@workspace/db";
import { serializeBooking, buildTrainerWhatsappUrl } from "./bookings.js";

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
    res.json({
      booking: serializeBooking(updated),
      whatsappUrl: buildTrainerWhatsappUrl(updated),
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

export default router;
