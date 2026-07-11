import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Sparkles, ArrowRight } from "lucide-react";

export const NotFound = () => {
  const { language, t } = useLanguage();

  return (
    <div className="flex-grow flex items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="space-y-6 max-w-md flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-primary/5 dark:bg-secondary/5 flex items-center justify-center text-primary dark:text-secondary border border-primary/10">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-light text-brand-text dark:text-brand-dark-text tracking-wide font-english">
            404
          </h1>
          <h2 className="text-base font-semibold uppercase tracking-wider text-primary dark:text-secondary">
            {language === "ar" ? "الصفحة غير موجودة" : "Page Not Found"}
          </h2>
          <p className="text-xs text-brand-text/50 dark:text-brand-dark-text/50 font-light leading-relaxed">
            {language === "ar"
              ? "نعتذر، لم نتمكن من العثور على الصفحة المطلوبة. ربما تم نقلها أو حذفها."
              : "Apologies, the page you are looking for does not exist. It may have been moved or deleted."}
          </p>
        </div>
        <Link
          to="/"
          className="px-6 py-3 rounded-full bg-primary hover:bg-primary/95 text-white font-semibold text-xs tracking-wider uppercase font-english flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 transition-all"
        >
          {language === "ar" ? "العودة للرئيسية" : "Return Home"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
