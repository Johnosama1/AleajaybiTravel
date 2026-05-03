import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  XCircle,
  ClipboardList,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminConfirmBooking,
  adminListBookings,
  adminRejectBooking,
  type Booking,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  ARABIC_DAYS,
  formatArabicDate,
  formatMinutes,
} from "@/lib/date";

const ADMIN_HASH = "a9baeb9fe0fda2428912f74b2fc22fe4be4c2d2ef76912e4373c086066cfbe3b";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const TOKEN_KEY = "aleajaybi_admin_token";

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function writeToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(token: string): RequestInit {
  return { headers: { "X-Admin-Token": token } };
}

function bookingDateOf(b: Booking): Date {
  const d = new Date(`${b.weekStart}T00:00:00`);
  d.setDate(d.getDate() + b.dayOfWeek);
  return d;
}

function paymentMethodLabel(m: Booking["paymentMethod"]): string {
  if (m === "vodafone_cash") return "Vodafone Cash";
  if (m === "instapay") return "InstaPay";
  return "—";
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => readToken());

  if (!token) {
    return <AdminLogin onLoggedIn={(t) => setToken(t)} />;
  }

  return (
    <AdminDashboard
      token={token}
      onLogout={() => {
        writeToken(null);
        setToken(null);
      }}
    />
  );
}

function AdminLogin({ onLoggedIn }: { onLoggedIn: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const hash = await sha256(trimmed);
      if (hash !== ADMIN_HASH) {
        toast({ title: "فشل الدخول", description: "كلمة السر غير صحيحة.", variant: "destructive" });
        return;
      }
      writeToken(trimmed);
      onLoggedIn(trimmed);
      toast({ title: "تم تسجيل الدخول" });
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ، حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 grid place-items-center py-10">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8"
          data-testid="card-admin-login"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold">لوحة المدرب</h1>
            <p className="text-sm text-muted-foreground">
              أدخل كلمة سر المدرب للوصول للحجوزات.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="token">كلمة السر</Label>
            <Input
              id="token"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              data-testid="input-admin-token"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full font-extrabold"
            disabled={submitting}
            data-testid="button-admin-login"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "دخول"}
          </Button>
        </motion.form>
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────
// Orders types & helpers
// ─────────────────────────────────────────────

interface Order {
  id: number;
  name: string;
  phone: string;
  details: string | null;
  paymentMethod: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  processedAt: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "كاش",
  transfer: "تحويل بنكي",
  other: "أخرى",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────

function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-6 sm:py-10">
        <div className="container max-w-4xl space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-primary">لوحة الإدارة</h1>
              <p className="text-sm text-muted-foreground">راجع الطلبات والحجوزات.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={onLogout} data-testid="button-admin-logout">
              <LogOut className="h-4 w-4 ml-1" />
              خروج
            </Button>
          </div>

          <Tabs defaultValue="orders">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="orders">
                <ClipboardList className="h-4 w-4 ml-1" />
                الطلبات
              </TabsTrigger>
              <TabsTrigger value="bookings">
                الحجوزات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-4">
              <OrdersPanel token={token} />
            </TabsContent>

            <TabsContent value="bookings" className="mt-4">
              <BookingsPanel token={token} onLogout={onLogout} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────
// Orders Panel
// ─────────────────────────────────────────────

function OrdersPanel({ token }: { token: string }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = async () => {
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { "X-Admin-Token": token },
      });
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 1000);
    return () => window.clearInterval(t);
  }, [token]);

  const handleApprove = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/approve`, {
        method: "POST",
        headers: { "X-Admin-Token": token },
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم قبول الطلب ✓" });
      await refresh();
    } catch {
      toast({ title: "خطأ", description: "تعذّر قبول الطلب.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/reject`, {
        method: "POST",
        headers: { "X-Admin-Token": token },
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم رفض الطلب" });
      await refresh();
    } catch {
      toast({ title: "خطأ", description: "تعذّر رفض الطلب.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pending = orders?.filter((o) => o.status === "pending") ?? [];
  const approved = orders?.filter((o) => o.status === "approved") ?? [];
  const rejected = orders?.filter((o) => o.status === "rejected") ?? [];

  return (
    <Tabs defaultValue="pending">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="pending">
          للمراجعة ({pending.length})
        </TabsTrigger>
        <TabsTrigger value="approved">
          مقبولة ({approved.length})
        </TabsTrigger>
        <TabsTrigger value="rejected">
          مرفوضة ({rejected.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-4 space-y-3">
        {pending.length === 0 ? (
          <EmptyState text="لا يوجد طلبات جديدة." />
        ) : (
          pending.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              busy={busyId === o.id}
              actions={
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(o.id)}
                    disabled={busyId === o.id}
                  >
                    <XCircle className="h-4 w-4 ml-1" />
                    رفض
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(o.id)}
                    disabled={busyId === o.id}
                  >
                    {busyId === o.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 ml-1" />
                        قبول
                      </>
                    )}
                  </Button>
                </>
              }
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="approved" className="mt-4 space-y-3">
        {approved.length === 0 ? (
          <EmptyState text="لا توجد طلبات مقبولة بعد." />
        ) : (
          approved.map((o) => <OrderRow key={o.id} order={o} />)
        )}
      </TabsContent>

      <TabsContent value="rejected" className="mt-4 space-y-3">
        {rejected.length === 0 ? (
          <EmptyState text="لا توجد طلبات مرفوضة." />
        ) : (
          rejected.map((o) => <OrderRow key={o.id} order={o} />)
        )}
      </TabsContent>
    </Tabs>
  );
}

function OrderRow({
  order,
  actions,
  busy,
}: {
  order: Order;
  actions?: React.ReactNode;
  busy?: boolean;
}) {
  const statusBadge = {
    pending: <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/30 font-bold gap-1"><Clock3 className="h-3 w-3" />قيد المراجعة</Badge>,
    approved: <Badge className="bg-green-500/15 text-green-600 border border-green-500/30 font-bold gap-1"><CheckCircle2 className="h-3 w-3" />مقبول</Badge>,
    rejected: <Badge className="bg-red-500/15 text-red-600 border border-red-500/30 font-bold gap-1"><XCircle className="h-3 w-3" />مرفوض</Badge>,
  }[order.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-extrabold">{order.name}</span>
            <a href={`tel:${order.phone}`} className="text-sm text-primary font-bold" dir="ltr">
              {order.phone}
            </a>
            {statusBadge}
          </div>
          <div className="text-xs text-muted-foreground">
            طلب #{order.id} · {formatDateTime(order.createdAt)} · {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </div>
          {order.details && (
            <div className="text-sm text-muted-foreground border-t border-border pt-1 mt-1">
              {order.details}
            </div>
          )}
          {order.processedAt && (
            <div className="text-xs text-muted-foreground">
              تمت المراجعة: {formatDateTime(order.processedAt)}
            </div>
          )}
        </div>
        {actions && (
          <div className={`flex flex-wrap gap-2 ${busy ? "opacity-70" : ""}`}>
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Bookings Panel (existing functionality)
// ─────────────────────────────────────────────

function BookingsPanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await adminListBookings(authHeaders(token));
      setBookings(data);
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;
      if (status === 401) {
        toast({ title: "انتهت الجلسة", description: "أعد إدخال كلمة السر.", variant: "destructive" });
        onLogout();
        return;
      }
      const msg = (error as { message?: string })?.message || "تعذر تحميل الحجوزات.";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 1000);
    return () => window.clearInterval(t);
  }, [token]);

  const handleConfirm = async (b: Booking) => {
    setBusyId(b.id);
    try {
      const result = await adminConfirmBooking(b.id, authHeaders(token));
      toast({ title: "تم تأكيد الدفع", description: "تم فتح واتساب لإرسال التفاصيل." });
      window.open(result.whatsappUrl, "_blank", "noopener");
      await refresh();
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || "تعذر تأكيد الحجز.";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (b: Booking) => {
    setBusyId(b.id);
    try {
      await adminRejectBooking(b.id, authHeaders(token));
      toast({ title: "تم رفض الدفع" });
      await refresh();
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || "تعذر تحديث الحجز.";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const submitted = bookings?.filter((b) => b.paymentStatus === "submitted") ?? [];
  const paid = bookings?.filter((b) => b.paymentStatus === "paid") ?? [];
  const pending = bookings?.filter((b) => b.paymentStatus === "pending") ?? [];

  return (
    <Tabs defaultValue="submitted">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="submitted" data-testid="tab-admin-submitted">
          للمراجعة ({submitted.length})
        </TabsTrigger>
        <TabsTrigger value="paid" data-testid="tab-admin-paid">
          مؤكدة ({paid.length})
        </TabsTrigger>
        <TabsTrigger value="pending" data-testid="tab-admin-pending">
          لم يدفع ({pending.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="submitted" className="mt-4 space-y-3">
        {submitted.length === 0 ? (
          <EmptyState text="لا يوجد مدفوعات بانتظار المراجعة." />
        ) : (
          submitted.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              busy={busyId === b.id}
              actions={
                <>
                  <Button size="sm" variant="outline" onClick={() => handleReject(b)} disabled={busyId === b.id} data-testid={`button-reject-${b.id}`}>
                    <XCircle className="h-4 w-4 ml-1" />
                    رفض
                  </Button>
                  <Button size="sm" onClick={() => handleConfirm(b)} disabled={busyId === b.id} data-testid={`button-confirm-${b.id}`}>
                    {busyId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 ml-1" />تأكيد + واتساب</>}
                  </Button>
                </>
              }
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="paid" className="mt-4 space-y-3">
        {paid.length === 0 ? <EmptyState text="لا توجد حجوزات مؤكدة بعد." /> : paid.map((b) => <BookingRow key={b.id} booking={b} />)}
      </TabsContent>

      <TabsContent value="pending" className="mt-4 space-y-3">
        {pending.length === 0 ? <EmptyState text="لا يوجد حجوزات بانتظار الدفع." /> : pending.map((b) => <BookingRow key={b.id} booking={b} />)}
      </TabsContent>
    </Tabs>
  );
}

function BookingRow({ booking, actions, busy }: { booking: Booking; actions?: React.ReactNode; busy?: boolean }) {
  const date = bookingDateOf(booking);
  const status = booking.paymentStatus;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4 sm:p-5"
      data-testid={`row-booking-${booking.id}`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-extrabold">{booking.name}</span>
            <a href={`tel:${booking.phone}`} className="text-sm text-primary font-bold" dir="ltr" data-testid={`text-phone-${booking.id}`}>{booking.phone}</a>
            <StatusBadge status={status} />
          </div>
          <div className="text-sm text-muted-foreground">
            {ARABIC_DAYS[booking.dayOfWeek]} {formatArabicDate(date)} — <span dir="ltr" className="font-bold">{formatMinutes(booking.startMinutes)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span>المبلغ: </span><b className="text-foreground">{booking.priceEgp} ج.م</b>
            <span className="mx-2">·</span>
            <span>الحصص: </span><b className="text-foreground">{booking.sessionsCount}</b>
            <span className="mx-2">·</span>
            <span>الوسيلة: </span><b className="text-foreground">{paymentMethodLabel(booking.paymentMethod)}</b>
          </div>
          {booking.paymentReference && (
            <div className="text-xs text-muted-foreground">رقم العملية: <code dir="ltr" className="text-foreground font-bold">{booking.paymentReference}</code></div>
          )}
          {booking.paymentProofUrl && (
            <a href={booking.paymentProofUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-proof-${booking.id}`}>
              <img src={booking.paymentProofUrl} alt="إيصال الدفع" className="mt-2 max-h-32 rounded-xl border border-border object-contain bg-black/5 cursor-pointer hover:opacity-80 transition-opacity" />
            </a>
          )}
        </div>
        {actions && <div className={`flex flex-wrap gap-2 ${busy ? "opacity-70" : ""}`}>{actions}</div>}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: Booking["paymentStatus"] }) {
  if (status === "paid") return <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 font-bold gap-1"><CheckCircle2 className="h-3 w-3" />مؤكد</Badge>;
  if (status === "submitted") return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold gap-1"><Clock3 className="h-3 w-3" />للمراجعة</Badge>;
  return <Badge variant="secondary" className="font-bold gap-1"><Clock3 className="h-3 w-3" />لم يدفع</Badge>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
      <Inbox className="h-8 w-8 mx-auto mb-2 opacity-60" />
      {text}
    </div>
  );
}
