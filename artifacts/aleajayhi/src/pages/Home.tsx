import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useGetBookingStats, useListCars } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import logoImage from "@assets/photo_2026-04-28_17-50-50_1777391528214.jpg";
import nissanImage from "@assets/photo_2026-04-28_17-51-01_1777391528213.jpg";
import fiatImage from "@assets/photo_2026-04-28_17-50-56_1777391528214.jpg";

export default function Home() {
  const { data: stats } = useGetBookingStats();
  const { data: cars } = useListCars();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32">
          <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-start text-right space-y-6"
            >
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                الخيار الأول في تعليم القيادة
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                ابدأ رحلتك نحو <span className="text-primary">القيادة الآمنة</span> بثقة تامة
              </h1>
              <p className="text-lg text-muted-foreground max-w-[600px] leading-relaxed">
                في مدرسة العجاهي، نقدم لك أحدث أساليب التدريب مع مدربين معتمدين وسيارات مجهزة لضمان حصولك على رخصة القيادة وامتلاك المهارة الحقيقية.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/booking">
                  <Button size="lg" className="h-12 px-8 text-base font-bold text-primary-foreground">
                    احجز موعدك الآن
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    تواصل معنا
                  </Button>
                </Link>
              </div>
              
              {stats && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="mt-8 flex gap-8 items-center bg-card p-6 rounded-2xl border border-border"
                >
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-primary">{stats.totalBookings}+</span>
                    <span className="text-sm text-muted-foreground">متدرب سعيد</span>
                  </div>
                  <div className="w-px h-12 bg-border"></div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-primary">{stats.thisWeekBookings}</span>
                    <span className="text-sm text-muted-foreground">حجوزات هذا الأسبوع</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mx-auto lg:mx-0 w-full max-w-md aspect-square flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
              <img 
                src={logoImage} 
                alt="Aleajayhi Brand" 
                className="relative z-10 w-full object-contain rounded-2xl shadow-2xl border-4 border-primary/20" 
              />
            </motion.div>
          </div>
        </section>

        {/* Cars Showcase */}
        <section className="py-24 bg-card">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">سيارات التدريب الخاصة بنا</h2>
              <p className="text-muted-foreground">
                نوفر لك أسطولاً من السيارات الحديثة (عادي وأوتوماتيك) المجهزة بالكامل لضمان أعلى مستويات الأمان والراحة أثناء التدريب.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                whileHover={{ y: -5 }}
                className="group overflow-hidden rounded-2xl border border-border bg-background flex flex-col"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                  <img 
                    src={nissanImage} 
                    alt="Nissan Sunny" 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold mb-2">نيسان صني (أوتوماتيك)</h3>
                  <p className="text-muted-foreground text-sm">
                    سيارة التدريب الأوتوماتيك المثالية. توفر راحة تامة وسهولة في التحكم للمبتدئين.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="group overflow-hidden rounded-2xl border border-border bg-background flex flex-col"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                  <img 
                    src={fiatImage} 
                    alt="Fiat Manual" 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold mb-2">فيات (مانيوال)</h3>
                  <p className="text-muted-foreground text-sm">
                    سيارة التدريب العادي. الخيار الأمثل لإتقان القيادة والتحكم الكامل في السيارة.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-24">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">لماذا تختار <span className="text-primary">العجاهي؟</span></h2>
              <p className="text-muted-foreground">
                نحن لا نعلمك فقط كيف تقود، بل نعلمك كيف تكون سائقاً آمناً وواثقاً على الطريق.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "مدربون محترفون",
                  desc: "فريق من المدربين المعتمدين وذوي الخبرة الطويلة لضمان تعليمك بأفضل الطرق."
                },
                {
                  title: "مرونة في المواعيد",
                  desc: "نظام حجز إلكتروني يتيح لك اختيار الأوقات التي تناسب جدولك بكل سهولة."
                },
                {
                  title: "سيارات مجهزة",
                  desc: "أحدث السيارات المجهزة بوسائل الأمان الإضافية لضمان سلامتك أثناء التدريب."
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card p-8 rounded-2xl border border-border text-center flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                    {/* Placeholder icon since we don't import too many lucide icons to save space, but let's use simple CSS shapes */}
                    <div className="w-8 h-8 rounded-sm bg-primary transform rotate-45" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
