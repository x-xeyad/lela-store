import React, { createContext, useContext, useState, useEffect } from "react";
import { settingsService } from "../services/settingsService";
import { useLanguage } from "./LanguageContext";
import toast from "react-hot-toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("lela_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [rates, setRates] = useState({
    personalCare: 450,
    clothingHome: 300,
    defaultWeight: 0.5
  });
  
  const [exchangeRate, setExchangeRate] = useState(11.5); // EGP to YER
  const [yerToSarRate, setYerToSarRate] = useState(140);   // YER to SAR
  
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const savedCurrency = localStorage.getItem("lela_currency");
    return savedCurrency === "SAR" ? "SAR" : "YER";
  });

  const { language } = useLanguage();
  const [couponCode, setCouponCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [activeCoupons, setActiveCoupons] = useState([]);

  useEffect(() => {
    localStorage.setItem("lela_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("lela_currency", selectedCurrency);
  }, [selectedCurrency]);

  // Load active shipping rates and coupons from settings database on mount and cart update
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.get();
        if (settings.shippingRates) {
          setRates(settings.shippingRates);
        }
        if (settings.currency?.egpToYerRate) {
          setExchangeRate(settings.currency.egpToYerRate);
        }
        if (settings.currency?.yerToSarRate) {
          setYerToSarRate(settings.currency.yerToSarRate);
        }
        
        const couponsList = await settingsService.getCoupons();
        setActiveCoupons(couponsList || []);
      } catch (e) {
        console.error("Failed to load settings in cart context", e);
      }
    };
    fetchSettings();
  }, [cart]);

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const applyCoupon = (code) => {
    const matched = activeCoupons.find(
      c => c.code.toUpperCase() === code.toUpperCase()
    );
    if (!matched) {
      toast.error(language === "ar" ? "الكوبون غير صحيح" : "Invalid coupon code");
      return false;
    }
    if (!matched.active) {
      toast.error(language === "ar" ? "هذا الكوبون غير نشط" : "This coupon is disabled");
      return false;
    }
    if (matched.expirationDate && new Date(matched.expirationDate) < new Date()) {
      toast.error(language === "ar" ? "هذا الكوبون منتهي الصلاحية" : "This coupon has expired");
      return false;
    }
    
    // Check minimum order value
    const orderSubtotalSelected = convertEgpToSelected(cartSubtotalEGP);
    if (matched.minOrderValue && orderSubtotalSelected < matched.minOrderValue) {
      const minValText = matched.discountType === "fixed" ? `${matched.minOrderValue} YER` : `${matched.minOrderValue} YER`;
      toast.error(
        language === "ar" 
          ? `الحد الأدنى للطلب لتفعيل الكوبون هو ${minValText}` 
          : `Minimum order value is ${minValText}`
      );
      return false;
    }

    if (matched.maxUses && matched.usedCount >= matched.maxUses) {
      toast.error(language === "ar" ? "تم الوصول للحد الأقصى لاستخدام الكوبون" : "This coupon has reached usage limit");
      return false;
    }

    setAppliedCoupon(matched);
    setCouponCode(matched.code);
    
    const discText = matched.discountType === "percentage" 
      ? `${matched.discountValue}%` 
      : formatPrice(matched.discountValue / exchangeRate, language);
      
    toast.success(
      language === "ar" 
        ? `تم تطبيق خصم الكوبون ${discText}` 
        : `Applied coupon discount of ${discText}`
    );
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success(language === "ar" ? "تم إزالة الكوبون" : "Coupon removed");
  };

  const addToCart = (product, quantity = 1, variantsOrSize = {}, color = "") => {
    let selectedVariants = {};
    if (typeof variantsOrSize === "string") {
      if (variantsOrSize) selectedVariants["Size"] = variantsOrSize;
      if (color) selectedVariants["Color"] = color;
    } else {
      selectedVariants = variantsOrSize || {};
    }

    setCart(prev => {
      const idx = prev.findIndex(item => {
        if (item.product.id !== product.id) return false;
        const keys1 = Object.keys(item.selectedVariants || {});
        const keys2 = Object.keys(selectedVariants);
        if (keys1.length !== keys2.length) return false;
        return keys1.every(key => item.selectedVariants[key] === selectedVariants[key]);
      });

      if (idx > -1) {
        const newCart = [...prev];
        newCart[idx].quantity += quantity;
        return newCart;
      } else {
        return [...prev, { product, quantity, selectedVariants }];
      }
    });
  };

  const removeFromCart = (productId, selectedVariants = {}) => {
    setCart(prev =>
      prev.filter(item => {
        if (item.product.id !== productId) return true;
        const keys1 = Object.keys(item.selectedVariants || {});
        const keys2 = Object.keys(selectedVariants || {});
        if (keys1.length !== keys2.length) return true;
        const match = keys1.every(key => item.selectedVariants[key] === selectedVariants[key]);
        return !match;
      })
    );
  };

  const updateQuantity = (productId, selectedVariants = {}, quantity = 1) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedVariants);
      return;
    }
    setCart(prev => {
      const idx = prev.findIndex(item => {
        if (item.product.id !== productId) return false;
        const keys1 = Object.keys(item.selectedVariants || {});
        const keys2 = Object.keys(selectedVariants || {});
        if (keys1.length !== keys2.length) return false;
        return keys1.every(key => item.selectedVariants[key] === selectedVariants[key]);
      });
      if (idx > -1) {
        const newCart = [...prev];
        newCart[idx].quantity = quantity;
        return newCart;
      }
      return prev;
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getItemUnitPriceEGP = (product) => {
    const priceEGP = product.priceEGP || 0;
    const discountType = product.discountType || "none";
    const discountValue = parseFloat(product.discountValue || 0);

    let discountEGP = 0;
    if (discountType === "percentage" && discountValue > 0) {
      discountEGP = priceEGP * (discountValue / 100);
    } else if (discountType === "fixed" && discountValue > 0) {
      discountEGP = discountValue / exchangeRate;
    }
    return Math.max(0, priceEGP - discountEGP);
  };

  const getProductDiscountInfo = (product) => {
    const priceEGP = product.priceEGP || 0;
    const discountType = product.discountType || "none";
    const discountValue = parseFloat(product.discountValue || 0);

    let discountEGP = 0;
    if (discountType === "percentage" && discountValue > 0) {
      discountEGP = priceEGP * (discountValue / 100);
    } else if (discountType === "fixed" && discountValue > 0) {
      discountEGP = discountValue / exchangeRate;
    }

    const discountedPriceEGP = Math.max(0, priceEGP - discountEGP);

    return {
      hasDiscount: discountValue > 0 && discountType !== "none",
      originalPriceEGP: priceEGP,
      discountedPriceEGP: discountedPriceEGP,
      savedEGP: discountEGP,
      discountValue,
      discountType,
      discountText: discountType === "percentage"
        ? `${discountValue}%`
        : `${discountValue} YER`
    };
  };

  const cartSubtotalEGP = cart.reduce(
    (acc, item) => acc + getItemUnitPriceEGP(item.product) * item.quantity,
    0
  );

  const getShippingCostForItem = (product) => {
    const weight = product.weight || rates.defaultWeight || 0.5;
    const ratePerKg =
      product.category === "Personal Care"
        ? rates.personalCare
        : rates.clothingHome;
    return ratePerKg * weight;
  };

  const cartShippingEGP = cart.reduce(
    (acc, item) => acc + getShippingCostForItem(item.product) * item.quantity,
    0
  );

  const cartTotalEGPBeforeDiscount = cartSubtotalEGP + cartShippingEGP;
  
  let cartDiscountEGP = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      cartDiscountEGP = cartSubtotalEGP * (appliedCoupon.discountValue / 100);
    } else {
      cartDiscountEGP = appliedCoupon.discountValue / exchangeRate;
    }
  }

  const cartTotalEGP = Math.max(0, cartTotalEGPBeforeDiscount - cartDiscountEGP);
  
  // YER Conversions
  const cartSubtotalYER = cartSubtotalEGP * exchangeRate;
  const cartShippingYER = cartShippingEGP * exchangeRate;
  const cartTotalYER = cartTotalEGP * exchangeRate;

  // Selected Currency Conversions & Helpers
  const convertEgpToSelected = (egpAmount) => {
    const yerAmount = egpAmount * exchangeRate;
    if (selectedCurrency === "SAR") {
      return Math.round(yerAmount / yerToSarRate);
    }
    return Math.round(yerAmount);
  };

  const formatPrice = (egpAmount, lang = "en") => {
    const converted = convertEgpToSelected(egpAmount);
    if (selectedCurrency === "SAR") {
      return lang === "ar"
        ? `${converted.toLocaleString()} ر.س`
        : `${converted.toLocaleString()} SAR`;
    } else {
      return lang === "ar"
        ? `${converted.toLocaleString()} ر.ي`
        : `${converted.toLocaleString()} YER`;
    }
  };

  const cartSubtotalSelected = convertEgpToSelected(cartSubtotalEGP);
  const cartShippingSelected = convertEgpToSelected(cartShippingEGP);
  const cartTotalSelected = convertEgpToSelected(cartTotalEGP);
  const cartDiscountSelected = convertEgpToSelected(cartDiscountEGP);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotalEGP,
        cartShippingEGP,
        cartTotalEGPBeforeDiscount,
        cartDiscountEGP,
        cartTotalEGP,
        cartSubtotalYER,
        cartShippingYER,
        cartTotalYER,
        getShippingCostForItem,
        exchangeRate,
        yerToSarRate,
        selectedCurrency,
        setSelectedCurrency,
        convertEgpToSelected,
        formatPrice,
        cartSubtotalSelected,
        cartShippingSelected,
        cartTotalSelected,
        cartDiscountSelected,
        couponCode,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        activeCoupons,
        getProductDiscountInfo,
        getItemUnitPriceEGP
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
