import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Home as HomeIcon, CalendarCheck, Phone } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/photo_2026-04-28_17-50-50_1777391528214.jpg";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/", label: "الصفحة الرئيسية", icon: HomeIcon },
  { href: "/taken", label: "الحجز المأخوذ", icon: CalendarCheck },
  { href: "/contact", label: "التواصل", icon: Phone },
];

export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 sm:h-20 items-center justify-between gap-3" dir="ltr">
        {/* Logo + name (LEFT) */}
        <Link
          href="/"
          className="flex items-center gap-3 min-w-0"
          data-testid="link-home-brand"
        >
          <img
            src={logoImage}
            alt="Aleajaybi Travel"
            className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-full ring-2 ring-primary/40 shrink-0"
          />
          <div className="flex flex-col leading-tight min-w-0 text-left">
            <span className="font-extrabold text-base sm:text-lg text-primary truncate">
              Aleajaybi Travel
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate" dir="rtl">
              مدرسة العجايبي لتعليم القيادة
            </span>
          </div>
        </Link>

        {/* Hamburger menu (RIGHT) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
              aria-label="القائمة"
              data-testid="button-menu-toggle"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[280px] sm:w-[340px] flex flex-col p-0"
          >
            <SheetHeader className="p-6 border-b border-border/50 text-right">
              <SheetTitle className="flex items-center gap-3 text-right">
                <img
                  src={logoImage}
                  alt=""
                  className="h-10 w-10 object-cover rounded-full ring-2 ring-primary/40"
                />
                <div className="flex flex-col">
                  <span className="text-primary font-extrabold">
                    Aleajaybi Travel
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    القائمة
                  </span>
                </div>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    location === item.href ||
                    (item.href !== "/" && location.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <SheetClose asChild>
                        <Link
                          href={item.href}
                          data-testid={`link-nav-${item.href.replace("/", "") || "home"}`}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-bold transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-foreground/90 hover:bg-primary/10 hover:text-primary"
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 text-right">
                            {item.label}
                          </span>
                        </Link>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="p-4 border-t border-border/50 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Aleajaybi Travel
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
