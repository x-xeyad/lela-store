import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Globe } from "lucide-react";

export const LanguageSwitcher = ({ variant = "nav" }) => {
  const { language, toggleLanguage, t } = useLanguage();

  if (variant === "floating") {
    return (
      <button
        onClick={toggleLanguage}
        className="fixed bottom-24 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full glassmorphism text-primary dark:text-secondary shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 border border-primary/20"
        title={t(language === "en" ? "arabic" : "english")}
        aria-label="Toggle language"
      >
        <span className="text-xs font-semibold uppercase tracking-wider font-english">
          {language === "en" ? "AR" : "EN"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-primary/5 dark:hover:bg-secondary/5 text-brand-text dark:text-brand-dark-text text-sm font-medium tracking-wide transition-all duration-300"
    >
      <Globe className="w-4 h-4 text-primary dark:text-secondary animate-pulse" />
      <span className={language === "ar" ? "font-english text-xs" : "font-arabic text-xs"}>
        {language === "en" ? "العربية" : "English"}
      </span>
    </button>
  );
};
