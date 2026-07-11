import React from "react";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { X, Heart, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export const FavoritesDrawer = ({ isOpen, onClose }) => {
  const { favorites, toggleFavorite, clearFavorites } = useFavorites();
  const { addToCart, exchangeRate } = useCart();
  const { language, t, isRtl } = useLanguage();

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : "";
    const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0] : "";
    addToCart(product, 1, defaultSize, defaultColor);
    toast.success(`${product.name[language] || product.name.en} ${language === "ar" ? "أُضيف إلى السلة" : "added to cart"}`);
  };

  const handleRemove = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  const formatCurrency = (val, cur) => {
    return language === "ar"
      ? `${val.toLocaleString()} ${cur === "YER" ? "ر.ي" : "ج.م"}`
      : `${cur === "YER" ? "YER" : "EGP"} ${val.toLocaleString()}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Wishlist Panel */}
          <motion.div
            className={`fixed top-0 bottom-0 w-full max-w-md bg-brand-bg dark:bg-brand-dark-bg border-primary/10 dark:border-secondary/10 shadow-2xl z-50 flex flex-col transition-colors duration-500 ${
              isRtl ? "left-0 border-r" : "right-0 border-l"
            }`}
            initial={{ x: isRtl ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? "-100%" : "100%" }}
            transition={{ type: "tween", duration: 0.4 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-primary/5 dark:border-secondary/5">
              <div className="flex items-center gap-2 text-primary dark:text-secondary">
                <Heart className="w-5 h-5 fill-primary dark:fill-secondary" />
                <h2 className="text-lg font-bold font-english uppercase tracking-wider">
                  {t("favTitle")} ({favorites.length})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-primary/5 dark:hover:bg-secondary/5 text-brand-text/60 dark:text-brand-dark-text/60"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Favorites List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/5 dark:bg-secondary/5 flex items-center justify-center text-primary/40 dark:text-secondary/40 mb-4">
                    <Heart className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-brand-text/50 dark:text-brand-dark-text/50 max-w-xs font-light leading-relaxed">
                    {t("favEmpty")}
                  </p>
                </div>
              ) : (
                favorites.map((product, index) => {
                  const name = product.name[language] || product.name.en;
                  const itemPrice = Math.round(product.priceEGP * exchangeRate);
                  return (
                    <motion.div
                      key={product.id}
                      className="flex gap-4 p-4 rounded-xl bg-white dark:bg-brand-dark-card border border-primary/5 dark:border-secondary/5 shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <img
                        src={product.images[0]}
                        alt={name}
                        className="w-20 h-24 object-cover rounded-lg bg-brand-bg/50 dark:bg-brand-dark-bg/50"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-xs text-brand-text dark:text-brand-dark-text line-clamp-1">
                            {name}
                          </h4>
                          <span className="text-[10px] tracking-wider uppercase font-semibold text-primary dark:text-secondary opacity-70">
                            {t(product.category.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || product.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold text-primary dark:text-secondary font-english">
                            {formatCurrency(itemPrice, "YER")}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              className="p-2 rounded-full bg-primary/5 dark:bg-secondary/5 hover:bg-primary dark:hover:bg-secondary text-primary dark:text-secondary hover:text-white dark:hover:text-black transition-all duration-300"
                              title={t("addToCart")}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleRemove(e, product)}
                              className="p-2 rounded-full hover:bg-red-55/10 text-red-500 transition-all duration-300"
                              title={t("delete")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Clear Button */}
            {favorites.length > 0 && (
              <div className="p-6 border-t border-primary/5 dark:border-secondary/5 bg-white dark:bg-brand-dark-card/90">
                <button
                  onClick={clearFavorites}
                  className="w-full py-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 text-red-500 font-semibold text-xs tracking-wider uppercase font-english transition-all duration-300"
                >
                  {language === "ar" ? "مسح القائمة بالكامل" : "Clear All Favorites"}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
