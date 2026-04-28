import React from "react";
import { Link } from "wouter";
import logoImage from "@assets/photo_2026-04-28_17-50-50_1777391528214.jpg";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/40 mt-auto">
      <div className="container py-8 flex flex-col items-center gap-4 text-center">
        <img
          src={logoImage}
          alt="Aleajaybi Travel"
          className="h-12 w-12 object-cover rounded-full ring-2 ring-primary/30"
        />
        <div>
          <div className="font-extrabold text-primary">Aleajaybi Travel</div>
          <div className="text-xs text-muted-foreground mt-1">
            مدرسة العجايبي لتعليم القيادة الآمنة
          </div>
        </div>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            الرئيسية
          </Link>
          <Link href="/taken" className="hover:text-primary transition-colors">
            الحجز المأخوذ
          </Link>
          <Link
            href="/contact"
            className="hover:text-primary transition-colors"
          >
            التواصل
          </Link>
        </nav>
        <div className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}
