import { Router, type IRouter } from "express";
import { asc } from "drizzle-orm";
import { db, carsTable } from "@workspace/db";
import { ListCarsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/cars", (_req, res, next) => {
  (async () => {
    const rows = await db.select().from(carsTable).orderBy(asc(carsTable.id));
    const data = ListCarsResponse.parse(rows);
    res.json(data);
  })().catch(next);
});

export default router;
