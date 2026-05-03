import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scheduleRouter from "./schedule";
import bookingsRouter from "./bookings";
import carsRouter from "./cars";
import pricingRouter from "./pricing";
import adminRouter from "./admin";
import webhookRouter from "./webhook";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pricingRouter);
router.use(scheduleRouter);
router.use(bookingsRouter);
router.use(carsRouter);
router.use(adminRouter);
router.use(webhookRouter);
router.use(ordersRouter);

export default router;
