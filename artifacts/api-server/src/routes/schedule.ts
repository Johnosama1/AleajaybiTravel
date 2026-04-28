import { Router, type IRouter } from "express";
import { GetScheduleResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const WHATSAPP_PHONE = "201099399666";

// Manual cars available: Saturday(0), Monday(2), Wednesday(4)
const DAYS_MANUAL = [0, 2, 4];
// Automatic cars available: Sunday(1), Tuesday(3), Thursday(5)
const DAYS_AUTOMATIC = [1, 3, 5];

// 1 hour and 15 minutes between consecutive slot start times
const SLOT_INTERVAL_MINUTES = 75;
// First slot starts at 09:00 = 540 minutes from midnight
const FIRST_SLOT_MINUTES = 9 * 60;
// Last allowed slot start = 19:00 (last lesson ends at 20:15)
const LAST_SLOT_MINUTES = 19 * 60;

const SLOTS: number[] = [];
for (
  let m = FIRST_SLOT_MINUTES;
  m <= LAST_SLOT_MINUTES;
  m += SLOT_INTERVAL_MINUTES
) {
  SLOTS.push(m);
}

router.get("/schedule", (_req, res) => {
  const data = GetScheduleResponse.parse({
    daysManual: DAYS_MANUAL,
    daysAutomatic: DAYS_AUTOMATIC,
    slots: SLOTS,
    slotIntervalMinutes: SLOT_INTERVAL_MINUTES,
    whatsappPhone: WHATSAPP_PHONE,
  });
  res.json(data);
});

export default router;
export {
  WHATSAPP_PHONE,
  DAYS_MANUAL,
  DAYS_AUTOMATIC,
  SLOTS,
  SLOT_INTERVAL_MINUTES,
};
