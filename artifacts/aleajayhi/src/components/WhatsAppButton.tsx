import React from "react";
import { SiWhatsapp } from "react-icons/si";
import { useGetSchedule } from "@workspace/api-client-react";

export function WhatsAppButton() {
  const { data: schedule } = useGetSchedule();
  
  const phone = schedule?.whatsappPhone || "201099399666";
  const href = `https://wa.me/${phone}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-background"
      aria-label="تواصل معنا عبر واتساب"
    >
      <SiWhatsapp className="h-7 w-7" />
    </a>
  );
}
