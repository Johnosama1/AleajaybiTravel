import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock3, CalendarCheck, LogOut, Loader2 } from "lucide-react";
import { OtpLoginDialog, readUserToken, readUserPhone, clearUserSession } from "@/components/OtpLoginDialog";
import { ARABIC_DAYS, formatMinutes, formatArabicDate } from "@/lib/date";
import { useToast } from "@/hooks/use-toast";

interface MyBooking {
  id: number;
  carId: number;
  name: string;
  phone: string;
  weekStart: string;
  dayOfWeek: number;
  startMinutes: number;
  priceEgp: number;
  sessionsCount: number;
  paymentStatus: "pending" | "submitted" | "paid";
  paymentMethod: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
}

function bookingDate(b: MyBooking): Date {
  const d = new Date(`${b.weekStart}T00:00:00`);
  d.setDate(d.getDate() + b.dayOfWeek);
  return d;
}

export default function MyBookings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(() => readUserToken());
  const [phone, setPhone] = useState<string | null>(() => readUserPhone());
  const [otpOpen, setOtpOpen] = useState(false);
  const [bookings, setBookings] = useState<MyBooking[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-bookings", {
        headers: { "x-user-token": t },
      });
      if (res.status === 401) {
        clearUserSession();
        setToken(null);
        setPhone(null);
        toast({ title: "انتهت الجلسة", description: "سجّل دخولك مجدداً.", variant: "destructive" });
        return;
      }
      if (res.ok) setBookings(await res.json());
    } catch {
      toast({ title: "خطأ في التحميل", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBookings(token);
  }, [token]);

  const handleLogout = async () => {
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-user-token": token },
      }).catch(() => {});
    }
    clearUserSession();
    setToken(null);
    setPhone(null);
    setBookings(null);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 grid place-items-center py-12">
          <div className="text-center space-y-4 max-w-sm px-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold">حجوزاتي</h1>
            <p className="text-muted-foreground text-sm">
              سجّل دخولك برقم موبايلك لتعرض جميع حجوزاتك.
            </p>
            <Button className="font-extrabold" onClick={() => setOtpOpen(true)}>
              تسجيل الدخول
            </Button>
            <div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/">العودة للرئيسية</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
        <OtpLoginDialog
          open={otpOpen}
          onOpenChange={setOtpOpen}
          onLoggedIn={(t, p) => { setToken(t); setPhone(p); }}
        />
      </div>
    );
  }

  const paid = bookings?.filter((b) => b.paymentStatus === "paid") ?? [];
  const pending = bookings?.filter((b) => b.paymentStatus !== "paid") ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-8 sm:py-12">
        <div className="container max-w-3xl space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-primary">حجوزاتي</h1>
              <p className="text-sm text-muted-foreground" dir="ltr">{phone}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 ml-1" />
              خروج
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center text-muted-foreground">
                <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>لا توجد حجوزات بعد.</p>
                <Button asChild className="mt-4">
                  <Link href="/">احجز الآن</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {[...paid, ...pending].map((b, i) => {
                const date = bookingDate(b);
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-border bg-card p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-base">
                            {ARABIC_DAYS[b.dayOfWeek]} {formatArabicDate(date)}
                          </span>
                          <span className="text-primary font-bold" dir="ltr">
                            {formatMinutes(b.startMinutes)}
                          </span>
                          {b.paymentStatus === "paid" ? (
                            <Badge className="bg-green-500/15 text-green-600 border border-green-500/30 font-bold gap-1">
                              <CheckCircle2 className="h-3 w-3" />مؤكد
                            </Badge>
                          ) : b.paymentStatus === "submitted" ? (
                            <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 font-bold gap-1">
                              <Clock3 className="h-3 w-3" />قيد المراجعة
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="font-bold">في انتظار الدفع</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {b.sessionsCount} حصص · {b.priceEgp} ج.م
                          {b.paymentMethod && ` · ${b.paymentMethod === "vodafone_cash" ? "Vodafone Cash" : "InstaPay"}`}
                        </div>
                        {b.paidAt && (
                          <div className="text-xs text-green-600">
                            تم الدفع: {new Date(b.paidAt).toLocaleDateString("ar-EG")}
                          </div>
                        )}
                      </div>
                      {b.paymentStatus === "pending" && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/booking/${b.id}`}>إكمال الدفع</Link>
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
