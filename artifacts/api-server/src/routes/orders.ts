import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, ordersTable } from "@workspace/db";
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

const createOrderBody = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20),
  details: z.string().max(1000).optional(),
  paymentMethod: z.enum(["cash", "transfer", "other"]),
});

const router: IRouter = Router();

router.post("/orders", (req, res, next) => {
  (async () => {
    const parsed = createOrderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", message: parsed.error.message });
      return;
    }
    const [order] = await db
      .insert(ordersTable)
      .values({
        name: parsed.data.name,
        phone: parsed.data.phone,
        details: parsed.data.details ?? null,
        paymentMethod: parsed.data.paymentMethod,
        status: "pending",
      })
      .returning();
    logger.info({ orderId: order.id }, "New order created");
    res.status(201).json(order);
  })().catch(next);
});

router.get("/orders/:id", (req, res, next) => {
  (async () => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "INVALID_ID" });
      return;
    }
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    if (!order) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json(order);
  })().catch(next);
});

router.get("/admin/orders", requireAdmin, (_req, res, next) => {
  (async () => {
    const rows = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
    res.json(rows);
  })().catch(next);
});

router.post("/admin/orders/:id/approve", requireAdmin, (req, res, next) => {
  (async () => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "INVALID_ID" });
      return;
    }
    const [order] = await db
      .update(ordersTable)
      .set({ status: "approved", processedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    logger.info({ orderId: id }, "Order approved");
    res.json(order);
  })().catch(next);
});

router.post("/admin/orders/:id/reject", requireAdmin, (req, res, next) => {
  (async () => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ error: "INVALID_ID" });
      return;
    }
    const [order] = await db
      .update(ordersTable)
      .set({ status: "rejected", processedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    logger.info({ orderId: id }, "Order rejected");
    res.json(order);
  })().catch(next);
});

export default router;
