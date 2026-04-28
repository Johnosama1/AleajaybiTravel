import React from "react";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/photo_2026-04-28_17-50-50_1777391528214.jpg";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src={logoImage} alt="Aleajayhi Logo" className="h-12 w-auto object-contain rounded-md" />
          <span className="font-bold text-xl hidden sm:inline-block text-primary">العجاهي</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-foreground/80"}`}>
            الرئيسية
          </Link>
          <Link href="/booking" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/booking" ? "text-primary" : "text-foreground/80"}`}>
            الحجز
          </Link>
          <Link href="/contact" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/contact" ? "text-primary" : "text-foreground/80"}`}>
            تواصل
          </Link>
        </nav>
      </div>
    </header>
  );
}
