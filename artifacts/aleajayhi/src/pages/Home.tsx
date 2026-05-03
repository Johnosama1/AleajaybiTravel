import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CarBookingDialog } from "@/components/CarBookingDialog";
import {
  useListCars,
  useGetBookingStats,
  type Car,
} from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { CalendarDays, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoImage from "@assets/photo_2026-04-28_17-50-50_1777391528214.jpg";
import nissanImage from "@assets/photo_2026-04-28_17-50-56_1777391528214.jpg";
import fiatImage from "@assets/photo_2026-04-28_17-51-01_1777391528213.jpg";
import offerAutoImage from "@assets/photo_2026-05-03_03-17-47_1777771087443.jpg";
import offerManualImage from "@assets/photo_2026-05-03_03-17-55_1777771121436.jpg";

const CAR_IMAGES: Record<string, string> = {
  "/cars/nissan-sunny.jpg": nissanImage,
  "/cars/fiat-128.jpg": fiatImage,
};

function getCarImage(car: Car): string {
  return CAR_IMAGES[car.imageUrl] ?? car.imageUrl;
}

export default function Home() {
  const {
    data: cars,
    isLoading: carsLoading,
    isError: carsError,
    isFetching: carsFetching,
    refetch: refetchCars,
  } = useListCars({
    query: {
      retry: 10,
      retryDelay: 2000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchInterval: (query) =>
        query.state.status === "error" ? 3000 : false,
    },
  });
  const { data: stats } = useGetBookingStats({
    query: { retry: 5, retryDelay: 2000 },
  });
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const scrollToCars = () => {
    document.getElementById("cars")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Header />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/15 via-background to-background"
            aria-hidden
          />
          <div className="container py-10 sm:py-16 lg:py-20 flex flex-col items-center text-center gap-6">
            <motion.img
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              src={logoImage}
              alt="Aleajaybi Travel"
              className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-full ring-4 ring-primary/30 shadow-2xl"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-3"
            >
              <Badge
                variant="secondary"
                className="bg-primary/15 text-primary border border-primary/30 font-bold text-xs px-3 py-1"
              >
                ✦ الخيار الأول لتعليم القيادة
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-3xl">
                <span className="text-primary">Aleajaybi Travel</span>
                <br />
                <span className="text-foreground">
                  ابدأ رحلتك نحو القيادة بثقة
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed px-2">
                احجز موعدك الآن مع مدربينا المحترفين واختر السيارة المناسبة
                لك — مانيوال أو أوتوماتيك.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
            >
              <Button
                size="lg"
                className="h-12 font-extrabold text-base flex-1"
                onClick={scrollToCars}
                data-testid="button-hero-book"
              >
                <CalendarDays className="ml-2 h-5 w-5" />
                احجز موعدك الآن
              </Button>
            </motion.div>

            {/* Stats strip */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-3 w-full max-w-md mt-4"
              >
                <div className="bg-card border border-border rounded-2xl py-3 px-4 text-center">
                  <div className="text-2xl font-extrabold text-primary">
                    {stats.totalBookings}+
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    متدرب سعيد
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl py-3 px-4 text-center">
                  <div className="text-2xl font-extrabold text-primary">
                    {stats.thisWeekBookings}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    حجز هذا الأسبوع
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* CARS SHOWCASE */}
        <section id="cars" className="py-12 sm:py-16 bg-card/40">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
                اختر <span className="text-primary">سيارة التدريب</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                اضغط على أي سيارة لعرض الأيام والمواعيد المتاحة وتأكيد الحجز
                مباشرة.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-7 max-w-4xl mx-auto">
              {carsError && !carsFetching ? (
                <div className="col-span-full flex flex-col items-center gap-4 py-10 text-center">
                  <p className="text-muted-foreground text-sm">تعذّر تحميل السيارات. جارٍ إعادة المحاولة...</p>
                  <Button variant="outline" onClick={() => refetchCars()}>إعادة المحاولة الآن</Button>
                </div>
              ) : carsLoading || carsFetching || !cars
                ? Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-muted" />
                      <div className="p-5 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  ))
                : cars.map((car, i) => {
                    const transmissionLabel =
                      car.transmission === "automatic"
                        ? "أوتوماتيك"
                        : "مانيوال";
                    return (
                      <motion.button
                        key={car.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedCar(car)}
                        data-testid={`button-car-${car.id}`}
                        className="group text-right bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/60 transition-all"
                      >
                        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                          <img
                            src={getCarImage(car)}
                            alt={car.name}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge
                              className={`font-extrabold ${
                                car.transmission === "automatic"
                                  ? "bg-blue-500 hover:bg-blue-500 text-white"
                                  : "bg-amber-500 hover:bg-amber-500 text-black"
                              }`}
                            >
                              {transmissionLabel}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg sm:text-xl font-extrabold text-primary">
                              {car.name}
                            </h3>
                            <ArrowLeft className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                            {car.description}
                          </p>
                          <div className="mt-4 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-2 text-primary font-bold text-sm">
                              <CalendarDays className="h-4 w-4" />
                              عرض المواعيد المتاحة
                            </div>
                            <span className="text-xs bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-full">
                              احجز الآن
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
            </div>
          </div>
        </section>

        {/* OFFERS */}
        <section className="py-12 sm:py-16">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
                عروضنا <span className="text-primary">الخاصة</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                عروض حصرية لشهر مايو — اضغط على العرض لحجز موعدك فوراً!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {[
                { img: offerManualImage, transmission: "automatic", alt: "عرض فيات 128" },
                { img: offerAutoImage, transmission: "manual", alt: "عرض نيسان صاني" },
              ].map((offer, i) => {
                const car = cars?.find((c) => c.transmission === offer.transmission) ?? null;
                return (
                  <motion.button
                    key={offer.transmission}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => car && setSelectedCar(car)}
                    disabled={!car}
                    className="rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer text-right w-full"
                  >
                    <img
                      src={offer.img}
                      alt={offer.alt}
                      className="w-full h-auto object-cover block"
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHY US */}
        <section className="py-12 sm:py-16">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
                لماذا <span className="text-primary">العجايبي؟</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "مدربون معتمدون",
                  desc: "خبرة وكفاءة لضمان قيادة آمنة.",
                },
                {
                  icon: CalendarDays,
                  title: "مرونة في المواعيد",
                  desc: "اختر اليوم والساعة اللي تناسبك.",
                },
                {
                  icon: Sparkles,
                  title: "سيارات مجهزة",
                  desc: "مانيوال وأوتوماتيك بحالة ممتازة.",
                },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card border border-border rounded-2xl p-5 text-center"
                  >
                    <div className="w-12 h-12 mx-auto bg-primary/15 text-primary rounded-full flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-extrabold text-base mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />

      <CarBookingDialog
        car={selectedCar}
        open={selectedCar !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCar(null);
        }}
      />
    </div>
  );
}
