import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import logo from "../assets/logo.png";
import { Phone, Mail, ArrowUpRight } from "lucide-react";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { CONTACT_INFO } from "../constants/contact";

export const Footer = () => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-brand-dark-card border-t border-primary/5 dark:border-secondary/5 mt-auto transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Logo & Description */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="LELA Logo" className="h-10 w-auto" />
              <span className="font-english text-lg tracking-[0.25em] font-bold text-primary dark:text-secondary uppercase">
                LELA
              </span>
            </Link>
            <p className="text-xs text-brand-text/60 dark:text-brand-dark-text/60 max-w-sm font-light leading-relaxed">
              {t("footerDesc")}
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={CONTACT_INFO.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-primary/5 dark:bg-secondary/5 flex items-center justify-center text-primary dark:text-secondary hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-black transition-all duration-300 border border-primary/10"
              >
                <FaInstagram className="w-4 h-4" />
              </a>
              <a
                href={CONTACT_INFO.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-primary/5 dark:bg-secondary/5 flex items-center justify-center text-primary dark:text-secondary hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-black transition-all duration-300 border border-primary/10"
              >
                <FaFacebook className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="w-8 h-8 rounded-full bg-primary/5 dark:bg-secondary/5 flex items-center justify-center text-primary dark:text-secondary hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-black transition-all duration-300 border border-primary/10"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary dark:text-secondary">
              {t("quickLinks")}
            </h4>
            <ul className="space-y-2 text-xs font-light">
              <li>
                <Link to="/" className="text-brand-text/75 dark:text-brand-dark-text/75 hover:text-primary dark:hover:text-secondary transition-colors">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-brand-text/75 dark:text-brand-dark-text/75 hover:text-primary dark:hover:text-secondary transition-colors">
                  {t("shop")}
                </Link>
              </li>
              <li>
                <a href="/#calculator" className="text-brand-text/75 dark:text-brand-dark-text/75 hover:text-primary dark:hover:text-secondary transition-colors">
                  {t("calculator")}
                </a>
              </li>
              <li>
                <Link to="/admin" className="text-brand-text/75 dark:text-brand-dark-text/75 hover:text-primary dark:hover:text-secondary transition-colors">
                  {t("admin")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary dark:text-secondary">
              {t("contactUs")}
            </h4>
            <ul className="space-y-3 text-xs font-light text-brand-text/70 dark:text-brand-dark-text/70">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary dark:text-secondary flex-shrink-0" />
                <a href={`tel:${CONTACT_INFO.phoneEgypt}`} className="hover:text-primary dark:hover:text-secondary transition-colors font-english">
                  {CONTACT_INFO.phoneEgypt} (EG)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary dark:text-secondary flex-shrink-0" />
                <a href={`tel:${CONTACT_INFO.phoneYemen}`} className="hover:text-primary dark:hover:text-secondary transition-colors font-english">
                  {CONTACT_INFO.phoneYemen} (YE)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary dark:text-secondary flex-shrink-0" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-primary dark:hover:text-secondary transition-colors font-english">
                  {CONTACT_INFO.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Area */}
        <div className="border-t border-primary/5 dark:border-secondary/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-brand-text/50 dark:text-brand-dark-text/50">
          <div>
            &copy; {new Date().getFullYear()} LELA. {t("rightsReserved")}
          </div>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-primary dark:hover:text-secondary transition-colors">
              {t("privacyPolicy")}
            </Link>
            <Link to="/terms" className="hover:text-primary dark:hover:text-secondary transition-colors">
              {t("termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
