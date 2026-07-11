import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../constants/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("lela_language");
    if (saved) return saved;
    // Check browser preference
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith("ar") ? "ar" : "en";
  });

  useEffect(() => {
    localStorage.setItem("lela_language", language);
    // Set text direction and language attributes on <html> tag
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const langTrans = translations[language] || translations.en;
    return langTrans[key] !== undefined ? langTrans[key] : key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "ar" : "en"));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage, isRtl: language === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
