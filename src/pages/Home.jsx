import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { ProductCard } from "../components/ProductCard";
import { ShippingCalculator } from "../components/ShippingCalculator";
import { settingsService } from "../services/settingsService";
import { productService } from "../services/productService";
import { supabase } from "../services/supabaseClient";
import { motion } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Coins,
  Truck,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Layers,
  ShoppingBag,
  BookOpen,
  Send
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import logo from "../assets/logo.png";
import { SpecialOrderModal } from "../components/SpecialOrderModal";
import { OrderTrackingModal } from "../components/OrderTrackingModal";
import toast from "react-hot-toast";


export const Home = () => {
  const { language, t, isRtl } = useLanguage();
  
  // Dynamic State loaded from Settings Database (mock localstorage)
  const [homepageData, setHomepageData] = useState({
    hero: {
      title: {
        en: "Shopping from Egypt. Shipping to Yemen.",
        ar: "تسوقي من مصر. الشحن لليمن."
      },
      subtitle: {
        en: "LELA is your premium personal shopping concierge. We acquire luxury products, fashion, and personal care from Cairo and deliver directly to your doorstep in Yemen.",
        ar: "ليلا هي رفيقة تسوقك الشخصية الفاخرة. نوفر لكِ مستحضرات التجميل، الأزياء، والمنتجات المنزلية من القاهرة ونوصلها مباشرة إلى باب بيتكِ في اليمن."
      }
    },
    whyLela: [],
    howItWorks: []
  });
  const [faqs, setFaqs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [contactInfo, setContactInfo] = useState({
    phoneEgypt: '+201557179009',
    phoneYemen: '+967784990676',
    email: 'lela.storex@gmail.com',
    instagram: 'https://instagram.com/lela_e0',
    facebook: 'https://facebook.com/lela.e0',
    whatsappEgypt: 'https://wa.me/201557179009',
    whatsappYemen: 'https://wa.me/967784990676'
  });
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);

  // Additional Completed Features States
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isSpecialOrderOpen, setIsSpecialOrderOpen] = useState(false);

  const loadHomeData = async () => {
    try {
      const [settings, faqsList, reviewsList, categoriesList, products] = await Promise.all([
        settingsService.get(),
        settingsService.getFaqs(),
        settingsService.getReviews(),
        settingsService.getCategories(),
        productService.getAll()
      ]);

      if (settings?.homepage) setHomepageData(settings.homepage);
      if (settings?.contactInfo) setContactInfo(settings.contactInfo);
      if (faqsList) setFaqs(faqsList);
      if (reviewsList) setReviews(reviewsList);
      if (categoriesList) setCategories(categoriesList);

      setFeaturedProducts(products.filter(p => p.featured));

      // Load recently viewed
      const recentIdsRaw = localStorage.getItem("lela_recently_viewed");
      if (recentIdsRaw) {
        const recentIds = JSON.parse(recentIdsRaw);
        const recentProducts = recentIds
          .map(id => products.find(p => p.id === id))
          .filter(Boolean);
        setRecentlyViewed(recentProducts.slice(0, 4));
      }
    } catch (e) {
      console.error("Failed to load homepage data", e);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    const homeSubscription = supabase
      .channel("realtime-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => { loadHomeData(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        () => { loadHomeData(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "faqs" },
        () => { loadHomeData(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => { loadHomeData(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(homeSubscription);
    };
  }, []);


  // Helper to map icon name to Lucide Component
  const getIcon = (name) => {
    switch (name) {
      case "Sparkles": return <Sparkles className="w-5 h-5 text-primary" />;
      case "ShieldCheck": return <ShieldCheck className="w-5 h-5 text-primary" />;
      case "Coins": return <Coins className="w-5 h-5 text-primary" />;
      case "Truck": return <Truck className="w-5 h-5 text-primary" />;
      default: return <Sparkles className="w-5 h-5 text-primary" />;
    }
  };

  const heroTitle = homepageData.hero.title[language] || homepageData.hero.title.en;
  const heroSubtitle = homepageData.hero.subtitle[language] || homepageData.hero.subtitle.en;

  return (
    <div className="space-y-20 md:space-y-32">
      {/* 1. Luxury Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-6 md:px-12 -mt-24">
        {/* Soft elegant gradient blur in background */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-secondary/20 dark:bg-primary/10 rounded-full blur-[80px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-primary/15 dark:bg-secondary/10 rounded-full blur-[70px] -z-10 animate-pulse" />

        <div className="max-w-4xl mx-auto text-center space-y-8 flex flex-col items-center">
          {/* Animated Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="w-28 h-28 rounded-full border border-primary/10 dark:border-secondary/10 flex items-center justify-center bg-white/40 dark:bg-black/30 backdrop-blur-sm shadow-inner">
              <img
                src={logo}
                alt="LELA Logo Symbol"
                className="w-16 h-auto object-contain animate-[glow_3s_ease-in-out_infinite]"
              />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 1.0 }}
            className="space-y-4"
          >
            <h1 className="text-3xl md:text-6xl font-light text-brand-text dark:text-brand-dark-text tracking-wide leading-tight font-sans">
              {heroTitle}
            </h1>
            <p className="text-sm md:text-base text-brand-text/60 dark:text-brand-dark-text/60 font-light max-w-2xl mx-auto leading-relaxed">
              {heroSubtitle}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.0 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-xl"
          >
            <Link
              to="/shop"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary hover:bg-primary/95 text-white font-semibold text-xs tracking-wider uppercase font-english flex items-center justify-center gap-2 shadow-lg shadow-primary/15 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShoppingBag className="w-4 h-4" />
              {t("startShopping")}
            </Link>
            <a
              href="#calculator"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-primary/20 bg-white/40 dark:bg-black/30 backdrop-blur-sm text-brand-text dark:text-brand-dark-text hover:bg-primary/5 hover:border-primary/40 font-semibold text-xs tracking-wider uppercase font-english flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Layers className="w-4 h-4" />
              {t("calculateShipping")}
            </a>
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-dashed border-primary/30 bg-transparent text-brand-text dark:text-brand-dark-text hover:bg-primary/5 font-semibold text-xs tracking-wider uppercase font-english flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-primary" />
              {language === "ar" ? "تتبع طلبيتك" : "Track Order"}
            </button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="pt-8"
          >
            <ChevronDown className="w-5 h-5 text-primary/40 dark:text-secondary/40 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* 2. Why LELA Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide">
            {t("whyLela")}
          </h2>
          <div className="w-12 h-[1px] bg-primary/40 dark:bg-secondary/40 mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {homepageData.whyLela.map((item, idx) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-white dark:bg-brand-dark-card border border-primary/5 dark:border-secondary/5 shadow-sm space-y-4 hover:shadow-md hover:border-primary/10 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-primary/5 dark:bg-secondary/5 flex items-center justify-center">
                {getIcon(item.icon)}
              </div>
              <h3 className="font-semibold text-sm text-brand-text dark:text-brand-dark-text">
                {item.title[language] || item.title.en}
              </h3>
              <p className="text-xs text-brand-text/50 dark:text-brand-dark-text/50 font-light leading-relaxed">
                {item.description[language] || item.description.en}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Categories Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide">
            {language === "ar" ? "تسوقي حسب التصنيف" : "Shop By Category"}
          </h2>
          <div className="w-12 h-[1px] bg-primary/40 dark:bg-secondary/40 mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories
            .filter((c) => !c.hidden)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.name.en}`}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 border border-primary/5 dark:border-secondary/5"
              >
                <img
                  src={cat.image}
                  alt={cat.name.en}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/45 group-hover:bg-black/55 transition-colors duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-xs md:text-sm font-semibold text-white tracking-wider group-hover:scale-105 transition-transform duration-300 font-sans">
                    {language === "ar" ? cat.name.ar : cat.name.en}
                  </span>
                  <span className="text-[9px] text-white/70 uppercase tracking-widest font-english mt-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {t("shop")} <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* 4. Latest Products */}
      <section className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide">
              {t("latestProducts")}
            </h2>
            <div className="w-12 h-[1px] bg-primary/40 dark:bg-secondary/40" />
          </div>
          <Link
            to="/shop"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-secondary uppercase tracking-widest font-english hover:underline"
          >
            {language === "ar" ? "عرض الكل" : "View All"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {featuredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Shipping Calculator Section */}
      <section id="calculator" className="py-20 bg-primary/5 dark:bg-brand-dark-card/30 border-y border-primary/5 dark:border-secondary/5 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-primary dark:text-secondary">
              {t("calculator")}
            </span>
            <h2 className="text-3xl md:text-4xl font-light text-brand-text dark:text-brand-dark-text leading-tight">
              {language === "ar" ? "تكلفة شحن شفافة بلا مفاجآت" : "Transparent Shipping, No Surprises."}
            </h2>
            <p className="text-xs text-brand-text/60 dark:text-brand-dark-text/60 font-light leading-relaxed max-w-md">
              {language === "ar"
                ? "نوفر لك خدمة شراء المنتجات من مصر وتغليفها ثم شحنها لليمن بأسعار مدروسة للكيلوغرام. استخدم الحاسبة لمعرفة التكلفة الإجمالية بالريال اليمني بشكل فوري."
                : "We bundle and ship items from Cairo straight to Yemen. Shipping calculations are based on the category weight rules. Compute costs in YER in real-time."}
            </p>
            <div className="space-y-3 pt-2 text-xs font-light text-brand-text/80 dark:text-brand-dark-text/80">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>{t("personalCareRate")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <span>{t("clothingHomeRate")}</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <ShippingCalculator />
          </div>
        </div>
      </section>

      {/* 6. How it Works */}
      <section className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-2xl md:text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide">
            {t("howItWorks")}
          </h2>
          <div className="w-12 h-[1px] bg-primary/40 dark:bg-secondary/40 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {homepageData.howItWorks.map((item, idx) => (
            <div key={item.step} className="flex flex-col items-center text-center space-y-4 relative z-10 group">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-brand-dark-card border border-primary/10 dark:border-secondary/10 flex items-center justify-center text-xl font-bold font-english text-primary dark:text-secondary group-hover:scale-110 group-hover:border-primary transition-all duration-300 shadow-sm">
                0{item.step}
              </div>
              <h3 className="font-semibold text-sm text-brand-text dark:text-brand-dark-text pt-2">
                {item.title[language] || item.title.en}
              </h3>
              <p className="text-xs text-brand-text/50 dark:text-brand-dark-text/50 font-light leading-relaxed max-w-xs">
                {item.description[language] || item.description.en}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-6">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide">
            {t("faqTitle")}
          </h2>
          <div className="w-12 h-[1px] bg-primary/40 dark:bg-secondary/40 mx-auto" />
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isFaqActive = activeFaq === idx;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-primary/5 dark:border-secondary/5 bg-white dark:bg-brand-dark-card overflow-hidden shadow-sm transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isFaqActive ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  <span className="font-semibold text-sm text-brand-text dark:text-brand-dark-text text-start pr-4">
                    {faq.question[language] || faq.question.en}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-primary dark:text-secondary transition-transform duration-300 ${
                      isFaqActive ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isFaqActive ? "max-h-[300px] border-t border-primary/5 dark:border-secondary/5 p-6 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <p className="text-xs text-brand-text/60 dark:text-brand-dark-text/60 font-light leading-relaxed">
                    {faq.answer[language] || faq.answer.en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Customer Reviews Slider */}
      <section className="max-w-4xl mx-auto px-6 relative">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide">
            {t("customerReviews")}
          </h2>
          <div className="w-12 h-[1px] bg-primary/40 dark:bg-secondary/40 mx-auto" />
        </div>

        {reviews.length > 0 ? (
          <div className="relative p-8 md:p-12 rounded-3xl bg-white dark:bg-brand-dark-card border border-primary/5 dark:border-secondary/5 shadow-xl transition-all duration-500 text-center flex flex-col justify-between min-h-[280px]">
            <div className="space-y-6">
              <div className="flex gap-1 text-amber-400 justify-center">
                {Array.from({ length: reviews[activeReviewIdx].rating || 5 }).map((_, i) => (
                  <Sparkles key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm md:text-base text-brand-text/80 dark:text-brand-dark-text/80 italic font-light leading-relaxed max-w-2xl mx-auto">
                "{reviews[activeReviewIdx].comment[language] || reviews[activeReviewIdx].comment.en}"
              </p>
            </div>

            <div className="flex flex-col items-center mt-8 pt-6 border-t border-primary/5 dark:border-secondary/5">
              <img
                src={reviews[activeReviewIdx].avatar}
                alt={reviews[activeReviewIdx].name}
                className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-primary/10"
              />
              <h4 className="text-xs font-bold text-brand-text dark:text-brand-dark-text mt-3">
                {reviews[activeReviewIdx].name}
              </h4>
              <span className="text-[9px] text-brand-text/40 dark:text-brand-dark-text/40 font-english mt-0.5">
                {reviews[activeReviewIdx].date}
              </span>
            </div>

            {/* Slider Navigation Buttons */}
            <div className="absolute inset-y-0 -inset-x-4 md:-inset-x-12 flex justify-between items-center pointer-events-none">
              <button
                onClick={() => setActiveReviewIdx(prev => (prev === 0 ? reviews.length - 1 : prev - 1))}
                className="w-10 h-10 rounded-full bg-white dark:bg-brand-dark-bg border border-primary/10 hover:border-primary/45 text-primary dark:text-secondary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveReviewIdx(prev => (prev === reviews.length - 1 ? 0 : prev + 1))}
                className="w-10 h-10 rounded-full bg-white dark:bg-brand-dark-bg border border-primary/10 hover:border-primary/45 text-primary dark:text-secondary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-brand-text/30">No customer reviews yet.</p>
        )}
      </section>


      {/* 9.3 Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl md:text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide">
              {language === "ar" ? "شاهدتِ مؤخراً" : "Recently Viewed"}
            </h2>
            <div className="w-12 h-[1px] bg-primary/40 dark:bg-secondary/40 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyViewed.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 9.4 Special Sourcing Banner */}
      <section className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border border-primary/10 dark:border-secondary/5 p-8 md:p-12 shadow-sm text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-[9px] tracking-[0.25em] uppercase font-bold text-primary dark:text-secondary block">
              {language === "ar" ? "طلب شراء مخصص" : "Sourcing Concierge"}
            </span>
            <h2 className="text-xl md:text-3xl font-light tracking-wide text-brand-text dark:text-brand-dark-text">
              {language === "ar" ? "هل ترغبين بشراء منتج خاص من مصر؟" : "Can't find what you're looking for?"}
            </h2>
            <p className="text-xs text-brand-text/60 dark:text-brand-dark-text/60 font-light leading-relaxed">
              {language === "ar" 
                ? "تسوّقي من أي صيدلية، متجر ملابس، أو موقع إلكتروني في القاهرة، وسنتولى الشراء والشحن الآمن لعنوانكِ في اليمن!" 
                : "Shop from any pharmacy, Zara branch, or local brand in Egypt. Submit a custom request, and we will buy and ship it securely to Yemen!"}
            </p>
          </div>
          <button
            onClick={() => setIsSpecialOrderOpen(true)}
            className="px-8 py-3 rounded-full bg-primary hover:bg-primary/95 text-white font-bold text-xs tracking-wider uppercase font-english shadow-lg shadow-primary/15 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {language === "ar" ? "إرسال طلب خاص الآن" : "Submit Special Request"}
          </button>
        </div>
      </section>

      {/* 9.5 Newsletter Signup */}
      <section className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="rounded-3xl bg-primary text-white p-8 md:p-12 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -z-10" />
          <div className="space-y-2 md:max-w-md">
            <h2 className="text-xl md:text-2xl font-light tracking-wide">
              {language === "ar" ? "اشتركي في النشرة البريدية" : "Join the LELA Newsletter"}
            </h2>
            <p className="text-xs text-white/70 font-light leading-relaxed">
              {language === "ar" ? "احصلي على إشعارات فورية عند مغادرة شحنات جديدة من القاهرة أو إضافة كوبونات خصم." : "Get notified when new shipping batches leave Cairo, or when exclusive promo coupons drop."}
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); toast.success("Subscribed successfully!"); e.target.reset(); }} className="flex gap-2 w-full md:w-auto max-w-sm">
            <input type="email" required placeholder="Enter email address" className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none" />
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-white text-primary text-xs font-bold uppercase tracking-wider hover:bg-white/95 hover:scale-105 transition-all duration-300 cursor-pointer">Subscribe</button>
          </form>
        </div>
      </section>

      {/* 10. Contact Us */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
        <div className="rounded-3xl bg-white dark:bg-brand-dark-card border border-primary/5 dark:border-secondary/5 p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide">
              {t("contactUs")}
            </h2>
            <p className="text-xs text-brand-text/50 dark:text-brand-dark-text/50 font-light leading-relaxed max-w-sm">
              {language === "ar"
                ? "هل لديكِ استفسارات خاصة أو طلبيات مخصصة تودين شراءها من القاهرة؟ فريقنا في خدمتكِ على مدار الساعة عبر الهاتف أو البريد الإلكتروني."
                : "Have customized orders or specific shopping items from Egypt not listed? Our team is available 24/7 to buy and ship them for you."}
            </p>
            <div className="space-y-4 text-xs font-light">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary dark:text-secondary" />
                <a href={`tel:${contactInfo.phoneEgypt}`} className="hover:underline font-english text-brand-text dark:text-brand-dark-text">
                  {contactInfo?.phoneEgypt} (Egypt)
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary dark:text-secondary" />
                <a href={`tel:${contactInfo.phoneYemen}`} className="hover:underline font-english text-brand-text dark:text-brand-dark-text">
                  {contactInfo?.phoneYemen} (Yemen)
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary dark:text-secondary" />
                <a href={`mailto:${contactInfo.email}`} className="hover:underline font-english text-brand-text dark:text-brand-dark-text">
                  {contactInfo?.email}
                </a>
              </div>
            </div>
          </div>
          
          <div className="h-64 rounded-2xl overflow-hidden relative bg-brand-bg dark:bg-brand-dark-bg border border-primary/5 dark:border-secondary/5 flex items-center justify-center">
            {/* Elegant luxury visual map representation or quote */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/10 -z-10" />
            <div className="text-center p-6 space-y-3">
              <MapPin className="w-8 h-8 text-primary dark:text-secondary mx-auto animate-bounce" />
              <h4 className="font-semibold text-xs text-brand-text dark:text-brand-dark-text">
                {language === "ar" ? "القاهرة ➔ اليمن" : "Cairo ➔ Yemen"}
              </h4>
              <p className="text-[10px] text-brand-text/50 dark:text-brand-dark-text/50 font-light max-w-[200px] mx-auto leading-relaxed">
                {language === "ar" 
                  ? "نقوم بالتسوق في القاهرة والشحن لكافة المحافظات اليمنية" 
                  : "We purchase in Cairo and deliver across all Yemen governorates"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popups & Modals */}
      <SpecialOrderModal isOpen={isSpecialOrderOpen} onClose={() => setIsSpecialOrderOpen(false)} />
      <OrderTrackingModal isOpen={isTrackingOpen} onClose={() => setIsTrackingOpen(false)} />
    </div>
  );
};
