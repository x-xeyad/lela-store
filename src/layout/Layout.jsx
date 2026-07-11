import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CursorGlow } from "../components/CursorGlow";
import { FloatingButterflies } from "../components/FloatingButterflies";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { CONTACT_INFO } from "../constants/contact";
import { useLanguage } from "../context/LanguageContext";
import { Toaster } from "react-hot-toast";
import { settingsService } from "../services/settingsService";
import logo from "../assets/logo.png";

export const Layout = ({ children }) => {
  const location = useLocation();
  const { language, t, isRtl } = useLanguage();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const mode = await settingsService.getMaintenanceMode();
        setMaintenanceMode(mode || false);
      } catch (e) {
        console.error("Failed to check maintenance mode status", e);
      }
    };
    checkMaintenance();
  }, [location.pathname]);

  const isEditingAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen relative bg-brand-bg dark:bg-brand-dark-bg transition-colors duration-500 font-sans">
      {/* Toast Notifications */}
      <Toaster
        position={isRtl ? "bottom-left" : "bottom-right"}
        toastOptions={{
          style: {
            background: "var(--color-brand-bg)",
            color: "var(--color-brand-text)",
            border: "1px solid rgba(142, 54, 86, 0.15)",
            fontSize: "12px",
            borderRadius: "12px",
            fontFamily: isRtl ? "Cairo" : "Poppins",
          },
          dark: {
            style: {
              background: "var(--color-brand-dark-bg)",
              color: "var(--color-brand-dark-text)",
              border: "1px solid rgba(215, 165, 174, 0.15)",
            }
          }
        }}
      />

      {/* Global Interactive Effects */}
      <CursorGlow />
      <FloatingButterflies />

      {/* Content Gating for Maintenance Mode */}
      {maintenanceMode && !isEditingAdmin ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[85vh] text-center p-6 bg-brand-bg dark:bg-brand-dark-bg font-sans z-10 select-none">
          <div className="w-24 h-24 rounded-full border border-primary/15 dark:border-secondary/15 flex items-center justify-center bg-white/40 dark:bg-black/30 backdrop-blur-sm shadow-inner mb-6">
            <img src={logo} alt="LELA Logo" className="w-12 h-auto animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-4xl font-light text-brand-text dark:text-brand-dark-text tracking-wide mb-4 uppercase font-english">
            {language === "ar" ? "الموقع قيد الصيانة" : "Exquisite Maintenance"}
          </h1>
          <p className="text-xs text-brand-text/60 dark:text-brand-dark-text/60 font-light max-w-sm leading-relaxed mb-8">
            {language === "ar"
              ? "نعمل حالياً على بعض التحديثات لتوفير تجربة تسوق أكثر فخامة وسهولة. سنعود قريباً جداً!"
              : "We are currently refining LELA to offer you a more seamless, luxury shopping experience. We will be back shortly!"}
          </p>
          <a
            href={CONTACT_INFO.whatsappYemen}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full bg-[#25D366] text-white font-semibold text-xs tracking-wider uppercase font-english flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
            {language === "ar" ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
          </a>
          <Link to="/admin" className="mt-8 text-[10px] uppercase font-bold tracking-widest text-brand-text/30 hover:text-primary transition-colors">
            {t("adminLogin")}
          </Link>
        </div>
      ) : (
        <>
          {/* Navbar Header */}
          <Navbar />

          {/* Main Content Area with elegant slide-up transitions */}
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 flex flex-col pt-24"
            >
              {children}
            </motion.main>
          </AnimatePresence>

          {/* Footer Area */}
          <Footer />

          {/* Floating WhatsApp Button */}
          <a
            href={CONTACT_INFO.whatsappYemen}
            target="_blank"
            rel="noopener noreferrer"
            className={`fixed bottom-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl hover:scale-105 active:scale-95 hover:shadow-[#25D366]/20 transition-all duration-300 ${
              isRtl ? "left-6" : "right-6"
            }`}
            title={t("whatsappFloating")}
            aria-label="Contact support on WhatsApp"
          >
            {/* Animated outer WhatsApp glow */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping -z-10" />
            <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
          </a>
        </>
      )}
    </div>
  );
};
