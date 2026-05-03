import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, lt, or, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, offersTable } from "@workspace/db";
import { logger } from "../lib/logger.js";

const ADMIN_TOKEN = process.env["ADMIN_TOKEN"];

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const expected = ADMIN_TOKEN && ADMIN_TOKEN.length > 0 ? ADMIN_TOKEN : null;
  if (!expected) {
    res.status(401).json({ error: "ADMIN_NOT_CONFIGURED" });
    return;
  }
  const provided = req.header("x-admin-token");
  if (provided !== expected) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid admin token." });
    return;
  }
  next();
}

const createOfferBody = z.object({
  title: z.string().max(200).default(""),
  imageData: z.string().min(10),
  carTransmission: z.enum(["manual", "automatic"]).optional().nullable(),
  expiresInHours: z.number().positive().optional().nullable(),
});

const router: IRouter = Router();

// Public: get active (non-expired) offers
router.get("/offers", (_req, res, next) => {
  (async () => {
    const now = new Date();
    const rows = await db
      .select()
      .from(offersTable)
      .orderBy(offersTable.createdAt);

    const active = rows.filter(
      (o) => o.expiresAt === null || o.expiresAt > now
    );

    res.json(
      active.map((o) => ({
        id: o.id,
        title: o.title,
        imageData: o.imageData,
        carTransmission: o.carTransmission,
        expiresAt: o.expiresAt?.toISOString() ?? null,
        createdAt: o.createdAt.toISOString(),
      }))
    );
  })().catch(next);
});

// Admin: get all offers (including expired)
router.get("/admin/offers", requireAdmin, (_req, res, next) => {
  (async () => {
    const rows = await db.select().from(offersTable).orderBy(offersTable.createdAt);
    res.json(
      rows.map((o) => ({
        id: o.id,
        title: o.title,
        imageData: o.imageData,
        carTransmission: o.carTransmission,
        expiresAt: o.expiresAt?.toISOString() ?? null,
        createdAt: o.createdAt.toISOString(),
      }))
    );
  })().catch(next);
});

// Admin: create offer
router.post("/admin/offers", requireAdmin, (req, res, next) => {
  (async () => {
    const parsed = createOfferBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", message: parsed.error.message });
      return;
    }

    const { title, imageData, carTransmission, expiresInHours } = parsed.data;
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    const [offer] = await db
      .insert(offersTable)
      .values({
        title,
        imageData,
        carTransmission: carTransmission ?? null,
        expiresAt,
      })
      .returning();

    logger.info({ offerId: offer.id }, "Offer created");
    res.status(201).json({
      id: offer.id,
      title: offer.title,
      imageData: offer.imageData,
      carTransmission: offer.carTransmission,
      expiresAt: offer.expiresAt?.toISOString() ?? null,
      createdAt: offer.createdAt.toISOString(),
    });
  })().catch(next);
});

// Admin: delete offer
router.delete("/admin/offers/:id", requireAdmin, (req, res, next) => {
  (async () => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "INVALID_ID" });
      return;
    }
    const [deleted] = await db
      .delete(offersTable)
      .where(eq(offersTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    logger.info({ offerId: id }, "Offer deleted");
    res.json({ ok: true });
  })().catch(next);
});

// Cleanup expired offers (called periodically)
export async function cleanupExpiredOffers(): Promise<void> {
  try {
    const now = new Date();
    await db.delete(offersTable).where(lt(offersTable.expiresAt, now));
  } catch (err) {
    logger.error({ err }, "Failed to cleanup expired offers");
  }
}

export default router;
