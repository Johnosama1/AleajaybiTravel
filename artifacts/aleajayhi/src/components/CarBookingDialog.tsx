import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Clock,
  Calendar,
  XCircle,
} from "lucide-react";
import {
  useGetSchedule,
  useGetAvailability,
  useCreateBooking,
  getGetAvailabilityQueryKey,
  getGetBookingStatsQueryKey,
  getListBookingsQueryKey,
  type Car,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getSaturdayOfWeek,
  formatDateToYYYYMMDD,
  ARABIC_DAYS,
  formatHour,
  addDays,
  formatArabicDate,
} from "@/lib/date";
import { useToast } from "@/hooks/use-toast";

interface CarBookingDialogProps {
  car: Car | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CarBookingDialog({
  car,
  open,
  onOpenChange,
}: CarBookingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [weekSaturday, setWeekSaturday] = useState(() =>
    getSaturdayOfWeek(new Date()),
  );
  const weekStartString = formatDateToYYYYMMDD(weekSaturday);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Reset state every time the dialog opens for a (potentially different) car
  useEffect(() => {
    if (open) {
      setSelectedDay(null);
      setSelectedHour(null);
      setName("");
      setPhone("");
      setNotes("");
      setBookingSuccess(false);
      setWeekSaturday(getSaturdayOfWeek(new Date()));
    }
  }, [open, car?.id]);

  const { data: schedule } = useGetSchedule();
  const carId = car?.id ?? 0;
  const { data: availability, isLoading: availabilityLoading } =
    useGetAvailability(
      { weekStart: weekStartString, carId },
      {
        query: {
          enabled: open && carId > 0,
          queryKey: getGetAvailabilityQueryKey({
            weekStart: weekStartString,
            carId,
          }),
        },
      },
    );

  const createBookingMutation = useCreateBooking();

  const days = useMemo(() => {
    if (!schedule || !car) return [] as number[];
    return car.transmission === "automatic"
      ? schedule.daysAutomatic
      : schedule.daysManual;
  }, [schedule, car]);

  const hours = schedule?.hours ?? [];

  const bookedSet = useMemo(
    () => new Set(availability?.bookedSlots ?? []),
    [availability],
  );

  const handlePrevWeek = () => {
    setWeekSaturday((d) => addDays(d, -7));
    setSelectedDay(null);
    setSelectedHour(null);
  };
  const handleNextWeek = () => {
    setWeekSaturday((d) => addDays(d, 7));
    setSelectedDay(null);
    setSelectedHour(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;
    if (selectedDay === null || selectedHour === null) {
      toast({
        title: "اختر موعد",
        description: "يرجى اختيار يوم وساعة من الجدول.",
        variant: "destructive",
      });
      return;
    }
    if (!name || name.trim().length < 2) {
      toast({
        title: "بيانات ناقصة",
        description: "أدخل اسمك بالكامل.",
        variant: "destructive",
      });
      return;
    }
    if (!phone || phone.trim().length < 6) {
      toast({
        title: "بيانات ناقصة",
        description: "أدخل رقم هاتف صحيح.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createBookingMutation.mutateAsync({
        data: {
          carId: car.id,
          name: name.trim(),
          phone: phone.trim(),
          weekStart: weekStartString,
          dayOfWeek: selectedDay,
          hour: selectedHour,
          notes: notes.trim() || undefined,
        },
      });

      queryClient.invalidateQueries({
        queryKey: getGetAvailabilityQueryKey({
          weekStart: weekStartString,
          carId: car.id,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getGetBookingStatsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getListBookingsQueryKey(),
      });

      setBookingSuccess(true);

      const schoolPhone = schedule?.whatsappPhone || "201099399666";
      const transmissionLabel =
        car.transmission === "automatic" ? "أوتوماتيك" : "مانيوال";
      const message = `مرحباً، أود تأكيد حجزي لتدريب القيادة في مدرسة العجايبي.
السيارة: ${car.name} (${transmissionLabel})
الاسم: ${name}
الموبايل: ${phone}
اليوم: ${ARABIC_DAYS[selectedDay]}
الساعة: ${formatHour(selectedHour)}
بداية الأسبوع: ${weekStartString}
${notes ? `ملاحظات: ${notes}` : ""}`;

      const waUrl = `https://wa.me/${schoolPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
    } catch (error: unknown) {
      const msg =
        (error as { message?: string })?.message ||
        "حدث خطأ غير متوقع، حاول مرة أخرى.";
      toast({
        title: "فشل الحجز",
        description: msg,
        variant: "destructive",
      });
    }
  };

  if (!car) return null;

  const transmissionLabel =
    car.transmission === "automatic" ? "أوتوماتيك" : "مانيوال";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[92vh] overflow-y-auto p-0"
        data-testid="dialog-car-booking"
      >
        <DialogHeader className="p-5 sm:p-6 pb-3 border-b border-border/60 text-right">
          <DialogTitle className="flex items-center gap-3 text-right text-xl sm:text-2xl">
            <span className="text-primary">{car.name}</span>
            <Badge
              variant="secondary"
              className="bg-primary/15 text-primary border border-primary/30 font-bold"
            >
              {transmissionLabel}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-right text-sm">
            اختر اليوم والساعة المناسبين لك من الأيام المتاحة لهذه السيارة.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {bookingSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center flex flex-col items-center gap-4"
              data-testid="card-booking-success"
            >
              <div className="w-16 h-16 bg-green-500/15 text-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-extrabold">تم الحجز بنجاح!</h3>
              <p className="text-muted-foreground max-w-md">
                شكراً لك يا {name}. تم تسجيل موعدك على {car.name}. لو واتساب لم
                يفتح تلقائيًا، تواصل معنا مباشرة لتأكيد الحجز.
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                size="lg"
                className="font-bold mt-2"
                data-testid="button-close-success"
              >
                تمام
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 sm:p-6 space-y-6"
            >
              {/* Week navigator */}
              <div className="flex items-center justify-between gap-2 bg-muted/40 rounded-xl p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextWeek}
                  data-testid="button-next-week"
                  className="font-bold"
                >
                  <ChevronRight className="h-4 w-4 ml-1" />
                  التالي
                </Button>
                <div className="text-center">
                  <div className="text-[11px] text-muted-foreground">
                    أسبوع التدريب
                  </div>
                  <div className="font-extrabold text-sm" dir="ltr">
                    {weekStartString}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevWeek}
                  data-testid="button-prev-week"
                  className="font-bold"
                >
                  السابق
                  <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
              </div>

              {/* Days */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-foreground/80">
                  <Calendar className="h-4 w-4 text-primary" />
                  الأيام المتاحة لهذه السيارة
                </div>
                {availabilityLoading ? (
                  <div className="py-6 flex items-center justify-center text-primary">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {days.map((dayIdx) => {
                      const date = addDays(weekSaturday, dayIdx);
                      const isActive = selectedDay === dayIdx;
                      // Count free slots that day
                      const freeCount = hours.filter(
                        (h) => !bookedSet.has(`${dayIdx}-${h}`),
                      ).length;
                      const isFull = freeCount === 0;
                      return (
                        <button
                          key={dayIdx}
                          type="button"
                          disabled={isFull}
                          onClick={() => {
                            setSelectedDay(dayIdx);
                            setSelectedHour(null);
                          }}
                          data-testid={`button-day-${dayIdx}`}
                          className={`rounded-xl p-3 text-center border-2 transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : isFull
                                ? "bg-destructive/5 border-destructive/20 text-muted-foreground cursor-not-allowed opacity-60"
                                : "bg-card border-border hover:border-primary hover:bg-primary/5"
                          }`}
                        >
                          <div className="text-base font-extrabold">
                            {ARABIC_DAYS[dayIdx]}
                          </div>
                          <div
                            className={`text-[11px] mt-1 ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                          >
                            {formatArabicDate(date)}
                          </div>
                          <div
                            className={`text-[11px] mt-1 font-medium ${isActive ? "text-primary-foreground" : isFull ? "text-destructive" : "text-primary"}`}
                          >
                            {isFull
                              ? "مكتمل"
                              : `${freeCount} موعد متاح`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hours */}
              {selectedDay !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-3 text-sm font-bold text-foreground/80">
                    <Clock className="h-4 w-4 text-primary" />
                    المواعيد يوم {ARABIC_DAYS[selectedDay]}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {hours.map((hour) => {
                      const slotKey = `${selectedDay}-${hour}`;
                      const isBooked = bookedSet.has(slotKey);
                      const isActive = selectedHour === hour;
                      return (
                        <button
                          key={hour}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedHour(hour)}
                          data-testid={`button-hour-${hour}`}
                          className={`rounded-lg py-2.5 text-sm font-extrabold border transition-all ${
                            isBooked
                              ? "bg-destructive/10 text-destructive border-destructive/20 cursor-not-allowed line-through"
                              : isActive
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-secondary border-border hover:border-primary hover:text-primary"
                          }`}
                        >
                          <span dir="ltr">{formatHour(hour)}</span>
                          {isBooked && (
                            <XCircle className="inline-block h-3 w-3 mr-1 align-middle" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Form */}
              {selectedDay !== null && selectedHour !== null && (
                <motion.form
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 border-t border-border/60 pt-5"
                >
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-center">
                    <div className="text-xs text-muted-foreground">
                      الموعد المختار
                    </div>
                    <div className="font-extrabold text-primary">
                      {ARABIC_DAYS[selectedDay]} -{" "}
                      <span dir="ltr" className="inline-block">
                        {formatHour(selectedHour)}
                      </span>{" "}
                      • {car.name}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="name">الاسم بالكامل</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك"
                      required
                      data-testid="input-name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">رقم الواتساب</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      type="tel"
                      dir="ltr"
                      required
                      data-testid="input-phone"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أي تفاصيل إضافية..."
                      className="resize-none min-h-[70px]"
                      data-testid="input-notes"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 font-extrabold text-base"
                    disabled={createBookingMutation.isPending}
                    data-testid="button-submit-booking"
                  >
                    {createBookingMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                        جاري الحجز...
                      </>
                    ) : (
                      "تأكيد الحجز عبر واتساب"
                    )}
                  </Button>
                </motion.form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
