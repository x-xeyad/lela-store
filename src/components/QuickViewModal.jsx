import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { X, ShoppingBag, Heart, Scale, Star, Truck, MessageCircle } from "lucide-react";
import { CONTACT_INFO } from "../constants/contact";
import toast from "react-hot-toast";

export const QuickViewModal = ({ product, isOpen, onClose }) => {
  const { language, t, isRtl } = useLanguage();
  const { addToCart, getShippingCostForItem, formatPrice, getProductDiscountInfo, getItemUnitPriceEGP } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      const initial = {};
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(v => {
          if (v.options && v.options.length > 0) {
            initial[v.name] = v.options[0];
          }
        });
      } else {
        if (product.sizes && product.sizes.length > 0) initial["Size"] = product.sizes[0];
        if (product.colors && product.colors.length > 0) initial["Color"] = product.colors[0];
      }
      setSelectedVariants(initial);
      setActiveImageIdx(0);
      setQuantity(1);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const name = product.name[language] || product.name.en;
  const desc = product.description[language] || product.description.en;
  
  // Pricing & Discounts
  const discInfo = getProductDiscountInfo(product);
  const originalPriceEGP = product.priceEGP;
  const currentPriceEGP = getItemUnitPriceEGP(product);
  const weight = product.weight || 0.5;
  const shipCostEGP = getShippingCostForItem(product);
  
  const totalPriceEGP = currentPriceEGP + shipCostEGP;
  const originalTotalPriceEGP = originalPriceEGP + shipCostEGP;
  const favorited = isFavorite(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariants);
    toast.success(`${name} ${language === "ar" ? "أُضيف إلى السلة" : "added to cart"}`);
    onClose();
  };

  const handleBuyNowWhatsapp = () => {
    let variantsStr = "";
    Object.entries(selectedVariants).forEach(([key, val]) => {
      variantsStr += `\n- ${key}: ${val}`;
    });

    const formattedItem = formatPrice(currentPriceEGP, "en");
    const formattedShip = formatPrice(shipCostEGP, "en");
    const formattedTotal = formatPrice(totalPriceEGP * quantity, "en");
    
    let text = `*LELA QUICK BUY REQUEST*\n`;
    text += `--------------------------\n`;
    text += `*Product:* ${product.name.en}\n`;
    text += `*Qty:* ${quantity}${variantsStr}\n`;
    text += `*Weight:* ${weight} KG\n\n`;
    text += `*Item Price:* ${formattedItem}\n`;
    text += `*Shipping Cost:* ${formattedShip}\n`;
    text += `*Total Amount:* ${formattedTotal}\n`;
    text += `--------------------------\n`;
    text += `Please process my order. Thank you!`;

    const encodedMsg = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${CONTACT_INFO.phoneYemen.replace("+", "")}?text=${encodedMsg}`;
    window.open(whatsappUrl, "_blank");
    onClose();
  };

  const formatEGP = (val) => {
    return language === "ar" ? `${val.toLocaleString()} ج.م` : `EGP ${val.toLocaleString()}`;
  };

  const handleVariantChange = (name, value) => {
    setSelectedVariants(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-brand-bg dark:bg-brand-dark-card border border-primary/10 dark:border-secondary/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 z-25 p-2 rounded-full glassmorphism text-brand-text/60 hover:text-primary transition-all duration-300 cursor-pointer ${
            isRtl ? "left-4" : "right-4"
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Section: Gallery */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between border-r border-primary/5 dark:border-secondary/5 bg-brand-bg/20 dark:bg-brand-dark-bg/20 overflow-y-auto">
          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-primary/5 shadow-sm relative bg-white dark:bg-brand-dark-bg flex items-center justify-center">
            <img
              src={product.images[activeImageIdx] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3"}
              alt={name}
              className="w-full h-full object-cover object-center"
            />
            {/* Heart wishlist overlay */}
            <button
              onClick={() => toggleFavorite(product)}
              className="absolute top-4 right-4 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md text-brand-text dark:text-brand-dark-text shadow-sm hover:scale-110 transition-all duration-300 cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${favorited ? "fill-primary text-primary" : "text-brand-text/50"}`} />
            </button>
            {/* Discount Badge */}
            {discInfo.hasDiscount && (
              <div className="absolute top-4 left-4 z-20 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase text-white bg-primary dark:bg-secondary dark:text-brand-dark-card rounded-md shadow-sm">
                {discInfo.discountText} {language === "ar" ? "خصم" : "OFF"}
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-2.5 mt-4 overflow-x-auto py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-16 aspect-square rounded-xl overflow-hidden border-2 bg-white dark:bg-brand-dark-bg flex-shrink-0 transition-all cursor-pointer ${
                    activeImageIdx === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Section: Details */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-primary dark:text-secondary">
              {t(product.category.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || product.category}
            </span>
            <h2 className="text-xl md:text-2xl font-light text-brand-text dark:text-brand-dark-text tracking-wide leading-tight">
              {name}
            </h2>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? "fill-amber-400" : "text-brand-text/20"}`} />
                ))}
              </div>
              <span className="text-[10px] text-brand-text/50 font-english font-medium">
                {product.rating.toFixed(1)} ({product.reviewsCount} reviews)
              </span>
            </div>

            <p className="text-xs text-brand-text/60 dark:text-brand-dark-text/60 font-light leading-relaxed">
              {desc}
            </p>

            {/* Pricing Section */}
            <div className="pt-2 flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-primary dark:text-secondary font-english">
                  {formatPrice(currentPriceEGP, language)}
                </span>
                {discInfo.hasDiscount && (
                  <span className="text-xs line-through text-brand-text/30 dark:text-brand-dark-text/30 font-english">
                    {formatPrice(originalPriceEGP, language)}
                  </span>
                )}
              </div>
              <span className="text-[9px] block text-brand-text/40 dark:text-brand-dark-text/40">
                {t("priceEgp")}: {formatEGP(currentPriceEGP)}
              </span>
              {discInfo.hasDiscount && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {language === "ar" ? "وفرت " : "Save "}{formatPrice(discInfo.savedEGP, language)}
                </span>
              )}
            </div>

            {/* Sizing & Colors / Custom Variants */}
            <div className="grid grid-cols-2 gap-4">
              {product.variants && product.variants.length > 0 ? (
                product.variants.map((v) => (
                  <div key={v.name} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-text/50">{v.name}</label>
                    <select
                      value={selectedVariants[v.name] || ""}
                      onChange={(e) => handleVariantChange(v.name, e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-primary/10 bg-transparent text-brand-text focus:outline-none dark:text-white"
                    >
                      {v.options.map(o => <option key={o} value={o} className="dark:bg-brand-dark-card">{o}</option>)}
                    </select>
                  </div>
                ))
              ) : (
                <>
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-brand-text/50">{t("size")}</label>
                      <select
                        value={selectedVariants["Size"] || ""}
                        onChange={(e) => handleVariantChange("Size", e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-primary/10 bg-transparent text-brand-text focus:outline-none dark:text-white"
                      >
                        {product.sizes.map(s => <option key={s} value={s} className="dark:bg-brand-dark-card">{s}</option>)}
                      </select>
                    </div>
                  )}
                  {product.colors && product.colors.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-brand-text/50">{t("color")}</label>
                      <select
                        value={selectedVariants["Color"] || ""}
                        onChange={(e) => handleVariantChange("Color", e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-primary/10 bg-transparent text-brand-text focus:outline-none dark:text-white"
                      >
                        {product.colors.map(c => <option key={c} value={c} className="dark:bg-brand-dark-card">{c}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Shipping Estimate Card */}
            <div className="p-4 rounded-xl border border-primary/10 dark:border-secondary/10 bg-primary/5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-primary dark:text-secondary font-bold uppercase text-[10px]">
                <Scale className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "الشحن لليمن" : "Shipping to Yemen"}</span>
              </div>
              <div className="flex justify-between font-light">
                <span className="text-brand-text/60">{t("weight")} ({weight} KG):</span>
                <span className="font-english font-bold text-primary dark:text-secondary">{formatPrice(shipCostEGP, language)}</span>
              </div>
              <div className="border-t border-primary/5 pt-2 flex justify-between font-semibold">
                <span>{language === "ar" ? "شامل الشحن:" : "Incl. Shipping:"}</span>
                <span className="font-english text-primary dark:text-secondary">{formatPrice(totalPriceEGP * quantity, language)}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 rounded-xl border border-primary/20 hover:border-primary/40 text-brand-text dark:text-white font-bold text-xs tracking-wider uppercase font-english flex items-center justify-center gap-2 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-primary" />
                {t("addToCart")}
              </button>
              <button
                onClick={handleBuyNowWhatsapp}
                className="flex-1 py-3 rounded-xl bg-[#25D366] hover:bg-[#25D366]/95 text-white font-bold text-xs tracking-wider uppercase font-english flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/10 transition-all duration-300 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                {language === "ar" ? "طلب سريع" : "WhatsApp"}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[9px] text-brand-text/50 font-light">
              <Truck className="w-3.5 h-3.5 text-primary" />
              <span>{t("estDelivery")}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
