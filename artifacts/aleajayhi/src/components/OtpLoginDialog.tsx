import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const USER_TOKEN_KEY = "aleajaybi_user_token";
const USER_PHONE_KEY = "aleajaybi_user_phone";

export function readUserToken(): string | null {
  return typeof window !== "undefined" ? window.localStorage.getItem(USER_TOKEN_KEY) : null;
}
export function readUserPhone(): string | null {
  return typeof window !== "undefined" ? window.localStorage.getItem(USER_PHONE_KEY) : null;
}
export function clearUserSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_TOKEN_KEY);
    window.localStorage.removeItem(USER_PHONE_KEY);
  }
}
function saveUserSession(token: string, phone: string) {
  window.localStorage.setItem(USER_TOKEN_KEY, token);
  window.localStorage.setItem(USER_PHONE_KEY, phone);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoggedIn: (token: string, phone: string) => void;
}

export function OtpLoginDialog({ open, onOpenChange, onLoggedIn }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطأ", description: data.message || "تعذر إرسال الرمز.", variant: "destructive" });
        return;
      }
      toast({ title: "✅ تم إرسال رمز التحقق", description: "تفقد رسائل SMS." });
      setStep("otp");
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطأ", description: data.message || "رمز غير صحيح.", variant: "destructive" });
        return;
      }
      saveUserSession(data.token, data.phone);
      onLoggedIn(data.token, data.phone);
      onOpenChange(false);
      setStep("phone");
      setPhone("");
      setCode("");
      toast({ title: "تم تسجيل الدخول ✅" });
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep("phone");
      setCode("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {step === "phone" ? "تسجيل الدخول" : "أدخل رمز التحقق"}
          </DialogTitle>
        </DialogHeader>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="otp-phone">رقم الموبايل</Label>
              <Input
                id="otp-phone"
                type="tel"
                dir="ltr"
                placeholder="010XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">سنرسل لك رمز تحقق SMS.</p>
            </div>
            <Button type="submit" className="w-full font-extrabold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><Phone className="h-4 w-4 ml-2" />إرسال الرمز</>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="otp-code">رمز التحقق</Label>
              <Input
                id="otp-code"
                dir="ltr"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                أُرسل الرمز إلى <span dir="ltr" className="font-bold">{phone}</span> — صالح 5 دقائق.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("phone")}>
                تغيير الرقم
              </Button>
              <Button type="submit" className="flex-1 font-extrabold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحقق"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
