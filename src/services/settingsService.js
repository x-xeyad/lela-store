import { mockHomepage } from "../data/mockHomepage";
import { mockFaq } from "../data/mockFaq";
import { mockReviews } from "../data/mockReviews";
import { SHIPPING_RATES, CURRENCY } from "../constants/shipping";
import { CONTACT_INFO } from "../constants/contact";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const SETTINGS_KEY = "lela_settings";

const getDefaults = () => ({
  homepage: mockHomepage,
  faq: mockFaq,
  reviews: mockReviews,
  shippingRates: SHIPPING_RATES,
  currency: CURRENCY,
  contactInfo: CONTACT_INFO,
  branding: {
    logoUrl: "", 
    logoDarkUrl: "", 
    faviconUrl: "",
    loadingLogoUrl: "",
    browserIconUrl: "",
    websiteName: "LELA Store",
    primaryColor: "#8A3D5A",
    secondaryColor: "#E3B8AE",
    backgroundColor: "#FFF9F7",
    textColor: "#3A2A30",
  },
  theme: {
    primaryColor: "#8A3D5A",
    secondaryColor: "#E3B8AE",
    accentColor: "#D7A5AE",
    backgroundColor: "#FFF9F7",
    textColor: "#3A2A30",
    darkPrimaryColor: "#8A3D5A",
    darkSecondaryColor: "#E3B8AE",
    darkAccentColor: "#D7A5AE",
    darkBackgroundColor: "#0F172A",
    darkTextColor: "#FFFFFF",
    buttonRadius: "12px",
    borderWidth: "1px",
    cardBg: "#FFFFFF",
    darkCardBg: "#1E293B"
  },
  categories: [
    { id: "c1", name: { en: "Personal Care", ar: "عناية شخصية" }, image: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=400", order: 1, hidden: false },
    { id: "c2", name: { en: "Clothing", ar: "ملابس" }, image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400", order: 2, hidden: false },
    { id: "c3", name: { en: "Home Products", ar: "منتجات منزلية" }, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=400", order: 3, hidden: false },
    { id: "c4", name: { en: "Accessories", ar: "إكسسوارات" }, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400", order: 4, hidden: false },
    { id: "c5", name: { en: "Kids", ar: "أطفال" }, image: "https://images.unsplash.com/photo-1519689680058-324335c77ebe?auto=format&fit=crop&q=80&w=400", order: 5, hidden: false },
    { id: "c6", name: { en: "Electronics", ar: "إلكترونيات" }, image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=400", order: 6, hidden: false }
  ],
  coupons: [
    { code: "LELA10", discountType: "percentage", discountValue: 10, expirationDate: "", maxUses: 100, usedCount: 0, minOrderValue: 0, active: true },
    { code: "WELCOME5", discountType: "percentage", discountValue: 5, expirationDate: "", maxUses: 100, usedCount: 0, minOrderValue: 0, active: true }
  ],
  specialOrders: [],
  activityLogs: [
    { action: "LELA luxury platform initialized", timestamp: new Date(Date.now() - 3600000).toISOString() }
  ],
  announcements: [
    "✨ Sourcing premium products from Cairo to Yemen!",
    "✈️ Shipping batch leaving Cairo in 3 days! Book your orders now."
  ],
  seoSettings: {
    title: "LELA | Luxury Shopping Concierge",
    description: "LELA is a luxury shopping concierge service buying products from Egypt and shipping securely to Sana'a, Aden, and all governorates in Yemen.",
    keywords: "Lela, Lela Store, shopping Egypt, shipping Yemen"
  },
  maintenanceMode: false
});

const initSettings = () => {
  const existing = localStorage.getItem(SETTINGS_KEY);
  if (!existing) {
    const defaults = getDefaults();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  try {
    const parsed = JSON.parse(existing);
    if (parsed.contactInfo && parsed.contactInfo.phoneYemen === "+96778499076") {
      parsed.contactInfo.phoneYemen = "+967784990676";
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
    }
    // Merge defaults
    const defaults = getDefaults();
    return {
      ...defaults,
      ...parsed,
      branding: { ...defaults.branding, ...parsed.branding },
      theme: { ...defaults.theme, ...parsed.theme }
    };
  } catch (e) {
    const defaults = getDefaults();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
    return defaults;
  }
};

const getGenericKey = async (key, fallback) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", key)
        .single();
      if (!error && data) return data.value;
    } catch (err) {
      console.error(`Supabase settings error for key ${key}:`, err);
    }
  }
  return fallback;
};

const saveGenericKey = async (key, value) => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from("settings").upsert({ key, value });
    } catch (err) {
      console.error(`Supabase settings save error for key ${key}:`, err);
    }
  }
};

export const settingsService = {
  get: async () => {
    const local = initSettings();
    if (isSupabaseConfigured) {
      const homepage = await getGenericKey("homepage", local.homepage);
      const shippingRates = await getGenericKey("shippingRates", local.shippingRates);
      const currency = await getGenericKey("currency", local.currency);
      const contactInfo = await getGenericKey("contactInfo", local.contactInfo);
      const branding = await getGenericKey("branding", local.branding);
      const theme = await getGenericKey("theme", local.theme);
      const seoSettings = await getGenericKey("seoSettings", local.seoSettings);
      const maintenanceMode = await getGenericKey("maintenanceMode", local.maintenanceMode);
      
      const categories = await settingsService.getCategories();
      const coupons = await settingsService.getCoupons();
      const faq = await settingsService.getFaqs();
      const reviews = await settingsService.getReviews();
      const specialOrders = await settingsService.getSpecialOrders();
      const activityLogs = await settingsService.getActivityLogs();

      return {
        homepage,
        shippingRates,
        currency,
        contactInfo,
        branding,
        theme,
        seoSettings,
        maintenanceMode,
        categories,
        coupons,
        faq,
        reviews,
        specialOrders,
        activityLogs
      };
    }
    return local;
  },

  update: async (updatedSettings) => {
    const current = initSettings();
    const merged = { ...current, ...updatedSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    
    if (isSupabaseConfigured) {
      for (const [key, value] of Object.entries(updatedSettings)) {
        if (["categories", "coupons", "faq", "reviews", "specialOrders", "activityLogs"].includes(key)) continue;
        await saveGenericKey(key, value);
      }
    }
    return merged;
  },

  updateHomepage: async (homepageData) => {
    const current = initSettings();
    current.homepage = { ...current.homepage, ...homepageData };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    await saveGenericKey("homepage", current.homepage);
    return current.homepage;
  },

  updateShippingRates: async (rates) => {
    const current = initSettings();
    current.shippingRates = { ...current.shippingRates, ...rates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    await saveGenericKey("shippingRates", current.shippingRates);
    return current.shippingRates;
  },

  updateCurrency: async (curr) => {
    const current = initSettings();
    current.currency = { ...current.currency, ...curr };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    await saveGenericKey("currency", current.currency);
    return current.currency;
  },

  updateContactInfo: async (contact) => {
    const current = initSettings();
    current.contactInfo = { ...current.contactInfo, ...contact };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    await saveGenericKey("contactInfo", current.contactInfo);
    return current.contactInfo;
  },

  updateBranding: async (branding) => {
    const current = initSettings();
    current.branding = { ...current.branding, ...branding };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    await saveGenericKey("branding", current.branding);
    return current.branding;
  },

  updateTheme: async (theme) => {
    const current = initSettings();
    current.theme = { ...current.theme, ...theme };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    await saveGenericKey("theme", current.theme);
    return current.theme;
  },

  // FAQ CRUD
  getFaqs: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("faqs").select("*");
        if (!error && data) {
          return data.map(f => ({
            id: f.id,
            question: f.question || { en: "", ar: "" },
            answer: f.answer || { en: "", ar: "" }
          }));
        }
      } catch (err) {
        console.error("Supabase getFaqs error:", err);
      }
    }
    const current = initSettings();
    return current.faq;
  },

  saveFaqs: async (faqs) => {
    const current = initSettings();
    current.faq = faqs;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));

    if (isSupabaseConfigured) {
      try {
        // Simple delete + insert to maintain consistency in mock demo
        await supabase.from("faqs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("faqs").insert(faqs.map(f => ({
          question: f.question,
          answer: f.answer
        })));
      } catch (err) {
        console.error("Supabase saveFaqs error:", err);
      }
    }
    return current.faq;
  },

  // Reviews CRUD
  getReviews: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("reviews").select("*").order("date", { ascending: false });
        if (!error && data) {
          return data.map(r => ({
            id: r.id,
            name: r.name,
            rating: r.rating,
            date: r.date,
            comment: r.comment || { en: "", ar: "" },
            avatar: r.avatar
          }));
        }
      } catch (err) {
        console.error("Supabase getReviews error:", err);
      }
    }
    const current = initSettings();
    return current.reviews;
  },

  saveReviews: async (reviews) => {
    const current = initSettings();
    current.reviews = reviews;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));

    if (isSupabaseConfigured) {
      try {
        await supabase.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("reviews").insert(reviews.map(r => ({
          name: r.name,
          rating: r.rating,
          date: r.date,
          comment: r.comment,
          avatar: r.avatar
        })));
      } catch (err) {
        console.error("Supabase saveReviews error:", err);
      }
    }
    return current.reviews;
  },

  // Categories CRUD
  getCategories: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("categories").select("*").order("order", { ascending: true });
        if (!error && data) return data;
      } catch (err) {
        console.error("Supabase getCategories error:", err);
      }
    }
    const current = initSettings();
    return current.categories || [];
  },

  saveCategories: async (categories) => {
    const current = initSettings();
    current.categories = categories;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));

    if (isSupabaseConfigured) {
      try {
        await supabase.from("categories").delete().neq("id", "0");
        await supabase.from("categories").insert(categories.map(c => ({
          id: c.id,
          name: c.name,
          image: c.image,
          order: c.order,
          hidden: c.hidden
        })));
      } catch (err) {
        console.error("Supabase saveCategories error:", err);
      }
    }
    return current.categories;
  },

  // Coupons CRUD
  getCoupons: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("coupons").select("*");
        if (!error && data) {
          return data.map(c => ({
            code: c.code,
            discountType: c.discount_type,
            discountValue: parseFloat(c.discount_value),
            expirationDate: c.expiration_date || "",
            maxUses: parseInt(c.max_uses || 100, 10),
            usedCount: parseInt(c.used_count || 0, 10),
            minOrderValue: parseFloat(c.min_order_value || 0),
            active: !!c.active
          }));
        }
      } catch (err) {
        console.error("Supabase getCoupons error:", err);
      }
    }
    const current = initSettings();
    return current.coupons || [];
  },

  saveCoupons: async (coupons) => {
    const current = initSettings();
    current.coupons = coupons;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));

    if (isSupabaseConfigured) {
      try {
        await supabase.from("coupons").delete().neq("code", "");
        await supabase.from("coupons").insert(coupons.map(c => ({
          code: c.code,
          discount_type: c.discountType,
          discount_value: c.discountValue,
          expiration_date: c.expirationDate || null,
          max_uses: c.maxUses || null,
          used_count: c.usedCount || 0,
          min_order_value: c.minOrderValue || 0,
          active: c.active
        })));
      } catch (err) {
        console.error("Supabase saveCoupons error:", err);
      }
    }
    return current.coupons;
  },

  // Special Orders CRUD
  getSpecialOrders: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("special_orders").select("*").order("created_at", { ascending: false });
        if (!error && data) {
          return data.map(so => ({
            id: so.id,
            date: so.date,
            customer: so.customer,
            description: so.description,
            weight: so.weight,
            imageUrl: so.image_url,
            status: so.status
          }));
        }
      } catch (err) {
        console.error("Supabase getSpecialOrders error:", err);
      }
    }
    const current = initSettings();
    return current.specialOrders || [];
  },

  saveSpecialOrders: async (specialOrders) => {
    const current = initSettings();
    current.specialOrders = specialOrders;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));

    if (isSupabaseConfigured) {
      try {
        await supabase.from("special_orders").delete().neq("id", "0");
        await supabase.from("special_orders").insert(specialOrders.map(so => ({
          id: so.id,
          date: so.date,
          customer: so.customer,
          description: so.description,
          weight: so.weight,
          image_url: so.imageUrl,
          status: so.status
        })));
      } catch (err) {
        console.error("Supabase saveSpecialOrders error:", err);
      }
    }
    return current.specialOrders;
  },

  // Activity Logs
  getActivityLogs: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("activity_logs").select("*").order("timestamp", { ascending: false }).limit(100);
        if (!error && data) {
          return data.map(log => ({
            id: log.id,
            message: log.message,
            timestamp: log.timestamp
          }));
        }
      } catch (err) {
        console.error("Supabase getActivityLogs error:", err);
      }
    }
    const current = initSettings();
    return current.activityLogs || [];
  },

  addActivityLog: async (message) => {
    const current = initSettings();
    if (!current.activityLogs) current.activityLogs = [];
    
    const newLog = {
      action: message,
      timestamp: new Date().toISOString()
    };
    current.activityLogs.unshift(newLog);
    if (current.activityLogs.length > 100) {
      current.activityLogs = current.activityLogs.slice(0, 100);
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));

    if (isSupabaseConfigured) {
      try {
        await supabase.from("activity_logs").insert([{ message }]);
      } catch (err) {
        console.error("Supabase addActivityLog error:", err);
      }
    }
    return current.activityLogs;
  },

  // Announcements CRUD
  getAnnouncements: async () => {
    const current = initSettings();
    return await getGenericKey("announcements", current.announcements || []);
  },

  saveAnnouncements: async (announcements) => {
    const current = initSettings();
    current.announcements = announcements;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    await saveGenericKey("announcements", announcements);
    return current.announcements;
  },

  // SEO Settings CRUD
  getSeoSettings: async () => {
    const current = initSettings();
    return await getGenericKey("seoSettings", current.seoSettings || { title: "LELA | Luxury Shopping Concierge", description: "", keywords: "" });
  },

  saveSeoSettings: async (seoSettings) => {
    const current = initSettings();
    current.seoSettings = seoSettings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    await saveGenericKey("seoSettings", seoSettings);
    return current.seoSettings;
  },

  // Maintenance Mode
  getMaintenanceMode: async () => {
    const current = initSettings();
    return await getGenericKey("maintenanceMode", current.maintenanceMode || false);
  },

  saveMaintenanceMode: async (mode) => {
    const current = initSettings();
    current.maintenanceMode = mode;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    await saveGenericKey("maintenanceMode", mode);
    return current.maintenanceMode;
  }
};
