import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { X, Plus, Minus, Trash2, ShoppingCart, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { orderService } from "../services/orderService";
import { CONTACT_INFO } from "../constants/contact";
import toast from "react-hot-toast";

export const CartDrawer = ({ isOpen, onClose }) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartSubtotalEGP,
    cartShippingEGP,
    cartDiscountEGP,
    cartTotalEGP,
    formatPrice,
    selectedCurrency,
    exchangeRate,
    couponCode,
    applyCoupon,
    removeCoupon,
    getItemUnitPriceEGP
  } = useCart();
  
  const { language, t, isRtl } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    governorate: "sanaa",
    address: ""
  });

  const [couponInput, setCouponInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = applyCoupon(couponInput.trim());
    if (success) setCouponInput("");
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error(t("validationError"));
      return;
    }

    setLoading(true);
    try {
      const orderItems = cart.map((item) => {
        const itemPriceEGP = getItemUnitPriceEGP(item.product);
        return {
          productId: item.product.id,
          name: item.product.name[language] || item.product.name.en,
          quantity: item.quantity,
          selectedVariants: item.selectedVariants || {},
          priceEGP: itemPriceEGP,
          weight: item.product.weight || 0.5
        };
      });

      const newOrder = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          governorate: t(formData.governorate),
          address: formData.address
        },
        items: orderItems,
        subtotalEGP: cartSubtotalEGP,
        shippingEGP: cartShippingEGP,
        totalEGP: cartTotalEGP,
        selectedCurrency: selectedCurrency,
        formattedSubtotal: formatPrice(cartSubtotalEGP, "en"),
        formattedShipping: formatPrice(cartShippingEGP, "en"),
        formattedTotal: formatPrice(cartTotalEGP, "en"),
        exchangeRate: exchangeRate,
        couponCode: couponCode || null,
        discountAmount: cartDiscountEGP
      };

      await orderService.create(newOrder);

      // Format WhatsApp order slip
      let text = `*LELA SHOPPING ORDER*\n`;
      text += `--------------------------\n`;
      text += `*Customer:* ${formData.name}\n`;
      text += `*Phone:* ${formData.phone}\n`;
      text += `*Governorate:* ${t(formData.governorate)}\n`;
      text += `*Address:* ${formData.address}\n\n`;
      text += `*Items Ordered:*\n`;
      
      cart.forEach((item, idx) => {
        const itemName = item.product.name.en;
        let variantsInfo = "";
        if (item.selectedVariants) {
          Object.entries(item.selectedVariants).forEach(([k, v]) => {
            variantsInfo += ` (${k}: ${v})`;
          });
        }
        const unitPrice = getItemUnitPriceEGP(item.product);
        const itemFormattedPrice = formatPrice(unitPrice * item.quantity, "en");
        text += `${idx + 1}. ${itemName}${variantsInfo} x ${item.quantity} - ${itemFormattedPrice}\n`;
      });
      
      text += `\n--------------------------\n`;
      text += `*Subtotal:* ${formatPrice(cartSubtotalEGP, "en")}\n`;
      text += `*Shipping (EG to YE):* ${formatPrice(cartShippingEGP, "en")}\n`;
      if (couponCode) {
        text += `*Coupon Discount:* -${formatPrice(cartDiscountEGP, "en")} (${couponCode})\n`;
      }
      text += `*Total Amount:* ${formatPrice(cartTotalEGP, "en")}\n`;
      text += `--------------------------\n`;
      text += `Please confirm my order. Thank you!`;

      const encodedMsg = encodeURIComponent(text);
      const whatsappUrl = `https://wa.me/${CONTACT_INFO.phoneYemen.replace("+", "")}?text=${encodedMsg}`;
      
      toast.success(t("checkoutSuccess"));
      
      setTimeout(() => {
        clearCart();
        window.open(whatsappUrl, "_blank");
        setLoading(false);
        onClose();
      }, 1500);

    } catch (e) {
      console.error(e);
      toast.error("Checkout failed, please try again.");
      setLoading(false);
    }
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

          {/* Cart Panel */}
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
                <ShoppingCart className="w-5 h-5" />
                <h2 className="text-lg font-bold font-english uppercase tracking-wider">
                  {t("cartTitle")} ({cartCount})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-primary/5 dark:hover:bg-secondary/5 text-brand-text/60 dark:text-brand-dark-text/60 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/5 dark:bg-secondary/5 flex items-center justify-center text-primary/40 dark:text-secondary/40 mb-4">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-brand-text/50 dark:text-brand-dark-text/50 max-w-xs font-light leading-relaxed">
                    {t("cartEmpty")}
                  </p>
                </div>
              ) : (
                cart.map((item, index) => {
                  const name = item.product.name[language] || item.product.name.en;
                  const unitPrice = getItemUnitPriceEGP(item.product);
                  const originalPrice = item.product.priceEGP;
                  const hasDiscount = originalPrice > unitPrice;
                  
                  return (
                    <motion.div
                      key={`${item.product.id}-${JSON.stringify(item.selectedVariants)}`}
                      className="flex gap-4 p-4 rounded-xl bg-white dark:bg-brand-dark-card border border-primary/5 dark:border-secondary/5 shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <img
                        src={item.product.images[0] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3"}
                        alt={name}
                        className="w-20 h-24 object-cover rounded-lg bg-brand-bg/50 dark:bg-brand-dark-bg/50"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-xs text-brand-text dark:text-brand-dark-text line-clamp-1">
                            {name}
                          </h4>
                          <div className="flex flex-wrap gap-2 text-[10px] text-brand-text/50 dark:text-brand-dark-text/50 mt-1 font-light">
                            {item.selectedVariants && Object.entries(item.selectedVariants).map(([k, v]) => (
                              <span key={k} className="border border-primary/5 px-1.5 py-0.5 rounded bg-primary/5">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-primary/10 dark:border-secondary/10 rounded-full px-1.5 py-0.5 bg-brand-bg/50 dark:bg-brand-dark-bg/50 scale-95 origin-left">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.selectedVariants, item.quantity - 1)
                              }
                              className="p-1 text-brand-text/60 dark:text-brand-dark-text/60 hover:text-primary dark:hover:text-secondary transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold font-english text-brand-text dark:text-brand-dark-text">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.selectedVariants, item.quantity + 1)
                              }
                              className="p-1 text-brand-text/60 dark:text-brand-dark-text/60 hover:text-primary dark:hover:text-secondary transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-primary dark:text-secondary font-english">
                                {formatPrice(unitPrice * item.quantity, language)}
                              </span>
                              {hasDiscount && (
                                <span className="text-[9px] line-through text-brand-text/30 dark:text-brand-dark-text/30 font-english">
                                  {formatPrice(originalPrice * item.quantity, language)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.id, item.selectedVariants)}
                              className="p-1 text-red-500/80 hover:text-red-600 transition-colors cursor-pointer"
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

            {/* Footer Summary & Checkout */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-primary/5 dark:border-secondary/5 bg-white dark:bg-brand-dark-card/90 space-y-4">
                <div className="space-y-2 text-xs font-light">
                  <div className="flex justify-between text-brand-text/70 dark:text-brand-dark-text/70">
                    <span>{t("subtotal")}</span>
                    <span className="font-english">{formatPrice(cartSubtotalEGP, language)}</span>
                  </div>
                  <div className="flex justify-between text-brand-text/70 dark:text-brand-dark-text/70">
                    <span>{t("shipping")}</span>
                    <span className="font-english">{formatPrice(cartShippingEGP, language)}</span>
                  </div>
                  {cartDiscountEGP > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>{t("discount") || "Discount"}</span>
                      <span className="font-english">-{formatPrice(cartDiscountEGP, language)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-primary dark:text-secondary border-t border-primary/5 dark:border-secondary/5 pt-2">
                    <span>{t("total")}</span>
                    <span className="font-english">{formatPrice(cartTotalEGP, language)}</span>
                  </div>
                </div>

                {/* Coupons Section */}
                <div className="pt-2 border-t border-primary/5 dark:border-secondary/5">
                  {couponCode ? (
                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/10 text-[10px]">
                      <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                        {language === "ar" ? "الكوبون المطبق: " : "Applied Coupon: "}{couponCode}
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-red-500 hover:text-red-600 font-semibold cursor-pointer"
                      >
                        {language === "ar" ? "إزالة" : "Remove"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={language === "ar" ? "رمز الكوبون" : "Coupon code"}
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-primary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text focus:outline-none dark:text-white dark:border-secondary/10"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-colors cursor-pointer"
                      >
                        {language === "ar" ? "تطبيق" : "Apply"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Checkout Form */}
                <form onSubmit={handleCheckout} className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80 dark:text-brand-dark-text/80">
                    {t("checkoutTitle")}
                  </h3>
                  <div>
                    <input
                      type="text"
                      name="name"
                      placeholder={t("checkoutName")}
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      name="phone"
                      placeholder={t("checkoutPhone")}
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-2/3 text-xs px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-colors font-english"
                    />
                    <select
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleInputChange}
                      className="w-1/3 text-xs px-2 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-colors font-medium dark:text-white"
                    >
                      <option value="sanaa" className="dark:bg-brand-dark-card">{t("sanaa")}</option>
                      <option value="aden" className="dark:bg-brand-dark-card">{t("aden")}</option>
                      <option value="taiz" className="dark:bg-brand-dark-card">{t("taiz")}</option>
                      <option value="ibb" className="dark:bg-brand-dark-card">{t("ibb")}</option>
                      <option value="hadhramaut" className="dark:bg-brand-dark-card">{t("hadhramaut")}</option>
                      <option value="hodeidah" className="dark:bg-brand-dark-card">{t("hodeidah")}</option>
                      <option value="dhamar" className="dark:bg-brand-dark-card">{t("dhamar")}</option>
                      <option value="marib" className="dark:bg-brand-dark-card">{t("marib")}</option>
                    </select>
                  </div>
                  <div>
                    <textarea
                      name="address"
                      placeholder={t("checkoutAddress")}
                      rows="2"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-xs tracking-wider uppercase font-english flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {t("placeOrderWhatsapp")}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
