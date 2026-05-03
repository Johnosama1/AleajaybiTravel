import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  XCircle,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

type OrderStatus = "pending" | "approved" | "rejected";

interface Order {
  id: number;
  name: string;
  phone: string;
  details: string | null;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  processedAt: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "كاش",
  transfer: "تحويل بنكي",
  other: "أخرى",
};

const STATUS_CONFIG = {
  pending: {
    label: "قيد المراجعة",
    description: "طلبك وصل وجاري مراجعته من قِبَل الإدارة.",
    icon: Clock3,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  approved: {
    label: "تم قبول الطلب ✓",
    description: "تم قبول طلبك بنجاح. سيتواصل معك فريقنا قريباً.",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  },
  rejected: {
    label: "تم رفض الطلب",
    description: "نأسف، تم رفض طلبك. يمكنك التواصل معنا لمزيد من التفاصيل.",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderStatus() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    let alive = true;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        if (!res.ok) {
          if (alive) setError(true);
          return;
        }
        const data = await res.json();
        if (alive) {
          setOrder(data);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 2000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [params.id]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 flex items-center justify-center py-10 px-4">
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md text-center space-y-4 rounded-3xl border border-border bg-card p-8"
          >
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-lg font-bold">لم يُعثر على الطلب</p>
            <p className="text-sm text-muted-foreground">
              رقم الطلب غير صحيح أو تم حذفه.
            </p>
            <Button onClick={() => navigate("/orders")} className="gap-2">
              <ArrowRight className="h-4 w-4" />
              تقديم طلب جديد
            </Button>
          </motion.div>
        ) : !order ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Clock3 className="h-8 w-8 animate-pulse" />
            <p>جاري تحميل الطلب...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={order.status}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md space-y-5"
            >
              {(() => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                return (
                  <div
                    className={`rounded-3xl border ${cfg.border} ${cfg.bg} p-6 sm:p-8 text-center space-y-3`}
                  >
                    <div
                      className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${cfg.bg}`}
                    >
                      <Icon className={`h-8 w-8 ${cfg.color}`} />
                    </div>
                    <h1 className={`text-xl font-extrabold ${cfg.color}`}>
                      {cfg.label}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {cfg.description}
                    </p>
                  </div>
                );
              })()}

              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold">
                  <ClipboardList className="h-4 w-4" />
                  تفاصيل الطلب #{order.id}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الاسم</span>
                    <span className="font-bold">{order.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التليفون</span>
                    <span className="font-bold" dir="ltr">{order.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">طريقة الدفع</span>
                    <span className="font-bold">
                      {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                  </div>
                  {order.details && (
                    <div className="pt-1 border-t border-border">
                      <p className="text-muted-foreground mb-1">التفاصيل</p>
                      <p className="font-medium">{order.details}</p>
                    </div>
                  )}
                  <div className="pt-1 border-t border-border flex justify-between">
                    <span className="text-muted-foreground">وقت الإرسال</span>
                    <span className="text-xs font-medium">{formatDate(order.createdAt)}</span>
                  </div>
                  {order.processedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">وقت المراجعة</span>
                      <span className="text-xs font-medium">{formatDate(order.processedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {order.status === "pending" && (
                <p className="text-center text-xs text-muted-foreground">
                  الصفحة تتحدث تلقائياً · ستظهر النتيجة هنا فور المراجعة
                </p>
              )}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate("/orders")}
              >
                <ArrowRight className="h-4 w-4" />
                تقديم طلب جديد
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      <Footer />
    </div>
  );
}
