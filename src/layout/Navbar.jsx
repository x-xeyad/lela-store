import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useTheme } from "../context/ThemeContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeToggle } from "../components/ThemeToggle";
import { ShoppingBag, Heart, Menu, X, ShieldAlert, Lock } from "lucide-react";
import logoLight from "../assets/logo_light.png";
import logoDark from "../assets/logo_dark.png";
import { CartDrawer } from "../components/CartDrawer";
import { FavoritesDrawer } from "../components/FavoritesDrawer";
import { useAdmin } from "../context/AdminContext";
import { settingsService } from "../services/settingsService";

export const Navbar = () => {
  const { language, t, isRtl } = useLanguage();
  const { cartCount, selectedCurrency, setSelectedCurrency } = useCart();
  const { favorites } = useFavorites();
  const { isAuthenticated } = useAdmin();
  const { isDark, activeLogo, branding } = useTheme();
  const location = useLocation();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [announcementConfig, setAnnouncementConfig] = useState({
    enabled: false,
    backgroundColor: "#8A3D5A",
    textColor: "#FFFFFF",
    scrolling: true,
    items: []
  });

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const config = await settingsService.getAnnouncements();
        setAnnouncementConfig(config || {
          enabled: false,
          backgroundColor: "#8A3D5A",
          textColor: "#FFFFFF",
          scrolling: true,
          items: []
        });
      } catch (e) {
        console.error("Failed to load announcements in navbar", e);
      }
    };
    fetchAnnouncements();
  }, []);

  const activeAnnouncements = useMemo(() => {
    if (!announcementConfig.enabled || !announcementConfig.items) return [];
    const now = new Date();
    return announcementConfig.items.filter(item => {
      if (item.startDate && new Date(item.startDate) > now) return false;
      if (item.endDate && new Date(item.endDate) < now) return false;
      return true;
    }).map(item => item.text[language] || item.text.en);
  }, [announcementConfig, language]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: t("home"), path: "/" },
    { name: t("shop"), path: "/shop" },
    { name: t("calculator"), path: "/#calculator" },
    { name: t("faq"), path: "/#faq" }
  ];

  const activeLogoUrl = activeLogo || (isDark ? logoDark : logoLight);
  const websiteName = branding?.websiteName || "LELA";

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
          isScrolled
            ? "bg-white/80 dark:bg-brand-dark-bg/80 backdrop-blur-md border-b border-primary/5 dark:border-secondary/5 shadow-sm"
            : "bg-transparent"
        }`}
      >
        {activeAnnouncements.length > 0 && (
          <div 
            style={{ backgroundColor: announcementConfig.backgroundColor, color: announcementConfig.textColor }}
            className="text-[10px] py-1.5 px-4 font-semibold tracking-wider flex justify-center items-center text-center relative z-50 select-none overflow-hidden w-full"
          >
            {announcementConfig.scrolling ? (
              <div className="marquee-container w-full">
                <div className="marquee-content inline-flex items-center gap-16">
                  {activeAnnouncements.map((ann, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2">
                      {ann}
                    </span>
                  ))}
                  {activeAnnouncements.map((ann, idx) => (
                    <span key={`dup-${idx}`} className="inline-flex items-center gap-2">
                      {ann}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center items-center gap-6">
                {activeAnnouncements.map((ann, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2">
                    {ann}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={`max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between transition-all duration-550 ${isScrolled ? 'py-3' : 'py-5'}`}>
          {/* Logo Area */}
          <Link to="/" className="flex items-center gap-2 group">
            {(branding?.logoUrl && !branding.logoUrl.startsWith("/assets/logo_") && !branding.logoUrl.includes("logo_light.png")) || 
             (branding?.logoDarkUrl && !branding.logoDarkUrl.startsWith("/assets/logo_") && !branding.logoDarkUrl.includes("logo_dark.png")) ? (
              <img
                src={activeLogoUrl}
                alt={websiteName}
                className="h-9 w-auto max-w-[150px] object-contain transition-transform duration-500 group-hover:scale-102"
              />
            ) : (
              <>
                <div className="h-10 w-10 rounded-lg overflow-hidden border border-primary/15 dark:border-secondary/15 flex items-center justify-center bg-white/40 dark:bg-black/30 backdrop-blur-xs">
                  <img
                    src={activeLogoUrl}
                    alt="LELA Logo"
                    className="h-7 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <span className="font-english text-lg tracking-[0.25em] font-bold text-primary dark:text-secondary uppercase">
                  {websiteName}
                </span>
              </>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isHash = link.path.startsWith("/#");
              const isActive = isHash 
                ? location.pathname === "/" && location.hash === link.path.substring(1)
                : location.pathname === link.path;
              
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-xs font-semibold uppercase tracking-widest font-english transition-all duration-300 relative py-1 hover:text-primary dark:hover:text-secondary ${
                    isActive ? "text-primary dark:text-secondary font-bold" : "text-brand-text/75 dark:text-brand-dark-text/75"
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-primary dark:bg-secondary rounded-full" />
                  )}
                </Link>
              );
            })}
            

          </nav>

          {/* Header Controls (Language, Theme, Currency, Cart, Wishlist, Hamburger) */}
          <div className="flex items-center gap-3">
            {/* Currency switcher dropdown */}
            <div className="relative scale-90 sm:scale-100">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-transparent border border-primary/10 dark:border-secondary/10 hover:border-primary/30 dark:hover:border-secondary/30 rounded-xl px-2 py-1 text-[10px] font-semibold text-brand-text dark:text-brand-dark-text focus:outline-none cursor-pointer"
              >
                <option value="YER" className="bg-brand-bg dark:bg-brand-dark-card text-brand-text dark:text-brand-dark-text">🇾🇪 YER</option>
                <option value="SAR" className="bg-brand-bg dark:bg-brand-dark-card text-brand-text dark:text-brand-dark-text">🇸🇦 SAR</option>
              </select>
            </div>

            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => setIsFavoritesOpen(true)}
              className="relative p-2 rounded-full hover:bg-primary/5 dark:hover:bg-secondary/5 text-brand-text dark:text-brand-dark-text transition-all duration-300"
              aria-label="View Favorites"
            >
              <Heart className={`w-4 h-4 ${favorites.length > 0 ? "fill-primary text-primary dark:fill-secondary dark:text-secondary" : "text-primary dark:text-secondary"}`} />
              {favorites.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary dark:bg-secondary text-white dark:text-black font-english text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-primary/5 dark:hover:bg-secondary/5 text-brand-text dark:text-brand-dark-text transition-all duration-300"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-4 h-4 text-primary dark:text-secondary" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary dark:bg-secondary text-white dark:text-black font-english text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-primary/5 dark:hover:bg-secondary/5 text-brand-text dark:text-brand-dark-text transition-all duration-300"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full inset-x-0 bg-white dark:bg-brand-dark-bg border-b border-primary/10 dark:border-secondary/10 px-6 py-6 space-y-4 shadow-xl flex flex-col items-center text-center transition-all duration-500">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-semibold uppercase tracking-wider font-english text-brand-text dark:text-brand-dark-text py-2 hover:text-primary dark:hover:text-secondary block w-full"
              >
                {link.name}
              </Link>
            ))}


            <div className="flex items-center gap-6 pt-4 border-t border-primary/5 dark:border-secondary/5 w-full justify-center">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        )}
      </header>

      {/* Drawers */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <FavoritesDrawer isOpen={isFavoritesOpen} onClose={() => setIsFavoritesOpen(false)} />
    </>
  );
};
