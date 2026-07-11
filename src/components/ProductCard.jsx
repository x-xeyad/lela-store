import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import toast from "react-hot-toast";

export const ProductCard = ({ product, onQuickView }) => {
  const { language, t } = useLanguage();
  const { addToCart, getShippingCostForItem, formatPrice, getProductDiscountInfo, getItemUnitPriceEGP } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const name = product.name[language] || product.name.en;
  
  // Dynamic discount details
  const discInfo = getProductDiscountInfo(product);
  const originalPriceEGP = product.priceEGP;
  const currentPriceEGP = getItemUnitPriceEGP(product);
  const shipCostEGP = getShippingCostForItem(product);
  
  const totalCurrentPriceEGP = currentPriceEGP + shipCostEGP;
  const totalOriginalPriceEGP = originalPriceEGP + shipCostEGP;

  const mainImage = product.images[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3";
  const hoverImage = product.images[1] || mainImage;
  const favorited = isFavorite(product.id);

  const formatEGP = (val) => {
    return language === "ar"
      ? `${val.toLocaleString()} ج.م`
      : `EGP ${val.toLocaleString()}`;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Pick default options if product defines variants
    const selectedVariants = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(v => {
        if (v.options && v.options.length > 0) {
          selectedVariants[v.name] = v.options[0];
        }
      });
    } else {
      // Compatibility with legacy sizes/colors if present
      if (product.sizes && product.sizes.length > 0) selectedVariants["Size"] = product.sizes[0];
      if (product.colors && product.colors.length > 0) selectedVariants["Color"] = product.colors[0];
    }
    
    addToCart(product, 1, selectedVariants);
    toast.success(`${name} ${language === "ar" ? "أُضيف إلى السلة" : "added to cart"}`);
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
    if (!favorited) {
      toast.success(`${name} ${language === "ar" ? "أُضيف إلى المفضلة" : "added to wishlist"}`);
    }
  };

  return (
    <motion.div
      className="group relative flex flex-col w-full rounded-2xl overflow-hidden bg-white dark:bg-brand-dark-card border border-primary/5 dark:border-secondary/5 luxury-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Product Image Area */}
      <Link to={`/product/${product.id}`} className="relative block aspect-[3/4] overflow-hidden bg-brand-bg/50 dark:bg-brand-dark-bg/50">
        {/* Heart Icon Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-4 right-4 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md text-brand-text dark:text-brand-dark-text shadow-sm hover:scale-110 transition-all duration-300 border border-primary/5 cursor-pointer"
          aria-label="Add to favorites"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-300 ${
              favorited ? "fill-primary text-primary dark:fill-secondary dark:text-secondary" : "text-brand-text/50 dark:text-brand-dark-text/50"
            }`}
          />
        </button>

        {/* Discount Badge */}
        {discInfo.hasDiscount && (
          <div className="absolute top-4 left-4 z-20 px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase text-white bg-primary dark:bg-secondary dark:text-brand-dark-card rounded-md shadow-md">
            {discInfo.discountText} {language === "ar" ? "خصم" : "OFF"}
          </div>
        )}

        {/* Eye/QuickView Button */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className={`absolute z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md text-brand-text dark:text-brand-dark-text shadow-sm hover:scale-110 transition-all duration-300 border border-primary/5 cursor-pointer ${
              discInfo.hasDiscount ? "top-14" : "top-4"
            } left-4`}
            aria-label="Quick preview product"
          >
            <Eye className="w-4 h-4 text-brand-text/50 dark:text-brand-dark-text/50" />
          </button>
        )}

        {/* Product Images (swap on hover) */}
        <img
          src={mainImage}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
          loading="lazy"
        />
        <img
          src={hoverImage}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-0 scale-100 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
          loading="lazy"
        />

        {/* Quick Add To Cart Button Overlay */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-10">
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/95 text-white shadow-lg hover:shadow-primary/20 active:scale-95 text-xs font-semibold uppercase tracking-wider font-english transition-all duration-300 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {t("addToCart")}
          </button>
        </div>
      </Link>

      {/* Product Information */}
      <div className="flex-1 flex flex-col p-5">
        {/* Category & Rating */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-primary dark:text-secondary opacity-80">
            {t(product.category.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || product.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold font-english text-brand-text/70 dark:text-brand-dark-text/70">
              {product.rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/product/${product.id}`} className="block mb-2 group-hover:text-primary dark:group-hover:text-secondary transition-colors duration-300">
          <h3 className="font-semibold text-sm line-clamp-2 text-brand-text dark:text-brand-dark-text leading-snug">
            {name}
          </h3>
        </Link>

        {/* Description Snippet */}
        <p className="text-xs text-brand-text/50 dark:text-brand-dark-text/50 line-clamp-2 mb-4 font-light leading-relaxed">
          {product.description[language] || product.description.en}
        </p>

        {/* Price Area */}
        <div className="mt-auto pt-3 border-t border-primary/5 dark:border-secondary/5 flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {discInfo.hasDiscount ? (
              <>
                <span className="text-sm font-bold text-primary dark:text-secondary font-english">
                  {formatPrice(totalCurrentPriceEGP, language)}
                </span>
                <span className="text-[10px] line-through text-brand-text/30 dark:text-brand-dark-text/30 font-english">
                  {formatPrice(totalOriginalPriceEGP, language)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-primary dark:text-secondary font-english">
                {formatPrice(totalCurrentPriceEGP, language)}
              </span>
            )}
          </div>
          <span className="text-[9px] text-brand-text/40 dark:text-brand-dark-text/40 font-sans">
            ({t("priceEgp")}: {formatEGP(currentPriceEGP)} + {t("shipping")}: {formatPrice(shipCostEGP, language)})
          </span>
          {discInfo.hasDiscount && (
            <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold font-sans mt-0.5">
              {language === "ar" ? "وفرت " : "Save "}{formatPrice(discInfo.savedEGP, language)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
