import { motion } from "framer-motion";
import { CheckCircle2, GraduationCap } from "lucide-react";
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

        <ul className="w-full space-y-2 text-sm text-right pt-2 border-t border-border/50 mt-2">
          {[
            `${pricing.sessionsCount} حصص تدريب مع مدرب معتمد`,
            "اختيار السيارة (مانيوال أو أوتوماتيك)",
            "حجز ومتابعة المواعيد أونلاين",
            "دفع آمن: Vodafone Cash أو InstaPay",
          ].map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-foreground/90"
            >
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
