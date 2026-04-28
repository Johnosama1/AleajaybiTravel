import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useGetSchedule } from "@workspace/api-client-react";
import { Clock, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ARABIC_DAYS } from "@/lib/date";

export default function Contact() {
  const { data: schedule } = useGetSchedule();
  const phone = schedule?.whatsappPhone || "201099399666";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="flex-1 py-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-primary">تواصل معنا</h1>
            <p className="text-lg text-muted-foreground">
              نحن هنا للإجابة على جميع استفساراتك ومساعدتك في بدء رحلتك.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-2">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">اتصل بنا</h3>
                <p className="text-muted-foreground text-sm">
                  يمكنك التواصل معنا مباشرة عبر الهاتف أو واتساب
                </p>
                <a 
                  href={`https://wa.me/${phone}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-2xl font-bold text-primary hover:underline mt-4 block"
                  dir="ltr"
                >
                  +{phone}
                </a>
              </CardContent>
            </Card>

            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-2">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">موقعنا</h3>
                <p className="text-muted-foreground text-sm">
                  تفضل بزيارتنا في مقر المدرسة
                </p>
                <p className="text-lg font-medium mt-4">
                  مصر، (العنوان بالتفصيل سيتم إضافته هنا)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border overflow-hidden md:col-span-2">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-2">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">أوقات العمل</h3>
                {schedule ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 w-full text-right">
                    {schedule.days.map((dayIndex) => (
                      <div key={dayIndex} className="bg-background p-4 rounded-xl border border-border">
                        <div className="font-bold text-primary mb-1">{ARABIC_DAYS[dayIndex]}</div>
                        <div className="text-sm text-muted-foreground" dir="ltr">
                          {schedule.hours.length > 0 
                            ? `${String(schedule.hours[0]).padStart(2, '0')}:00 - ${String(schedule.hours[schedule.hours.length - 1]).padStart(2, '0')}:00` 
                            : 'مغلق'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">جاري تحميل المواعيد...</p>
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
