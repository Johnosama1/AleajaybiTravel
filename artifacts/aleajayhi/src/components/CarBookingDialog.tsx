import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";
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
  formatMinutes,
  addDays,
  formatArabicDate,
} from "@/lib/date";
import { useToast } from "@/hooks/use-toast";
import { PricingCard } from "@/components/PricingCard";

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
  const [, setLocation] = useLocation();

  const weekSaturday = useMemo(() => getSaturdayOfWeek(new Date()), []);
  const weekStartString = formatDateToYYYYMMDD(weekSaturday);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedDay(null);
      setSelectedSlot(null);
      setName("");
      setPhone("");
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

  const slots = schedule?.slots ?? [];

  const bookedSet = useMemo(
    () => new Set(availability?.bookedSlots ?? []),
    [availability],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car || selectedDay === null || selectedSlot === null) return;

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
      const created = await createBookingMutation.mutateAsync({
        data: {
          carId: car.id,
          name: name.trim(),
          phone: phone.trim(),
          weekStart: weekStartString,
          dayOfWeek: selectedDay,
          startMinutes: selectedSlot,
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

      onOpenChange(false);
      setLocation(`/booking/${created.id}`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl max-h-[92vh] overflow-y-auto p-0"
        data-testid="dialog-car-booking"
      >
        <DialogHeader className="p-5 sm:p-6 pb-3 border-b border-border/60 text-right">
          <DialogTitle className="text-right text-xl sm:text-2xl text-primary">
            {car.name}
          </DialogTitle>
          <DialogDescription className="text-right text-sm text-muted-foreground">
            اختر الموعد المناسب ثم أدخل بياناتك لإتمام الحجز.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 sm:p-6 space-y-5"
          >
            <PricingCard variant="compact" />
              {availabilityLoading ? (
                <div className="py-10 flex items-center justify-center text-primary">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-5">
                  {days.map((dayIdx) => {
                    const date = addDays(weekSaturday, dayIdx);
                    const availableSlots = slots.filter(
                      (m) => !bookedSet.has(`${dayIdx}-${m}`),
                    );
                    if (availableSlots.length === 0) return null;
                    return (
                      <div
                        key={dayIdx}
                        className="rounded-2xl border border-border/60 bg-card/60 p-4"
                        data-testid={`day-block-${dayIdx}`}
                      >
                        <div className="flex items-baseline justify-between gap-3 mb-3">
                          <div className="text-lg font-extrabold text-primary">
                            {ARABIC_DAYS[dayIdx]}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatArabicDate(date)}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((m) => {
                            const isActive =
                              selectedDay === dayIdx && selectedSlot === m;
                            return (
                              <button
                                key={`${dayIdx}-${m}`}
                                type="button"
                                onClick={() => {
                                  setSelectedDay(dayIdx);
                                  setSelectedSlot(m);
                                }}
                                data-testid={`button-slot-${dayIdx}-${m}`}
                                className={`rounded-lg py-2.5 text-sm font-extrabold border-2 transition-all ${
                                  isActive
                                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                    : "bg-secondary border-border hover:border-primary hover:text-primary"
                                }`}
                              >
                                <span dir="ltr">{formatMinutes(m)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedDay !== null && selectedSlot !== null && (
                <motion.form
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 border-t border-border/60 pt-5"
                >
                  <div className="space-y-1.5">
                    <Label>نوع السيارة</Label>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-bold text-foreground">
                      🚗 {car.name}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({car.transmission === "automatic" ? "أوتوماتيك" : "مانيوال"})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="name">الاسم</Label>
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

                  <Button
                    type="submit"
                    className="w-full h-12 font-extrabold text-base gap-2"
                    disabled={createBookingMutation.isPending}
                    data-testid="button-submit-booking"
                  >
                    {createBookingMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري الحجز...
                      </>
                    ) : (
                      <>
                        احجز وادفع
                        <ChevronRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    بعد الضغط هتنتقل لصفحة الدفع لتأكيد الحجز.
                  </p>
                </motion.form>
              )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
