import { Router, type IRouter } from "express";
import { GetScheduleResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const WHATSAPP_PHONE = "201099399666";

router.get("/schedule", (_req, res) => {
  const data = GetScheduleResponse.parse({
    days: [0, 1, 2, 3, 4],
    hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    whatsappPhone: WHATSAPP_PHONE,
  });
  res.json(data);
});

export default router;
export { WHATSAPP_PHONE };
