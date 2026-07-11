import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { X, Send, MessageCircle } from "lucide-react";
import { CONTACT_INFO } from "../constants/contact";
import { settingsService } from "../services/settingsService";
import toast from "react-hot-toast";

export const SpecialOrderModal = ({ isOpen, onClose }) => {
  const { language, t, isRtl } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
    weight: "1.0",
    imageUrl: ""
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.description) {
      toast.error(t("validationError"));
      return;
    }

    setLoading(true);
    try {
      // 1. Log request inside admin database
      const specialOrders = await settingsService.getSpecialOrders();
      const newRequest = {
        id: "so_" + Date.now(),
        customer: {
          name: formData.name,
          phone: formData.phone
        },
        description: formData.description,
        weight: parseFloat(formData.weight || 1.0),
        imageUrl: formData.imageUrl || "",
        status: "pending",
        date: new Date().toISOString().split("T")[0]
      };

      specialOrders.push(newRequest);
      await settingsService.saveSpecialOrders(specialOrders);
      await settingsService.addActivityLog(`Special Sourcing Request from ${formData.name} logged`);

      // 2. Format WhatsApp Message
      let text = `*LELA SPECIAL CONCIERGE REQUEST*\n`;
      text += `--------------------------------\n`;
      text += `*Customer:* ${formData.name}\n`;
      text += `*Phone:* ${formData.phone}\n\n`;
      text += `*Requested Product Details:*\n`;
      text += `${formData.description}\n\n`;
      text += `*Est. Weight:* ${formData.weight} KG\n`;
      if (formData.imageUrl) {
        text += `*Reference Image:* ${formData.imageUrl}\n`;
      }
      text += `--------------------------------\n`;
      text += `Please let me know the estimated cost. Thank you!`;

      const encodedMsg = encodeURIComponent(text);
      const whatsappUrl = `https://wa.me/${CONTACT_INFO.phoneYemen.replace("+", "")}?text=${encodedMsg}`;

      toast.success(language === "ar" ? "تم تسجيل طلبك الخاص! جاري التحويل للواتساب..." : "Request recorded! Redirecting to WhatsApp...");
      
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
        setLoading(false);
        setFormData({
          name: "",
          phone: "",
          description: "",
          weight: "1.0",
          imageUrl: ""
        });
        onClose();
      }, 1500);

    } catch (e) {
      console.error(e);
      toast.error("Failed to submit request.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-brand-bg dark:bg-brand-dark-card border border-primary/10 dark:border-secondary/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-primary/5 dark:border-secondary/5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-secondary font-english">
            {language === "ar" ? "طلب شراء منتج خاص" : "Special Sourcing Request"}
          </h3>
          <button
            onClick={onClose}
            className="text-brand-text/50 hover:text-brand-text p-1 rounded-full hover:bg-primary/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("checkoutName")}</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-brand-text"
              placeholder="e.g. Fatima Ahmed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-brand-text/60">{t("checkoutPhone")}</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-brand-text font-english"
                placeholder="9677xxxxxxxx"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-brand-text/60">{language === "ar" ? "الوزن المتوقع (كجم)" : "Est. Weight (KG)"}</label>
              <input
                type="number"
                name="weight"
                step="0.1"
                required
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-brand-text font-english"
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-brand-text/60">
              {language === "ar" ? "تفاصيل المنتج أو روابط المواقع" : "Product details (URLs, colors, sizes, specifications)"}
            </label>
            <textarea
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-brand-text resize-none leading-relaxed"
              placeholder={
                language === "ar"
                  ? "مثال: فستان زارا الأحمر مقاس M، رابط الفستان: ..."
                  : "e.g. Zara Red Pleated Dress, Size M, link: ..."
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-brand-text/60">{language === "ar" ? "رابط صورة مرجعية (اختياري)" : "Reference Image URL (optional)"}</label>
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-primary/10 text-brand-text font-english"
              placeholder="https://..."
            />
          </div>

          <div className="pt-4 border-t border-primary/5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border text-brand-text/70 uppercase tracking-wider font-semibold font-english"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold uppercase tracking-wider font-english flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <MessageCircle className="w-3.5 h-3.5 fill-white text-primary" />
                  {language === "ar" ? "طلب عبر الواتساب" : "Submit Request"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
