import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { Scale, ArrowRightLeft, Sparkles } from "lucide-react";
import { settingsService } from "../services/settingsService";

export const ShippingCalculator = () => {
  const { language, t, isRtl } = useLanguage();
  const { exchangeRate, yerToSarRate, selectedCurrency } = useCart();
  
  const [rates, setRates] = useState({
    personalCare: 450,
    clothingHome: 300
  });

  const [category, setCategory] = useState("clothingHome");
  const [weight, setWeight] = useState(1);
  const [calcCurrency, setCalcCurrency] = useState("YER");
  const [computedCost, setComputedCost] = useState(0);

  // Sync with global currency choice on mount
  useEffect(() => {
    if (selectedCurrency) {
      setCalcCurrency(selectedCurrency);
    }
  }, [selectedCurrency]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const settings = await settingsService.get();
        if (settings.shippingRates) {
          setRates(settings.shippingRates);
        }
      } catch (e) {
        console.error("Failed to load settings in ShippingCalculator", e);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const rate = category === "personalCare" ? rates.personalCare : rates.clothingHome;
    const egpCost = rate * parseFloat(weight || 0);
    
    if (calcCurrency === "EGP") {
      setComputedCost(Math.round(egpCost));
    } else if (calcCurrency === "SAR") {
      const yerCost = egpCost * exchangeRate;
      setComputedCost(Math.round(yerCost / yerToSarRate));
    } else {
      // YER
      const yerCost = egpCost * exchangeRate;
      setComputedCost(Math.round(yerCost));
    }
  }, [category, weight, rates, exchangeRate, yerToSarRate, calcCurrency]);

  const handleWeightChange = (e) => {
    const value = e.target.value;
    if (value === "" || parseFloat(value) >= 0) {
      setWeight(value);
    }
  };

  const formatCurrency = (val, cur) => {
    if (cur === "EGP") {
      return language === "ar" ? `${val.toLocaleString()} ج.م` : `EGP ${val.toLocaleString()}`;
    } else if (cur === "SAR") {
      return language === "ar" ? `${val.toLocaleString()} ر.س` : `${val.toLocaleString()} SAR`;
    } else {
      return language === "ar" ? `${val.toLocaleString()} ر.ي` : `${val.toLocaleString()} YER`;
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl p-6 md:p-8 bg-white/80 dark:bg-brand-dark-card/80 backdrop-blur-xl border border-primary/10 dark:border-secondary/10 shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 text-primary dark:text-secondary mb-4 justify-center">
        <Scale className="w-6 h-6 animate-pulse" />
        <h3 className="text-xl font-bold font-english uppercase tracking-wider">
          {t("calcTitle")}
        </h3>
      </div>
      <p className="text-xs text-brand-text/50 dark:text-brand-dark-text/50 text-center mb-6 font-light max-w-sm mx-auto">
        {t("calcSubtitle")}
      </p>

      <div className="space-y-5">
        {/* Category Picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-brand-text/70 dark:text-brand-dark-text/70">
            {t("selectCategory")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCategory("clothingHome")}
              className={`py-3 px-4 rounded-xl border text-xs font-medium transition-all duration-300 ${
                category === "clothingHome"
                  ? "bg-primary border-primary text-white shadow-md shadow-primary/10"
                  : "border-primary/10 bg-brand-bg/40 dark:bg-brand-dark-bg/40 text-brand-text/70 dark:text-brand-dark-text/70 hover:border-primary/30"
              }`}
            >
              {language === "ar" ? "الملابس والمنزل" : "Clothing & Home"}
              <div className="text-[10px] opacity-75 mt-0.5 font-light">
                ({rates.clothingHome} EGP/KG)
              </div>
            </button>
            <button
              onClick={() => setCategory("personalCare")}
              className={`py-3 px-4 rounded-xl border text-xs font-medium transition-all duration-300 ${
                category === "personalCare"
                  ? "bg-primary border-primary text-white shadow-md shadow-primary/10"
                  : "border-primary/10 bg-brand-bg/40 dark:bg-brand-dark-bg/40 text-brand-text/70 dark:text-brand-dark-text/70 hover:border-primary/30"
              }`}
            >
              {language === "ar" ? "العناية الشخصية" : "Personal Care"}
              <div className="text-[10px] opacity-75 mt-0.5 font-light">
                ({rates.personalCare} EGP/KG)
              </div>
            </button>
          </div>
        </div>

        {/* Inputs Group: Weight & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Weight Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-text/70 dark:text-brand-dark-text/70">
              {t("weightInput")}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weight}
                onChange={handleWeightChange}
                className="w-full px-5 py-3 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg/50 dark:bg-brand-dark-bg/50 text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-all duration-300 font-english text-sm"
                placeholder="e.g. 1.5"
              />
              <span className="absolute top-1/2 -translate-y-1/2 right-5 text-xs text-brand-text/40 dark:text-brand-dark-text/40 font-semibold font-english">
                KG
              </span>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-text/70 dark:text-brand-dark-text/70">
              {language === "ar" ? "عملة الشحن" : "Shipping Currency"}
            </label>
            <select
              value={calcCurrency}
              onChange={(e) => setCalcCurrency(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg/50 dark:bg-brand-dark-bg/50 text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-all duration-300 text-xs font-semibold cursor-pointer"
            >
              <option value="YER">🇾🇪 Yemeni Riyal (YER)</option>
              <option value="SAR">🇸🇦 Saudi Riyal (SAR)</option>
              <option value="EGP">🇪🇬 Egyptian Pound (EGP)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Result Panel */}
        <div className="pt-4 border-t border-primary/5 dark:border-secondary/5 mt-6 space-y-4">
          <div className="bg-primary/5 dark:bg-secondary/5 rounded-2xl p-6 border border-primary/10 dark:border-secondary/10 flex flex-col items-center justify-center text-center space-y-1.5">
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-primary dark:text-secondary opacity-70">
              {t("shippingCost")}
            </span>
            <div className="text-3xl font-extrabold text-brand-text dark:text-brand-dark-text font-english tracking-wide transition-all duration-500 scale-105">
              {formatCurrency(computedCost, calcCurrency)}
            </div>
            
            {calcCurrency !== "EGP" && (
              <span className="text-[10px] text-brand-text/40 dark:text-brand-dark-text/40 font-light mt-1">
                (Base Cost: {formatCurrency(rates[category === "personalCare" ? "personalCare" : "clothingHome"] * parseFloat(weight || 0), "EGP")})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 justify-center text-[10px] text-brand-text/50 dark:text-brand-dark-text/50 font-light">
            <Sparkles className="w-3.5 h-3.5 text-primary dark:text-secondary" />
            <span>{t("estDelivery")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
