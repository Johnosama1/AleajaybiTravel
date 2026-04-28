import React from "react";
import { SiWhatsapp } from "react-icons/si";

export function Footer() {
  return (
    <footer className="w-full border-t py-8 mt-auto bg-card text-card-foreground">
      <div className="container grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">
        <div>
          <h3 className="font-bold text-lg mb-4 text-primary">العجاهي لتعليم القيادة</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            المدرسة الرائدة في تعليم قيادة السيارات باحترافية وأمان. مدربون معتمدون وسيارات مجهزة خصيصاً لراحتك وسلامتك.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4 text-primary">روابط سريعة</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="/" className="hover:text-primary transition-colors">الرئيسية</a></li>
            <li><a href="/booking" className="hover:text-primary transition-colors">احجز موعدك</a></li>
            <li><a href="/contact" className="hover:text-primary transition-colors">تواصل معنا</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4 text-primary">تواصل معنا</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>أوقات العمل: من السبت إلى الجمعة</p>
            <p>نحن دائماً في خدمتك للرد على استفساراتك.</p>
          </div>
        </div>
      </div>
      <div className="container mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} العجاهي لتعليم القيادة. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}
