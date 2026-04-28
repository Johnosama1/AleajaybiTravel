import React, { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  useListBookings,
  useListCars,
} from "@workspace/api-client-react";
import { ARABIC_DAYS, formatMinutes } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarCheck, Inbox, Loader2, Car as CarIcon } from "lucide-react";
import { motion } from "framer-motion";

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) =>
      p.length <= 2 ? p : p[0] + "*".repeat(Math.min(3, p.length - 2)) + p.slice(-1),
    )
    .join(" ");
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return phone.slice(0, 3) + "*****" + phone.slice(-2);
}

export default function BookingsTaken() {
  const { data: bookings, isLoading: bookingsLoading } = useListBookings();
  const { data: cars } = useListCars();
  const [carFilter, setCarFilter] = useState<number | "all">("all");

  const carById = useMemo(() => {
    const m = new Map<number, { name: string; transmission: string }>();
    (cars ?? []).forEach((c) =>
      m.set(c.id, { name: c.name, transmission: c.transmission }),
    );
    return m;
  }, [cars]);

  const filtered = useMemo(() => {
    const list = (bookings ?? []).filter(
      (b) => carFilter === "all" || b.carId === carFilter,
    );
    // Newest week first, then day asc, hour asc
    return [...list].sort((a, b) => {
      if (a.weekStart !== b.weekStart) {
        return b.weekStart.localeCompare(a.weekStart);
      }
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startMinutes - b.startMinutes;
    });
  }, [bookings, carFilter]);

  // Group by week
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((b) => {
      const list = map.get(b.weekStart) ?? [];
      list.push(b);
      map.set(b.weekStart, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <div className="container max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3 bg-primary/15 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold">
              <CalendarCheck className="h-4 w-4" />
              المواعيد المحجوزة
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-primary">
              الحجز المأخوذ
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              قائمة بكل المواعيد اللي اتحجزت عشان تشوف الأوقات الفاضية الباقية.
            </p>
          </div>

          {/* Car filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setCarFilter("all")}
              data-testid="filter-car-all"
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                carFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary"
              }`}
            >
              كل السيارات
            </button>
            {cars?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCarFilter(c.id)}
                data-testid={`filter-car-${c.id}`}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${
                  carFilter === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:border-primary"
                }`}
              >
                <CarIcon className="h-3.5 w-3.5" />
                {c.name}
              </button>
            ))}
          </div>

          {bookingsLoading ? (
            <div className="py-20 flex flex-col items-center text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-3 text-sm text-muted-foreground">
                جاري تحميل الحجوزات...
              </p>
            </div>
          ) : grouped.length === 0 ? (
            <Card className="bg-card/60 border-dashed">
              <CardContent className="py-14 text-center flex flex-col items-center gap-3">
                <Inbox className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="font-extrabold text-lg">لا توجد حجوزات بعد</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  لسه مفيش أي حجز مسجل. ارجع للصفحة الرئيسية واختار سيارة
                  وموعدك.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {grouped.map(([week, items], gi) => (
                <motion.div
                  key={week}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/40 py-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="text-muted-foreground text-sm">
                          أسبوع
                        </span>
                        <span className="font-extrabold" dir="ltr">
                          {week}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ul className="divide-y divide-border/60">
                        {items.map((b) => {
                          const car = carById.get(b.carId);
                          return (
                            <li
                              key={b.id}
                              className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3"
                              data-testid={`booking-row-${b.id}`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-foreground/90">
                                    {ARABIC_DAYS[b.dayOfWeek]}
                                  </span>
                                  <span
                                    className="text-primary font-extrabold"
                                    dir="ltr"
                                  >
                                    {formatMinutes(b.startMinutes)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {maskName(b.name)} • {maskPhone(b.phone)}
                                </div>
                              </div>
                              {car && (
                                <Badge
                                  variant="secondary"
                                  className={`font-bold shrink-0 ${
                                    car.transmission === "automatic"
                                      ? "bg-blue-500/15 text-blue-500 border border-blue-500/30"
                                      : "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                  }`}
                                >
                                  {car.name}
                                </Badge>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
