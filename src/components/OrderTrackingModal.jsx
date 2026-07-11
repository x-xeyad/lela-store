import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { X, Search, CheckCircle, Clock, Truck, ShieldCheck, MapPin } from "lucide-react";
import { orderService } from "../services/orderService";
import toast from "react-hot-toast";

export const OrderTrackingModal = ({ isOpen, onClose }) => {
  const { language, t, isRtl } = useLanguage();
  const [orderIdInput, setOrderIdInput] = useState("");
  const [order, setOrder] = useState(null);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;

    try {
      const found = await orderService.getById(orderIdInput.trim());
      if (found) {
        setOrder(found);
      } else {
        setOrder(null);
        toast.error(language === "ar" ? "رقم الطلب غير صحيح" : "Order ID not found.");
      }
      setSearched(true);
    } catch (e) {
      toast.error("Error searching order.");
    }
  };

  const steps = [
    { key: "pending", nameEn: "Order Placed", nameAr: "تم استلام الطلب", icon: <Clock className="w-4 h-4" /> },
    { key: "sourced", nameEn: "Cairo Sourced", nameAr: "تجهيز الطلب في القاهرة", icon: <ShieldCheck className="w-4 h-4" /> },
    { key: "shipped", nameEn: "In Transit", nameAr: "جاري الشحن لليمن", icon: <Truck className="w-4 h-4" /> },
    { key: "arrived", nameEn: "Arrived Yemen", nameAr: "وصل اليمن", icon: <MapPin className="w-4 h-4" /> },
    { key: "completed", nameEn: "Delivered", nameAr: "تم التسليم للعميل", icon: <CheckCircle className="w-4 h-4" /> }
  ];

  const getStatusIndex = (status) => {
    switch (status) {
      case "pending": return 0;
      case "sourced": return 1;
      case "shipped": return 2;
      case "arrived": return 3;
      case "completed": return 4;
      case "cancelled": return -1;
      default: return 0;
    }
  };

  const statusIdx = order ? getStatusIndex(order.status) : -1;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-brand-bg dark:bg-brand-dark-card border border-primary/10 dark:border-secondary/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-primary/5 dark:border-secondary/5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-secondary font-english">
            {language === "ar" ? "تتبع حالة الطلبية" : "Track Order Status"}
          </h3>
          <button onClick={onClose} className="text-brand-text/50 hover:text-brand-text p-1 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs font-sans">
          {/* Tracking Search Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                placeholder="Enter Order ID (e.g., ORD-123456)"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-primary/10 text-xs font-english font-bold uppercase"
              />
              <Search className="w-4 h-4 text-brand-text/40 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-white font-bold font-english uppercase tracking-wider shadow-md"
            >
              Track
            </button>
          </form>

          {/* Searched Results */}
          {searched && (
            <div className="space-y-6 pt-4 border-t border-primary/5">
              {!order ? (
                <div className="text-center py-6 text-brand-text/40">
                  {language === "ar" ? "تعذر العثور على طلب بهذا الرقم." : "Unable to find order details."}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-brand-text/50">{language === "ar" ? "رقم الطلب" : "Order ID"}</p>
                      <h4 className="font-bold text-primary font-english mt-0.5">{order.id}</h4>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-text/50">{language === "ar" ? "الحالة" : "Current Status"}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-block mt-0.5 ${
                        order.status === "completed" 
                          ? "bg-green-500/10 text-green-500" 
                          : order.status === "cancelled" 
                            ? "bg-red-500/10 text-red-500" 
                            : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {order.status === "cancelled" ? (language === "ar" ? "ملغي" : "Cancelled") : steps[statusIdx]?.nameEn}
                      </span>
                    </div>
                  </div>

                  {/* Customer details summary */}
                  <div className="grid grid-cols-2 gap-4 border-b border-primary/5 pb-4">
                    <div>
                      <p className="font-semibold text-brand-text/40">{language === "ar" ? "المستلم" : "Receiver"}</p>
                      <p className="font-bold text-brand-text mt-0.5">{order.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-text/40">{language === "ar" ? "المحافظة" : "Governorate"}</p>
                      <p className="font-bold text-brand-text mt-0.5">{order.customer.governorate}</p>
                    </div>
                  </div>

                  {/* Visual Stepper timeline */}
                  {order.status !== "cancelled" && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase text-brand-text/50 tracking-wider">
                        {language === "ar" ? "خط تتبع الشحنة" : "Sourcing & Delivery Timeline"}
                      </h4>
                      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-primary/10">
                        {steps.map((st, idx) => {
                          const isDone = idx <= statusIdx;
                          const isActive = idx === statusIdx;
                          return (
                            <div key={idx} className="relative flex items-start gap-4">
                              {/* Step circle marker */}
                              <div className={`absolute -left-[20px] w-6 h-6 rounded-full flex items-center justify-center border transition-all z-10 ${
                                isDone 
                                  ? "bg-primary border-primary text-white shadow-md shadow-primary/20" 
                                  : "bg-brand-bg dark:bg-brand-dark-bg border-primary/20 text-brand-text/30"
                              } ${isActive ? "scale-110 animate-pulse border-2" : ""}`}>
                                {st.icon}
                              </div>
                              <div className="ml-4 pt-0.5">
                                <h5 className={`font-semibold text-xs ${isDone ? "text-brand-text" : "text-brand-text/40"}`}>
                                  {language === "ar" ? st.nameAr : st.nameEn}
                                </h5>
                                {isActive && (
                                  <span className="text-[9px] text-primary font-medium animate-pulse block mt-0.5">
                                    {language === "ar" ? "قيد الإجراء حالياً" : "Current location of your package"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cancelled Alert */}
                  {order.status === "cancelled" && (
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center text-red-500">
                      {language === "ar" 
                        ? "هذا الطلب تم إلغاؤه من قبل مسؤول المتجر." 
                        : "This order has been cancelled by the concierge team."}
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
