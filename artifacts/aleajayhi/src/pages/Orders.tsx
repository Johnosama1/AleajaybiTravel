import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ClipboardList, Loader2, SendHorizonal } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "cash" | "transfer" | "other";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "كاش" },
  { value: "transfer", label: "تحويل بنكي" },
  { value: "other", label: "أخرى" },
];

export default function Orders() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          details: details.trim() || undefined,
          paymentMethod,
        }),
      });
      if (!res.ok) throw new Error("فشل في إرسال الطلب");
      const order = await res.json();
      toast({ title: "تم إرسال طلبك بنجاح!" });
      navigate(`/orders/${order.id}`);
    } catch {
      toast({ title: "خطأ", description: "تعذّر إرسال الطلب، حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="w-full max-w-lg space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8 mx-auto"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold">تقديم طلب</h1>
            <p className="text-sm text-muted-foreground">
              أرسل طلبك وسيتم مراجعته والرد عليك فوراً.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">الاسم الكامل *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">رقم التليفون *</Label>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="details">تفاصيل الطلب (اختياري)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="اكتب تفاصيل طلبك هنا..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>طريقة الدفع</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                    paymentMethod === opt.value
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-extrabold gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <SendHorizonal className="h-5 w-5" />
                إرسال الطلب
              </>
            )}
          </Button>
        </motion.form>
      </main>
      <Footer />
    </div>
  );
}
