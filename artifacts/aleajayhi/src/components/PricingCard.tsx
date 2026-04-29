import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetPricing } from "@workspace/api-client-react";

interface PricingCardProps {
  variant?: "full" | "compact";
  className?: string;
}

export function PricingCard({
  variant = "full",
  className = "",
}: PricingCardProps) {
  const { data: pricing } = useGetPricing();
  if (!pricing) return null;

  if (variant === "compact") {
    return (
      <div
        className={`rounded-2xl border border-primary/40 bg-primary/5 p-4 ${className}`}
        data-testid="card-pricing-compact"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground font-bold">
              سعر الكورس الكامل
            </div>
            <div className="text-2xl font-extrabold text-primary leading-tight">
              {pricing.priceEgp} ج.م
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground font-extrabold">
            {pricing.sessionsCount} حصص
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 shadow-lg ${className}`}
      data-testid="card-pricing"
    >
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/15 blur-3xl rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
          <GraduationCap className="h-7 w-7" />
        </div>

        <Badge className="bg-primary/15 text-primary border border-primary/30 font-extrabold">
          باقة الكورس الكامل
        </Badge>

        <div className="flex items-baseline gap-2">
          <span
            className="text-5xl sm:text-6xl font-black text-primary"
            data-testid="text-pricing-amount"
          >
            {pricing.priceEgp}
          </span>
          <span className="text-xl font-extrabold text-foreground">ج.م</span>
        </div>

        <p
          className="text-base text-muted-foreground"
          data-testid="text-pricing-sessions"
        >
          شامل <span className="font-extrabold text-foreground">{pricing.sessionsCount}</span>{" "}
          حصص تدريب عملي
        </p>

        <div className="w-full pt-2 border-t border-border/50 mt-2 space-y-2">
          <p className="text-xs text-muted-foreground text-center">طرق الدفع المتاحة</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-3">
              <span className="text-2xl font-black text-red-600 dark:text-red-400 leading-none">V</span>
              <span className="text-xs font-extrabold text-red-600 dark:text-red-400">Vodafone Cash</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-violet-500/40 bg-violet-500/5 p-3">
              <span className="text-2xl font-black text-violet-600 dark:text-violet-400 leading-none">i</span>
              <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400">InstaPay</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
