import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useGetSchedule } from "@workspace/api-client-react";
import { Clock, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ARABIC_DAYS } from "@/lib/date";
import { SiWhatsapp } from "react-icons/si";

export default function Contact() {
  const { data: schedule } = useGetSchedule();
  const phone = schedule?.whatsappPhone || "201099399666";
  const allDays = schedule
    ? Array.from(
        new Set([...schedule.daysManual, ...schedule.daysAutomatic]),
      ).sort((a, b) => a - b)
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <div className="container max-w-3xl">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-primary">
              التواصل معنا
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              متاحين دائماً للرد على استفساراتك ومساعدتك في حجز موعدك.
            </p>
          </div>

          <div className="space-y-5">
            {/* WhatsApp / Phone */}
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-[#25D366]/20 rounded-full flex items-center justify-center text-[#25D366]">
                  <SiWhatsapp className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-extrabold">واتساب / اتصال</h3>
                <a
                  href={`https://wa.me/${phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl sm:text-3xl font-extrabold text-primary hover:underline"
                  dir="ltr"
                  data-testid="link-whatsapp-phone"
                >
                  +{phone}
                </a>
                <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm pt-2">
                  <Button
                    asChild
                    className="flex-1 bg-[#25D366] hover:bg-[#1fb656] text-white font-extrabold"
                  >
                    <a
                      href={`https://wa.me/${phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="button-open-whatsapp"
                    >
                      <SiWhatsapp className="ml-2 h-4 w-4" />
                      افتح واتساب
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 font-extrabold"
                  >
                    <a
                      href={`tel:+${phone}`}
                      data-testid="button-call-phone"
                    >
                      <Phone className="ml-2 h-4 w-4" />
                      اتصال مباشر
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Working hours */}
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-center gap-2 mb-5">
                  <div className="w-10 h-10 bg-primary/15 rounded-full flex items-center justify-center text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold">أوقات العمل</h3>
                </div>
                {schedule ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allDays.map((dayIndex) => (
                      <div
                        key={dayIndex}
                        className="bg-background p-3 rounded-xl border border-border text-center"
                      >
                        <div className="font-extrabold text-primary">
                          {ARABIC_DAYS[dayIndex]}
                        </div>
                        <div
                          className="text-xs text-muted-foreground mt-1"
                          dir="ltr"
                        >
                          {schedule.hours[0]}:00 -{" "}
                          {schedule.hours[schedule.hours.length - 1]}:00
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm">
                    جاري التحميل...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
