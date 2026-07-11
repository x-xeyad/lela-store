import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { ChevronLeft } from "lucide-react";

export const PrivacyPolicy = () => {
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
          {t("privacyPolicy")}
        </h1>
        <div className="w-12 h-[1.5px] bg-primary/30" />

        <div className="space-y-6 text-xs text-brand-text/75 dark:text-brand-dark-text/75 font-light leading-relaxed">
          {language === "ar" ? (
            <>
              <p>نحن في ليلا نقدر خصوصيتكِ ونلتزم بحماية بياناتكِ الشخصية. توضح هذه السياسة كيف نقوم بجمع واستخدام ومعالجة معلوماتكِ الشخصية عند استخدام موقعنا الإلكتروني.</p>
              
              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">1. المعلومات التي نجمعها</h2>
              <p>نقوم بجمع المعلومات التي تقدمينها لنا مباشرة عند تقديم طلب شراء أو التسجيل في موقعنا. تشمل هذه المعلومات: الاسم، رقم الهاتف، المحافظة، وعنوان التوصيل بالتفصيل.</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">2. كيف نستخدم معلوماتكِ</h2>
              <p>نستخدم معلوماتكِ لمعالجة وتأمين طلبات الشراء من مصر، وحساب تكاليف الشحن، وتنسيق التوصيل إلى محافظتكِ في اليمن، والتواصل معكِ عبر الواتساب لتأكيد الطلب وحل أي استفسارات.</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">3. مشاركة البيانات</h2>
              <p>لا نقوم ببيع أو تأجير بياناتكِ الشخصية لأي جهات خارجية. نشارك فقط معلومات التوصيل الضرورية (الاسم، الهاتف، العنوان) مع وكلاء الشحن والتوزيع المحليين في اليمن لضمان تسليم طلبيتكِ بنجاح.</p>
            </>
          ) : (
            <>
              <p>At LELA, we value your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and process your personal information when you use our shopping concierge platform.</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when placing an order or registering on our website. This includes: Full Name, Yemen Phone Number, Governorate, and Detailed Delivery Address.</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">2. How We Use Your Information</h2>
              <p>We use your information to process and secure your shopping purchases in Egypt, calculate corresponding weight-based shipping rates, coordinate delivery to your governorate in Yemen, and communicate via WhatsApp to confirm order details.</p>

              <h2 className="text-sm font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wider mt-4">3. Data Sharing</h2>
              <p>We do not sell, rent, or lease your personal information to third parties. We only share essential delivery parameters (Name, Phone, Address) with our local shipping coordinators and distribution agents in Yemen to ensure your parcel reaches your doorstep successfully.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
