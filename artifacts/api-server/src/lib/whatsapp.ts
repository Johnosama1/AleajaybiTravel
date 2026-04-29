import twilio from "twilio";
import { logger } from "./logger.js";

const INSTRUCTOR_WHATSAPP = process.env.TRAINER_WHATSAPP ?? "201017979651";

export async function sendWhatsAppToInstructor(message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    logger.warn("Twilio credentials not configured — skipping WhatsApp send");
    return;
  }

  const client = twilio(accountSid, authToken);
  await client.messages.create({
    from,
    to: `whatsapp:+${INSTRUCTOR_WHATSAPP}`,
    body: message,
  });
}

export function buildPaymentWhatsAppMessage(data: {
  name: string;
  phone: string;
  day: string;
  time: string;
  sessions: number;
  amount: number;
  method: string;
  transactionId: string;
  carType: string;
}): string {
  const methodLabel =
    data.method === "instapay" ? "InstaPay" : "Vodafone Cash";

  return [
    "🚗 *حجز جديد مدفوع — Aleajaybi Travel*",
    "",
    `👤 الاسم: ${data.name}`,
    `📞 الهاتف: ${data.phone}`,
    `📅 اليوم: ${data.day}`,
    `🕒 الموعد: ${data.time}`,
    `📚 عدد الحصص: ${data.sessions}`,
    `💵 المبلغ: ${data.amount} ج.م`,
    `💳 طريقة الدفع: ${methodLabel}`,
    `🔖 رقم العملية: ${data.transactionId}`,
    `🚙 نوع السيارة: ${data.carType}`,
    "",
    "✅ الرجاء تأكيد استلام المبلغ وتفعيل الحجز.",
  ].join("\n");
}
