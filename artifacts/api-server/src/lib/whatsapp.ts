import twilio from "twilio";
import { logger } from "./logger.js";

const INSTRUCTOR_WHATSAPP = process.env.TRAINER_WHATSAPP ?? "201017979651";

const DAY_NAMES_AR = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

function formatMinutes(m: number): string {
  const hh = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function sendWhatsAppToInstructor(message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    logger.warn("Twilio credentials not configured — skipping WhatsApp send");
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      from,
      to: `whatsapp:+${INSTRUCTOR_WHATSAPP}`,
      body: message,
    });
    logger.info("WhatsApp notification sent to instructor");
  } catch (err) {
    logger.error({ err }, "Failed to send WhatsApp notification");
  }
}

export function buildBookingCreatedMessage(data: {
  name: string;
  phone: string;
  dayOfWeek: number;
  startMinutes: number;
  weekStart: string;
  sessions: number;
  amount: number;
  carName: string;
  carType: string;
}): string {
  const day = DAY_NAMES_AR[data.dayOfWeek] ?? `يوم ${data.dayOfWeek}`;
  const carTypeLabel = data.carType === "automatic" ? "أوتوماتيك" : "مانيوال";
  return [
    "👋مرحباً، أود تأكيد حجزي لتدريب القيادة.",
    `👤الاسم: ${data.name}`,
    `📱الموبايل: ${data.phone}`,
    `📆اليوم: ${day}`,
    `🕧الساعة: ${formatMinutes(data.startMinutes)}`,
    `🧾بداية الأسبوع: ${data.weekStart}`,
    `🚗نوع السياره: ${data.carName} (${carTypeLabel})`,
    `🎓 عدد الحصص: ${data.sessions}`,
    `💵 المبلغ: ${data.amount} ج.م`,
    "⏳ في انتظار تأكيد الدفع.",
  ].join("\n");
}

export function buildPaymentSubmittedMessage(data: {
  name: string;
  phone: string;
  dayOfWeek: number;
  startMinutes: number;
  sessions: number;
  amount: number;
  method: string;
  reference: string;
  carName: string;
  carType: string;
}): string {
  const day = DAY_NAMES_AR[data.dayOfWeek] ?? `يوم ${data.dayOfWeek}`;
  const methodLabel = data.method === "instapay" ? "InstaPay" : "Vodafone Cash";
  const carTypeLabel = data.carType === "automatic" ? "أوتوماتيك" : "مانيوال";
  return [
    "👋مرحباً، أود تأكيد حجزي لتدريب القيادة.",
    `👤الاسم: ${data.name}`,
    `📱الموبايل: ${data.phone}`,
    `📆اليوم: ${day}`,
    `🕧الساعة: ${formatMinutes(data.startMinutes)}`,
    `🚗نوع السياره: ${data.carName} (${carTypeLabel})`,
    `🎓 عدد الحصص: ${data.sessions}`,
    `💵 المبلغ: ${data.amount} ج.م`,
    `📇 طريقة الدفع: ${methodLabel}`,
    `🔖 رقم العملية: ${data.reference || "-"}`,
    "🎉 تم تأكيد استلام المبلغ.",
  ].join("\n");
}

export function buildPaymentWhatsAppMessage(data: {
  name: string;
  phone: string;
  day: string;
  time: string;
  weekStart?: string;
  sessions: number;
  amount: number;
  method: string;
  transactionId: string;
  carType: string;
}): string {
  const methodLabel =
    data.method === "instapay" ? "InstaPay" : "Vodafone Cash";

  return [
    "👋مرحباً، أود تأكيد حجزي لتدريب القيادة.",
    `👤الاسم: ${data.name}`,
    `📱الموبايل: ${data.phone}`,
    `📆اليوم: ${data.day}`,
    `🕧الساعة: ${data.time}`,
    ...(data.weekStart ? [`🧾بداية الأسبوع: ${data.weekStart}`] : []),
    `🚗نوع السياره: ${data.carType}`,
    `🎓 عدد الحصص: ${data.sessions}`,
    `💵 المبلغ: ${data.amount} ج.م`,
    `📇 طريقة الدفع: ${methodLabel}`,
    "🎉 تم تأكيد استلام المبلغ.",
  ].join("\n");
}
