import { Router, type IRouter } from "express";
import { GetScheduleResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const WHATSAPP_PHONE = "201099399666";

// Manual cars available: Saturday(0), Monday(2), Wednesday(4)
const DAYS_MANUAL = [0, 2, 4];
// Automatic cars available: Sunday(1), Tuesday(3), Thursday(5)
const DAYS_AUTOMATIC = [1, 3, 5];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

router.get("/schedule", (_req, res) => {
  const data = GetScheduleResponse.parse({
    daysManual: DAYS_MANUAL,
    daysAutomatic: DAYS_AUTOMATIC,
    hours: HOURS,
    whatsappPhone: WHATSAPP_PHONE,
  });
  res.json(data);
});

export default router;
export { WHATSAPP_PHONE, DAYS_MANUAL, DAYS_AUTOMATIC, HOURS };
