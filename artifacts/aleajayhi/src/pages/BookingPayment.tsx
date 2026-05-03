import { useEffect, useMemo, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  ImagePlus,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getGetBookingQueryKey,
  useGetBooking,
  useGetPricing,
  useListCars,
  useSubmitBookingPayment,
  type Booking,
  type SubmitPaymentRequest,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ARABIC_DAYS, formatMinutes, formatArabicDate } from "@/lib/date";
import { useToast } from "@/hooks/use-toast";

type Method = SubmitPaymentRequest["method"];

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.resolve();
}

export default function BookingPayment() {
  const [, params] = useRoute<{ id: string }>("/booking/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const id = Number(params?.id);
  const validId = Number.isFinite(id) && id > 0;

  const { data: pricing } = useGetPricing();
  const { data: cars } = useListCars();
  const { data: booking, isLoading } = useGetBooking(id, {
    query: {
      queryKey: getGetBookingQueryKey(id),
      enabled: validId,
      refetchInterval: (q) =>
        q.state.data?.paymentStatus === "paid" ? false : 4000,
    },
  });

  const submitPaymentMutation = useSubmitBookingPayment();
  const queryClient = useQueryClient();

  const [method, setMethod] = useState<Method>("vodafone_cash");
  const [reference, setReference] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "الصورة كبيرة جداً", description: "الحد الأقصى 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProofImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (booking?.paymentMethod) {
      setMethod(booking.paymentMethod);
    }
  }, [booking?.paymentMethod]);

  const bookingDate = useMemo(() => {
    if (!booking) return null;
    const d = new Date(`${booking.weekStart}T00:00:00`);
    d.setDate(d.getDate() + booking.dayOfWeek);
    return d;
  }, [booking]);

  if (!validId) {
    return (
      <PaymentShell>
        <NotFoundCard />
      </PaymentShell>
    );
  }

  if (isLoading || !booking) {
    return (
      <PaymentShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PaymentShell>
    );
  }

  if (booking.paymentStatus === "paid") {
    return (
      <PaymentShell>
        <PaidCard booking={booking} bookingDate={bookingDate} />
      </PaymentShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRef = reference.trim();
    if (!trimmedRef && !proofImage) {
      toast({
        title: "بيانات ناقصة",
        description: "أدخل رقم العملية أو ارفع صورة الإيصال.",
        variant: "destructive",
      });
      return;
    }
    if (trimmedRef && trimmedRef.length < 4) {
      toast({
        title: "رقم العملية قصير",
        description: "يجب أن يكون رقم العملية 4 أحرف على الأقل.",
        variant: "destructive",
      });
      return;
    }
    try {
      const updatedBooking = await submitPaymentMutation.mutateAsync({
        id,
        data: {
          method,
          reference: trimmedRef || undefined,
          proofImage: proofImage ?? undefined,
        },
      });
      queryClient.setQueryData(getGetBookingQueryKey(id), updatedBooking);
      toast({
        title: "✅ تم إرسال بيانات الدفع",
        description: "سيتم مراجعة الدفع والتواصل معك قريباً.",
      });
    } catch (error: unknown) {
      const msg =
        (error as { message?: string })?.message ||
        "تعذر إرسال بيانات الدفع.";
      toast({
        title: "حدث خطأ",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const submitted = booking.paymentStatus === "submitted";

  const car = cars?.find((c) => c.id === booking.carId) ?? null;

  return (
    <PaymentShell>
      <BookingSummary booking={booking} bookingDate={bookingDate} car={car} />

      {submitted ? (
        <SubmittedCard booking={booking} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border bg-card p-5 sm:p-7 space-y-5"
          data-testid="card-payment-instructions"
        >
          {/* Course Specs */}
          <div className="text-center py-2 space-y-1">
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold gap-1 mb-3">
              <Clock3 className="h-3.5 w-3.5" />
              في انتظار الدفع
            </Badge>
            <div className="text-5xl sm:text-6xl font-black text-primary leading-none">
              {booking.priceEgp}
            </div>
            <div className="text-xl font-extrabold text-foreground">ج.م</div>
            <div className="flex items-center justify-center gap-4 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <b className="text-foreground">{booking.sessionsCount}</b> حصص
              </span>
              <span className="w-px h-4 bg-border" />
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                ساعة / الحصة
              </span>
            </div>
          </div>

          <div className="border-t border-border/50" />

          <Tabs value={method} onValueChange={(v) => setMethod(v as Method)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger
                value="vodafone_cash"
                data-testid="tab-vodafone-cash"
                className="font-extrabold"
              >
                Vodafone Cash
              </TabsTrigger>
              <TabsTrigger
                value="instapay"
                data-testid="tab-instapay"
                className="font-extrabold"
              >
                InstaPay
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vodafone_cash" className="mt-4">
              <PaymentTargetRow
                label="حوّل المبلغ إلى رقم محفظة فودافون كاش:"
                value={pricing?.vodafoneCashNumber ?? "—"}
                testId="text-vodafone-number"
              />
            </TabsContent>

            <TabsContent value="instapay" className="mt-4">
              <PaymentTargetRow
                label="حوّل المبلغ إلى عنوان InstaPay التالي:"
                value={pricing?.instapayHandle ?? "—"}
                testId="text-instapay-handle"
              />
            </TabsContent>
          </Tabs>

          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pr-5">
            <li>حوّل <b className="text-foreground">{booking.priceEgp} ج.م</b> بالضبط إلى الرقم/العنوان أعلاه.</li>
            <li>ارفع صورة الإيصال أو اكتب رقم العملية في الخانة بالأسفل.</li>
            <li>اضغط <b className="text-foreground">إرسال</b> — سيتم مراجعة الدفع والتواصل معك قريباً.</li>
          </ol>

          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="reference">رقم العملية / المرجع <span className="text-muted-foreground font-normal">(اختياري)</span></Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: 123456789"
                dir="ltr"
                data-testid="input-payment-reference"
              />
            </div>

            <div className="space-y-1.5">
              <Label>صورة الإيصال <span className="text-muted-foreground font-normal">(اختياري)</span></Label>
              {proofImage ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-primary/40">
                  <img
                    src={proofImage}
                    alt="إيصال الدفع"
                    className="w-full max-h-48 object-contain bg-black/5"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 left-2 h-7 w-7 p-0"
                    onClick={() => setProofImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="proof-image"
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 p-5 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  data-testid="label-proof-upload"
                >
                  <ImagePlus className="h-7 w-7 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">اضغط لرفع صورة التحويل</span>
                  <span className="text-xs text-muted-foreground/60">JPG, PNG — بحد أقصى 5MB</span>
                  <input
                    id="proof-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    data-testid="input-proof-image"
                  />
                </label>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 font-extrabold"
              disabled={submitPaymentMutation.isPending}
              data-testid="button-submit-payment"
            >
              {submitPaymentMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>إرسال بيانات الدفع</>
              )}
            </Button>
          </form>

          <div className="flex items-start gap-2 text-xs text-muted-foreground border-t border-border/60 pt-4">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              بعد الضغط على إرسال، سيصل إشعار للمدرب بكل تفاصيل حجزك. الحجز يتأكد لما المدرب يتواصل معاك.
            </span>
          </div>
        </motion.div>
      )}

      <div className="text-center pt-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/" data-testid="link-back-home">
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع للرئيسية
          </Link>
        </Button>
      </div>
    </PaymentShell>
  );
}

function PaymentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-6 sm:py-10">
        <div className="container max-w-2xl space-y-5">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

function BookingSummary({
  booking,
  bookingDate,
  car,
}: {
  booking: Booking;
  bookingDate: Date | null;
  car: { name: string; transmission: string } | null;
}) {
  const carLabel = car
    ? `${car.name} (${car.transmission === "automatic" ? "أوتوماتيك" : "مانيوال"})`
    : null;

  return (
    <div
      className="rounded-3xl border border-border bg-card/70 p-5 sm:p-6"
      data-testid="card-booking-summary"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="text-lg sm:text-xl font-extrabold text-primary">
          ملخص الحجز #{booking.id}
        </h1>
        <Badge variant="secondary" className="font-bold">
          {booking.sessionsCount} حصص
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        <dt className="text-muted-foreground">الاسم</dt>
        <dd className="font-bold text-right">{booking.name}</dd>

        <dt className="text-muted-foreground">رقم الواتساب</dt>
        <dd className="font-bold text-right" dir="ltr">
          {booking.phone}
        </dd>

        {carLabel && (
          <>
            <dt className="text-muted-foreground">نوع السيارة</dt>
            <dd className="font-bold text-right">🚗 {carLabel}</dd>
          </>
        )}

        <dt className="text-muted-foreground">اليوم</dt>
        <dd className="font-bold text-right">
          {ARABIC_DAYS[booking.dayOfWeek]}{" "}
          {bookingDate ? formatArabicDate(bookingDate) : ""}
        </dd>

        <dt className="text-muted-foreground">الموعد</dt>
        <dd className="font-bold text-right" dir="ltr">
          {formatMinutes(booking.startMinutes)}
        </dd>

        <dt className="text-muted-foreground">المبلغ</dt>
        <dd className="font-extrabold text-right text-primary">
          {booking.priceEgp} ج.م
        </dd>
      </dl>
    </div>
  );
}

function PaymentTargetRow({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  const { toast } = useToast();
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-2xl border-2 border-primary/40 bg-primary/5 p-3">
        <code
          className="flex-1 text-lg font-extrabold text-primary tracking-wide"
          dir="ltr"
          data-testid={testId}
        >
          {value}
        </code>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={async () => {
            await copyToClipboard(value);
            toast({ title: "تم النسخ" });
          }}
          data-testid={`button-copy-${testId}`}
        >
          <Copy className="h-4 w-4 ml-1" />
          نسخ
        </Button>
      </div>
    </div>
  );
}

function SubmittedCard({ booking }: { booking: Booking }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border-2 border-amber-500/40 bg-amber-500/5 p-6 text-center space-y-3"
      data-testid="card-payment-submitted"
    >
      <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
      <h2 className="text-xl font-extrabold">جارٍ التحقق من الدفع...</h2>
      <p className="text-sm text-muted-foreground">
        استلمنا رقم العملية{" "}
        <code dir="ltr" className="text-foreground font-bold">
          {booking.paymentReference}
        </code>{" "}
        — هذه الصفحة هتتحدّث تلقائيًا فور تأكيد المبلغ.
      </p>
    </motion.div>
  );
}

function PaidCard({
  booking,
  bookingDate,
}: {
  booking: Booking;
  bookingDate: Date | null;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border-2 border-green-500/50 bg-green-500/5 p-6 sm:p-8 text-center space-y-4"
        data-testid="card-payment-paid"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold">
          تم تأكيد الحجز ✅
        </h2>
        <p className="text-muted-foreground">
          شكرًا{" "}
          <span className="font-extrabold text-foreground">{booking.name}</span>
          ! استلمنا مبلغ <b>{booking.priceEgp} ج.م</b> وتم تأكيد كورس{" "}
          <b>{booking.sessionsCount} حصص</b>.
        </p>
        <div className="rounded-2xl bg-card border border-border p-4 text-sm text-right space-y-2">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">رقم الحجز</span>
            <span className="font-extrabold">#{booking.id}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">الموعد</span>
            <span className="font-extrabold">
              {ARABIC_DAYS[booking.dayOfWeek]}{" "}
              {bookingDate ? formatArabicDate(bookingDate) : ""} —{" "}
              <span dir="ltr">{formatMinutes(booking.startMinutes)}</span>
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          المدرب اتبلّغ بالحجز — هيتواصل معاك قبل الموعد بفترة.
        </p>
        <Button asChild size="lg" className="font-extrabold">
          <Link href="/" data-testid="link-paid-home">
            رجوع للرئيسية
          </Link>
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

function NotFoundCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center space-y-3">
      <h1 className="text-xl font-extrabold">رقم الحجز غير صحيح</h1>
      <p className="text-muted-foreground text-sm">
        لم نتمكن من العثور على هذا الحجز.
      </p>
      <Button asChild>
        <Link href="/">العودة للرئيسية</Link>
      </Button>
    </div>
  );
}
