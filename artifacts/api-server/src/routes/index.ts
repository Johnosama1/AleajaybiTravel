import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scheduleRouter from "./schedule";
import bookingsRouter from "./bookings";
import carsRouter from "./cars";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scheduleRouter);
router.use(bookingsRouter);
router.use(carsRouter);

export default router;
