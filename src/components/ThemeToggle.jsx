import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export const ThemeToggle = ({ variant = "nav" }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  if (variant === "floating") {
    return (
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full glassmorphism text-primary dark:text-secondary shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 border border-primary/20"
        title={theme === "light" ? t("darkMode") : t("lightMode")}
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-full hover:bg-primary/5 dark:hover:bg-secondary/5 text-brand-text dark:text-brand-dark-text transition-all duration-300"
      title={theme === "light" ? t("darkMode") : t("lightMode")}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 text-primary dark:text-secondary" />
      ) : (
        <Sun className="w-4 h-4 text-primary dark:text-secondary" />
      )}
    </button>
  );
};
