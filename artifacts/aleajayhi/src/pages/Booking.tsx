import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { 
  useGetSchedule, 
  useGetAvailability, 
  useCreateBooking, 
  getGetAvailabilityQueryKey,
  getGetBookingStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getSaturdayOfWeek, formatDateToYYYYMMDD, ARABIC_DAYS, formatHour } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Booking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Start with current week's Saturday
  const [currentDate, setCurrentDate] = useState(() => getSaturdayOfWeek(new Date()));
  const weekStartString = formatDateToYYYYMMDD(currentDate);

  // Selected slot state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { data: schedule, isLoading: scheduleLoading } = useGetSchedule();
  const { data: availability, isLoading: availabilityLoading } = useGetAvailability(
    { weekStart: weekStartString },
    { query: { enabled: !!weekStartString, queryKey: getGetAvailabilityQueryKey({ weekStart: weekStartString }) } }
  );

  const createBookingMutation = useCreateBooking();

  const handlePreviousWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
    setSelectedDay(null);
    setSelectedHour(null);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
    setSelectedDay(null);
    setSelectedHour(null);
  };

  const handleTodayWeek = () => {
    setCurrentDate(getSaturdayOfWeek(new Date()));
    setSelectedDay(null);
    setSelectedHour(null);
  };

  const bookedSet = useMemo(() => {
    return new Set(availability?.bookedSlots || []);
  }, [availability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDay === null || selectedHour === null) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الموعد المناسب أولاً.",
        variant: "destructive"
      });
      return;
    }

    if (!name || name.length < 2) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم صحيح", variant: "destructive" });
      return;
    }
    
    if (!phone || phone.length < 6) {
      toast({ title: "خطأ", description: "يرجى إدخال رقم هاتف صحيح", variant: "destructive" });
      return;
    }

    try {
      await createBookingMutation.mutateAsync({
        data: {
          name,
          phone,
          weekStart: weekStartString,
          dayOfWeek: selectedDay,
          hour: selectedHour,
          notes: notes || undefined
        }
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: getGetAvailabilityQueryKey({ weekStart: weekStartString }) });
      queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });

      setBookingSuccess(true);

      // Build WhatsApp Link
      const schoolPhone = schedule?.whatsappPhone || "201099399666";
      const message = `مرحباً، أود تأكيد حجزي لتدريب القيادة.
الاسم: ${name}
الموبايل: ${phone}
اليوم: ${ARABIC_DAYS[selectedDay]}
الساعة: ${formatHour(selectedHour)}
بداية الأسبوع: ${weekStartString}
${notes ? `ملاحظات: ${notes}` : ''}`;

      const waUrl = `https://wa.me/${schoolPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

    } catch (error: any) {
      toast({
        title: "فشل الحجز",
        description: error.message || "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setBookingSuccess(false);
    setSelectedDay(null);
    setSelectedHour(null);
    setName("");
    setPhone("");
    setNotes("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-primary">احجز موعد التدريب</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              اختر الوقت المناسب لك من الجدول أدناه. بمجرد إتمام الحجز سيتم نقلك إلى واتساب لتأكيد الموعد مباشرة مع الإدارة.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {bookingSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-card border-border border p-12 rounded-2xl text-center flex flex-col items-center max-w-2xl mx-auto shadow-xl"
              >
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold mb-4">تم الحجز بنجاح!</h2>
                <p className="text-muted-foreground mb-8">
                  شكراً لك {name}. لقد تم تسجيل موعدك. إذا لم يتم فتح واتساب تلقائياً، يمكنك التواصل معنا مباشرة.
                </p>
                <Button onClick={resetForm} size="lg" className="px-8 font-bold">
                  حجز موعد آخر
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Calendar Section */}
                <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <Button variant="outline" size="icon" onClick={handleNextWeek} aria-label="الأسبوع القادم">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">أسبوع التدريب</div>
                      <div className="font-bold text-lg" dir="ltr">{weekStartString}</div>
                      <Button variant="link" size="sm" onClick={handleTodayWeek} className="h-6 p-0 text-primary">العودة للأسبوع الحالي</Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={handlePreviousWeek} aria-label="الأسبوع السابق">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  </div>

                  {scheduleLoading || availabilityLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-primary">
                      <Loader2 className="h-10 w-10 animate-spin mb-4" />
                      <p>جاري تحميل المواعيد...</p>
                    </div>
                  ) : !schedule ? (
                    <div className="py-20 text-center text-muted-foreground">لا توجد مواعيد متاحة حالياً</div>
                  ) : (
                    <div className="overflow-x-auto pb-4">
                      <div className="min-w-[600px]">
                        {/* Days Header */}
                        <div className="grid grid-cols-8 gap-2 mb-4">
                          <div className="col-span-1"></div>
                          {schedule.days.map((day) => (
                            <div key={day} className="text-center font-bold text-sm bg-muted rounded-md py-2">
                              {ARABIC_DAYS[day]}
                            </div>
                          ))}
                        </div>

                        {/* Hours Rows */}
                        <div className="space-y-2">
                          {schedule.hours.map((hour) => (
                            <div key={hour} className="grid grid-cols-8 gap-2">
                              <div className="text-center flex items-center justify-center font-medium text-sm text-muted-foreground" dir="ltr">
                                {formatHour(hour)}
                              </div>
                              {schedule.days.map((day) => {
                                const slotKey = `${day}-${hour}`;
                                const isBooked = bookedSet.has(slotKey);
                                const isSelected = selectedDay === day && selectedHour === hour;

                                return (
                                  <div key={slotKey} className="aspect-[2/1] sm:aspect-auto sm:h-12 relative">
                                    <button
                                      type="button"
                                      disabled={isBooked}
                                      onClick={() => {
                                        setSelectedDay(day);
                                        setSelectedHour(hour);
                                      }}
                                      className={`w-full h-full rounded-md text-xs font-bold transition-all
                                        ${isBooked 
                                          ? "bg-destructive/10 text-destructive cursor-not-allowed border border-destructive/20" 
                                          : isSelected
                                            ? "bg-primary text-primary-foreground shadow-md scale-105 z-10"
                                            : "bg-secondary border border-border hover:border-primary hover:text-primary"
                                        }
                                      `}
                                    >
                                      {isBooked ? "محجوز" : isSelected ? "محدد" : "متاح"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Section */}
                <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-xl font-bold mb-6 border-b border-border/50 pb-4">تفاصيل الحجز</h3>
                  
                  {selectedDay !== null && selectedHour !== null ? (
                    <div className="mb-6 bg-primary/10 border border-primary/20 rounded-xl p-4">
                      <div className="text-sm text-muted-foreground mb-1">الموعد المحدد:</div>
                      <div className="font-bold text-lg text-primary">
                        {ARABIC_DAYS[selectedDay]}، {formatHour(selectedHour)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1" dir="ltr">
                        {weekStartString}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 bg-muted/50 rounded-xl p-4 text-center text-sm text-muted-foreground border border-dashed border-border">
                      يرجى اختيار موعد من الجدول للمتابعة
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الثلاثي</Label>
                      <Input 
                        id="name" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        className="bg-background"
                        required
                        disabled={createBookingMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف (واتساب)</Label>
                      <Input 
                        id="phone" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="bg-background"
                        type="tel"
                        dir="ltr"
                        required
                        disabled={createBookingMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
                      <Textarea 
                        id="notes" 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="أي تفاصيل أخرى تود إضافتها..."
                        className="bg-background resize-none min-h-[100px]"
                        disabled={createBookingMutation.isPending}
                      />
                    </div>
                    <div className="pt-4 mt-auto">
                      <Button 
                        type="submit" 
                        className="w-full h-12 font-bold text-lg" 
                        disabled={selectedDay === null || selectedHour === null || createBookingMutation.isPending}
                      >
                        {createBookingMutation.isPending ? (
                          <>
                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                            جاري الحجز...
                          </>
                        ) : (
                          "تأكيد الحجز"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
