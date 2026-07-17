import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productService } from "../services/productService";
import { settingsService } from "../services/settingsService";
import { ProductCard } from "../components/ProductCard";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { CONTACT_INFO } from "../constants/contact";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Star,
  Scale,
  Truck,
  MessageCircle,
  ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../services/supabaseClient";

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t, isRtl } = useLanguage();
  const { addToCart, getShippingCostForItem, formatPrice, getProductDiscountInfo, getItemUnitPriceEGP } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  
  const [shippingRates, setShippingRates] = useState({
    personalCare: 450,
    clothingHome: 300
  });

  // User selections
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Quick WhatsApp Buy States
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [waCustomerName, setWaCustomerName] = useState("");
  const [waCustomerPhone, setWaCustomerPhone] = useState("");
  const [waCustomerGov, setWaCustomerGov] = useState("Sanaa");
  const [waCustomerNotes, setWaCustomerNotes] = useState("");
  const [waSubmitting, setWaSubmitting] = useState(false);

  const governorates = [
    { value: "Sanaa", nameEn: "Sana'a", nameAr: "صنعاء" },
    { value: "Aden", nameEn: "Aden", nameAr: "عدن" },
    { value: "Taiz", nameEn: "Taiz", nameAr: "تعز" },
    { value: "Ibb", nameEn: "Ibb", nameAr: "إب" },
    { value: "Hadhramaut", nameEn: "Hadhramaut", nameAr: "حضرموت" },
    { value: "Al Hudaydah", nameEn: "Al Hudaydah", nameAr: "الحديدة" },
    { value: "Dhamar", nameEn: "Dhamar", nameAr: "ذمار" },
    { value: "Marib", nameEn: "Marib", nameAr: "مأرب" }
  ];

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const item = await productService.getById(id);
        if (item) {
          setProduct(item);
          
          // Set initial variants selection
          const initial = {};
          if (item.variants && item.variants.length > 0) {
            item.variants.forEach(v => {
              if (v.options && v.options.length > 0) {
                initial[v.name] = v.options[0];
              }
            });
          } else {
            if (item.sizes && item.sizes.length > 0) initial["Size"] = item.sizes[0];
            if (item.colors && item.colors.length > 0) initial["Color"] = item.colors[0];
          }
          setSelectedVariants(initial);
          setActiveImageIdx(0);
          setQuantity(1);

          // Recently viewed tracking
          const recentRaw = localStorage.getItem("lela_recently_viewed");
          let recentIds = recentRaw ? JSON.parse(recentRaw) : [];
          recentIds = [item.id, ...recentIds.filter(idVal => idVal !== item.id)].slice(0, 10);
          localStorage.setItem("lela_recently_viewed", JSON.stringify(recentIds));

          // Load related products
          const allProducts = await productService.getAll();
          const related = allProducts
            .filter(p => p.category === item.category && p.id !== item.id && p.status === "visible")
            .slice(0, 4);
          setRelatedProducts(related);
        } else {
          toast.error("Product not found");
          navigate("/shop");
        }

        const settings = await settingsService.get();
        if (settings.shippingRates) {
          setShippingRates(settings.shippingRates);
        }
      } catch (e) {
        console.error("Error loading product detail", e);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) return null;

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

  const formatEGP = (val) => {
    return language === "ar"
      ? `${val.toLocaleString()} ج.م`
      : `EGP ${val.toLocaleString()}`;
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariants);
    toast.success(`${name} ${language === "ar" ? "أُضيف إلى السلة" : "added to cart"}`);
  };

  const handleBuyNowWhatsapp = () => {
    setShowWhatsappModal(true);
  };

  const handleConfirmWhatsappOrder = async (e) => {
    e.preventDefault();
    if (!waCustomerName.trim() || !waCustomerPhone.trim()) {
      toast.error(language === "ar" ? "يرجى ملء الحقول المطلوبة" : "Please fill out all required fields");
      return;
    }
    
    setWaSubmitting(true);
    try {
      const orderNum = `WA-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const exchangeRate = 11.5;
      const totalEgp = totalPriceEGP * quantity;
      const totalYer = totalEgp * exchangeRate;

      let variantsStr = "";
      Object.entries(selectedVariants).forEach(([key, val]) => {
        variantsStr += `\n- ${key}: ${val}`;
      });

      const itemsArray = [{
        product: {
          id: product.id,
          name: product.name,
          priceEGP: currentPriceEGP
        },
        quantity: quantity,
        price: currentPriceEGP,
        selectedVariants: selectedVariants
      }];

      // Save order to database
      const { error: dbError } = await supabase.from("orders").insert([{
        id: orderNum,
        customer: {
          name: waCustomerName.trim(),
          phone: waCustomerPhone.trim(),
          governorate: waCustomerGov,
          address: waCustomerNotes.trim() || "Sanaa"
        },
        items: itemsArray,
        total_egp: totalEgp,
        total_yer: totalYer,
        selected_currency: "YER",
        exchange_rate: exchangeRate,
        status: "Pending WhatsApp Confirmation",
        discount_amount: 0,
        created_at: new Date().toISOString()
      }]);

      if (dbError) throw dbError;

      // Format WhatsApp Message
      const formattedTotal = formatPrice(totalEgp, "en");
      const formattedShip = formatPrice(shipCostEGP, "en");
      
      let text = `*LELA STORE QUICK BUY REQUEST*\n`;
      text += `--------------------------\n`;
      text += `*Order Number:* ${orderNum}\n`;
      text += `*Customer:* ${waCustomerName.trim()}\n`;
      text += `*Phone:* ${waCustomerPhone.trim()}\n`;
      text += `*Governorate:* ${waCustomerGov}\n\n`;
      text += `*Product:* ${product.name.en || product.name.ar}\n`;
      text += `*Qty:* ${quantity}${variantsStr}\n`;
      text += `*Weight:* ${weight} KG\n\n`;
      text += `*Shipping Cost:* ${formattedShip}\n`;
      text += `*Total Amount:* ${formattedTotal}\n`;
      if (waCustomerNotes.trim()) {
        text += `*Notes:* ${waCustomerNotes.trim()}\n`;
      }
      text += `--------------------------\n`;
      text += `Your Order Number is *${orderNum}*.\n`;
      text += `You can track your order later from the website using this number.`;

      const encodedMsg = encodeURIComponent(text);
      const whatsappUrl = `https://wa.me/${CONTACT_INFO.phoneYemen.replace("+", "")}?text=${encodedMsg}`;
      
      toast.success(language === "ar" ? "تم تسجيل الطلب! جاري التحويل للواتساب..." : "Order registered! Redirecting to WhatsApp...");
      
      // Close modal and reset fields
      setShowWhatsappModal(false);
      setWaCustomerName("");
      setWaCustomerPhone("");
      setWaCustomerNotes("");
      
      // Open WhatsApp
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
      }, 1000);
      
    } catch (err) {
      console.error("Error creating WhatsApp order:", err);
      toast.error(language === "ar" ? "فشل تسجيل الطلب" : "Failed to record order in database");
    } finally {
      setWaSubmitting(false);
    }
  };

  const handleVariantChange = (name, value) => {
    setSelectedVariants(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex-1">
      {/* Back to Shop link */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-secondary uppercase tracking-widest font-english mb-8 hover:underline"
      >
        <ChevronLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
        {language === "ar" ? "العودة للمتجر" : "Back to Shop"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-white dark:bg-brand-dark-card border border-primary/5 shadow-sm relative">
            <img
              src={product.images[activeImageIdx] || "https://images.unsplash.com/photo-1584917865442-de89df76afd3"}
              alt={name}
              className="w-full h-full object-cover object-center transition-all duration-500"
            />
            {/* Heart button overlay */}
            <button
              onClick={() => toggleFavorite(product)}
              className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md text-brand-text dark:text-brand-dark-text shadow-sm hover:scale-105 transition-all border border-primary/5 cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${favorited ? "fill-primary text-primary" : "text-brand-text/50"}`} />
            </button>
            {/* Discount Badge */}
            {discInfo.hasDiscount && (
              <div className="absolute top-4 left-4 z-20 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-white bg-primary dark:bg-secondary dark:text-brand-dark-card rounded-md shadow-md">
                {discInfo.discountText} {language === "ar" ? "خصم" : "OFF"}
              </div>
            )}
          </div>

          {/* Thumbnail list */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 aspect-square rounded-xl overflow-hidden border-2 bg-white dark:bg-brand-dark-card transition-all cursor-pointer ${
                    activeImageIdx === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Ordering */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header info */}
          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-primary dark:text-secondary">
              {t(product.category.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || product.category}
            </span>
            <h1 className="text-2xl md:text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide leading-tight">
              {name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(product.rating) ? "fill-amber-400" : "text-brand-text/20"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-brand-text/50 dark:text-brand-dark-text/50 font-english font-medium">
                {product.rating.toFixed(1)} ({product.reviewsCount} reviews)
              </span>
            </div>
          </div>

          <hr className="border-primary/5 dark:border-secondary/5" />

          {/* Pricing Panel */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-primary dark:text-secondary font-english">
                {formatPrice(currentPriceEGP, language)}
              </span>
              {discInfo.hasDiscount && (
                <span className="text-sm line-through text-brand-text/30 dark:text-brand-dark-text/30 font-english">
                  {formatPrice(originalPriceEGP, language)}
                </span>
              )}
            </div>
            <div className="text-xs text-brand-text/40 dark:text-brand-dark-text/40 font-english">
              {t("priceEgp")}: {formatEGP(currentPriceEGP)}
            </div>
            {discInfo.hasDiscount && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                {language === "ar" ? "وفرت " : "Save "}{formatPrice(discInfo.savedEGP, language)}
              </div>
            )}
          </div>

          {/* Custom Variants selectors dynamically */}
          <div className="space-y-4">
            {product.variants && product.variants.length > 0 ? (
              product.variants.map((v) => (
                <div key={v.name} className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-text/60 dark:text-brand-dark-text/60">
                    {v.name}
                  </label>
                  <div className="flex gap-2.5 flex-wrap">
                    {v.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleVariantChange(v.name, opt)}
                        className={`px-4 py-2 border rounded-xl text-xs font-semibold font-english transition-all cursor-pointer ${
                          selectedVariants[v.name] === opt
                            ? "bg-primary border-primary text-white"
                            : "border-primary/10 text-brand-text/75 hover:border-primary/30 dark:text-white"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Legacy sizes picker */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-brand-text/60 dark:text-brand-dark-text/60">
                      {t("size")}
                    </label>
                    <div className="flex gap-2.5">
                      {product.sizes.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => handleVariantChange("Size", sz)}
                          className={`min-w-10 h-10 px-3 border rounded-xl text-xs font-semibold font-english transition-all cursor-pointer ${
                            selectedVariants["Size"] === sz
                              ? "bg-primary border-primary text-white"
                              : "border-primary/10 text-brand-text/75 hover:border-primary/30 dark:text-white"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy colors picker */}
                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-brand-text/60 dark:text-brand-dark-text/60">
                      {t("color")}
                    </label>
                    <div className="flex gap-2.5">
                      {product.colors.map((col) => (
                        <button
                          key={col}
                          onClick={() => handleVariantChange("Color", col)}
                          className={`h-10 px-4 border rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            selectedVariants["Color"] === col
                              ? "bg-primary border-primary text-white"
                              : "border-primary/10 text-brand-text/75 hover:border-primary/30 dark:text-white"
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Live Shipping cost calculator panel */}
          <div className="rounded-2xl p-5 border border-primary/10 dark:border-secondary/10 bg-primary/5 dark:bg-brand-dark-card/40 space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-secondary">
              <Scale className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {language === "ar" ? "تقدير الشحن لليمن" : "Est. Shipping to Yemen"}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-light">
              <div className="space-y-1">
                <span className="text-brand-text/50 dark:text-brand-dark-text/50">{t("weight")}</span>
                <p className="font-bold font-english text-brand-text dark:text-brand-dark-text">{weight} KG</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-brand-text/50 dark:text-brand-dark-text/50">{t("shippingCost")}</span>
                <p className="font-bold font-english text-primary dark:text-secondary">{formatPrice(shipCostEGP, language)}</p>
              </div>
            </div>

            <div className="border-t border-primary/5 dark:border-secondary/5 pt-3 flex justify-between items-center text-xs">
              <span className="font-semibold text-brand-text/80 dark:text-brand-dark-text/80">
                {language === "ar" ? "المجموع شامل الشحن" : "Total incl. Shipping"}
              </span>
              <span className="font-extrabold text-primary dark:text-secondary font-english">
                {formatPrice(totalPriceEGP * quantity, language)}
              </span>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-text/60 dark:text-brand-dark-text/60">
              {language === "ar" ? "الكمية" : "Quantity"}
            </label>
            <div className="flex items-center border border-primary/10 dark:border-secondary/10 rounded-xl px-2 py-1 bg-brand-bg/50 dark:bg-brand-dark-bg/50 w-28 justify-between">
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="p-1.5 text-brand-text/60 hover:text-primary transition-colors cursor-pointer"
              >
                <MinusIcon className="w-3.5 h-3.5 text-brand-text dark:text-white" />
              </button>
              <span className="font-bold font-english text-xs text-brand-text dark:text-brand-dark-text">{quantity}</span>
              <button
                onClick={() => setQuantity(prev => prev + 1)}
                className="p-1.5 text-brand-text/60 hover:text-primary transition-colors cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5 text-brand-text dark:text-white" />
              </button>
            </div>
          </div>

          {/* Checkout Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3.5 rounded-xl border border-primary/20 hover:border-primary/45 text-brand-text dark:text-brand-dark-text font-bold text-xs tracking-wider uppercase font-english flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-primary dark:text-secondary" />
              {t("addToCart")}
            </button>
            <button
              onClick={handleBuyNowWhatsapp}
              className="flex-1 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#25D366]/95 text-white font-bold text-xs tracking-wider uppercase font-english flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/10 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
              {language === "ar" ? "شراء عبر واتساب" : "Buy via WhatsApp"}
            </button>
          </div>

          {/* Luxury benefits details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-primary/5 dark:border-secondary/5 text-[10px] text-brand-text/50 dark:text-brand-dark-text/50 font-light">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary dark:text-secondary flex-shrink-0" />
              <span>{language === "ar" ? "شحن آمن لكافة محافظات اليمن" : "Secure delivery to all governorates"}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary dark:text-secondary flex-shrink-0" />
              <span>{language === "ar" ? "ضمان أصالة المنتج 100٪ من مصر" : "100% Authentic products from Egypt"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Specifications tab */}
      <section className="mt-16 pt-10 border-t border-primary/5 dark:border-secondary/5 space-y-6">
        <div className="flex gap-8 border-b border-primary/5 pb-2">
          <h3 className="font-semibold text-sm text-primary dark:text-secondary border-b-2 border-primary pb-2 -mb-2.5">
            {t("description")}
          </h3>
        </div>
        <div className="max-w-3xl space-y-4">
          <p className="text-xs text-brand-text/70 dark:text-brand-dark-text/70 leading-relaxed font-light">
            {desc}
          </p>
        </div>
      </section>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-10 border-t border-primary/5 dark:border-secondary/5 space-y-8">
          <div className="text-center md:text-start space-y-2">
            <h3 className="text-lg md:text-xl font-light text-brand-text dark:text-brand-dark-text tracking-wide">
              {language === "ar" ? "منتجات ذات صلة" : "Related Products"}
            </h3>
            <div className="w-8 h-[1px] bg-primary/40 dark:bg-secondary/40 md:mx-0 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Quick WhatsApp Checkout Modal */}
      {showWhatsappModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-dark-card border border-primary/10 dark:border-secondary/10 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-brand-text dark:text-brand-dark-text font-english uppercase tracking-wider">
                {language === "ar" ? "إكمال الطلب عبر واتساب" : "WhatsApp Quick Buy"}
              </h3>
              <p className="text-[10px] text-brand-text/45 dark:text-brand-dark-text/45 font-light">
                {language === "ar" 
                  ? "يرجى إدخال بياناتكِ لحفظ الطلب في قاعدة البيانات وتتبع حالة الشحنة لاحقاً" 
                  : "Enter your contact details to generate your tracking code before redirecting to WhatsApp"}
              </p>
            </div>
            
            <form onSubmit={handleConfirmWhatsappOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/50 dark:text-brand-dark-text/50">
                  {language === "ar" ? "الاسم الكامل" : "Full Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={waCustomerName}
                  onChange={(e) => setWaCustomerName(e.target.value)}
                  placeholder={language === "ar" ? "علياء أحمد" : "e.g. Huda Al-Yemeni"}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg/10 dark:bg-brand-dark-bg text-xs text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/50 dark:text-brand-dark-text/50">
                  {language === "ar" ? "رقم الهاتف (واتساب)" : "WhatsApp Phone Number"} *
                </label>
                <input
                  type="tel"
                  required
                  value={waCustomerPhone}
                  onChange={(e) => setWaCustomerPhone(e.target.value)}
                  placeholder="96777XXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg/10 dark:bg-brand-dark-bg text-xs text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-english font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/50 dark:text-brand-dark-text/50">
                  {language === "ar" ? "المحافظة" : "Governorate"} *
                </label>
                <select
                  value={waCustomerGov}
                  onChange={(e) => setWaCustomerGov(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg/10 dark:bg-brand-dark-bg text-xs text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-all font-semibold"
                >
                  {governorates.map(g => (
                    <option key={g.value} value={g.value}>
                      {language === "ar" ? g.nameAr : g.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-brand-text/50 dark:text-brand-dark-text/50">
                  {language === "ar" ? "ملاحظات إضافية (اختياري)" : "Shipping Address / Notes (Optional)"}
                </label>
                <textarea
                  value={waCustomerNotes}
                  onChange={(e) => setWaCustomerNotes(e.target.value)}
                  placeholder={language === "ar" ? "مثال: تسليم عند مكتب شحن معين..." : "e.g. Delivery instructions..."}
                  rows="2"
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg/10 dark:bg-brand-dark-bg text-xs text-brand-text dark:text-brand-dark-text focus:outline-none focus:border-primary transition-all font-light"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsappModal(false)}
                  className="flex-1 py-3 border border-primary/10 dark:border-secondary/10 hover:bg-primary/5 rounded-xl text-xs font-semibold text-brand-text/70 dark:text-brand-dark-text/70 uppercase tracking-wider font-english transition-all cursor-pointer"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={waSubmitting}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider font-english transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {waSubmitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      {language === "ar" ? "تأكيد وإرسال" : "Confirm & Send"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal mini icons
const PlusIcon = (props) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MinusIcon = (props) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);
