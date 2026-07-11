import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { ChevronLeft } from "lucide-react";

export const Terms = () => {
  const { language, t, isRtl } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex-1">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-secondary uppercase tracking-widest font-english mb-8 hover:underline"
      >
        <ChevronLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
        {language === "ar" ? "العودة للرئيسية" : "Back to Home"}
      </Link>

      <div className="bg-white dark:bg-brand-dark-card border border-primary/5 rounded-3xl p-8 md:p-12 shadow-sm space-y-6 transition-colors duration-500">
        <h1 className="text-3xl font-light text-brand-text dark:text-brand-dark-text tracking-wide mb-6">
          {t("termsOfService")}
        </h1>
        <div className="w-12 h-[1.5px] bg-primary/30" />

        <div className="space-y-6 text-xs text-brand-text/75 dark:text-brand-dark-text/75 font-light leading-relaxed">
          {language === "ar" ? (
            <>
              <p>مرحباً بكِ في شروط خدمة ليلا. باستخدامكِ لموقعنا والطلب من خلاله، فإنكِ توافقين على الالتزام بالشروط والأحكام التالية:</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">1. طبيعة الخدمة</h2>
              <p>ليلا هي خدمة تسوق شخصية (وسيط شراء). نحن نقوم بشراء المنتجات التي تحددينها من مصر وتغليفها ثم شحنها لعنوانكِ في اليمن. لا نتحمل مسؤولية عيوب التصنيع الخاصة بالشركات المنتجة الأصلية ولكن نضمن شراء المنتجات الأصلية تماماً والمطابقة لاختياركِ.</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">2. أسعار الشحن والوزن</h2>
              <p>يتم احتساب تكلفة الشحن الفعلي بناءً على الوزن والنوع: العناية الشخصية بسعر 450 جنيه مصري/كجم، والملابس والمنتجات المنزلية بسعر 300 جنيه مصري/كجم. في حال تبيّن وجود فرق في الوزن الفعلي عند التعبئة النهائية، سيتم تعديل القيمة بالتنسيق معكِ.</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">3. الدفع والتوصيل</h2>
              <p>تتم تسوية المبالغ بالريال اليمني عبر قنوات الدفع والتحويل المحلية المحددة. يستغرق الشحن والتوصيل من القاهرة إلى جميع المحافظات اليمنية في الغالب من 7 إلى 10 أيام عمل.</p>
            </>
          ) : (
            <>
              <p>Welcome to LELA's Terms of Service. By utilizing our platform and concierge shopping services, you agree to comply with and be bound by the following terms:</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">1. Nature of Service</h2>
              <p>LELA acts as a shopping concierge (purchasing agent). We acquire specified items from Egypt, bundle them securely, and dispatch them to your address in Yemen. We are not the manufacturers of the products, but we guarantee that all items sourced are 100% authentic and purchase-matched to your choices.</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">2. Shipping & Weight Calculation</h2>
              <p>Shipping is computed by final packaged weight and category: Personal Care at 450 EGP/KG and Clothing/Home at 300 EGP/KG. If the actual packed parcel weight differs from estimates upon final consolidating, pricing adjustments will be applied and communicated transparency.</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">3. Settlement & Delivery</h2>
              <p>Order payments are calculated in Yemeni Rial (YER) and settled via approved local money transfers in Yemen. Delivery to Yemen governorates typically takes 7-10 business days from the packaging confirmation date in Cairo.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
