import { Router, type IRouter } from "express";
import { GetPricingResponse } from "@workspace/api-zod";

export const PRICE_EGP = 10;
export const SESSIONS_COUNT = 4;
// Wallet number / handle the customer pays to. Override via env vars in production.
export const VODAFONE_CASH_NUMBER =
  process.env["VODAFONE_CASH_NUMBER"] ?? "01017979651";
export const INSTAPAY_HANDLE =
  process.env["INSTAPAY_HANDLE"] ?? "aleajaybi@instapay";

const router: IRouter = Router();

router.get("/pricing", (_req, res) => {
  const data = GetPricingResponse.parse({
    priceEgp: PRICE_EGP,
    sessionsCount: SESSIONS_COUNT,
    currency: "EGP",
    vodafoneCashNumber: VODAFONE_CASH_NUMBER,
    instapayHandle: INSTAPAY_HANDLE,
  });
  res.json(data);
});

export default router;
