import { supabase } from "./supabaseClient";

// Define safe local default settings
const defaultHomepage = {
  hero: {
    title: {
      en: "Shopping from Egypt. Shipping to Yemen.",
      ar: "تسوقي من مصر. الشحن لليمن."
    },
    subtitle: {
      en: "LELA is your premium personal shopping concierge. We acquire luxury products, fashion, and personal care from Cairo and deliver directly to your doorstep in Yemen.",
      ar: "ليلا هي رفيقة تسوقك الشخصية الفاخرة. نوفر لكِ مستحضرات التجميل، الأزياء، والمنتجات المنزلية من القاهرة ونوصلها مباشرة إلى باب بيتكِ في اليمن."
    }
  },
  whyLela: [],
  howItWorks: []
};

const defaultShippingRates = {
  personalCare: 450,
  clothingHome: 300,
  defaultWeight: 0.5
};

const defaultCurrency = {
  egpToYerRate: 11.5,
  yerToSarRate: 140
};

const defaultContactInfo = {
  phoneEgypt: '+201557179009',
  phoneYemen: '+967784990676',
  email: 'lela.storex@gmail.com',
  instagram: 'https://instagram.com/lela_e0',
  facebook: 'https://facebook.com/lela.e0',
  whatsappEgypt: 'https://wa.me/201557179009',
  whatsappYemen: 'https://wa.me/967784990676'
};

const defaultBranding = {
  logoUrl: "",
  logoDarkUrl: "",
  faviconUrl: "",
  loadingLogoUrl: "",
  browserIconUrl: "",
  websiteName: "LELA Store",
  primaryColor: "#8A3D5A",
  secondaryColor: "#E3B8AE",
  backgroundColor: "#FFF9F7",
  textColor: "#3A2A30"
};

const defaultTheme = {
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
};

const defaultSeoSettings = {
  title: "LELA Store - Premium Personal Shopping Concierge",
  description: "LELA is your luxury concierge service: We buy fashion, makeup, and home products from Cairo flagship stores and ship to all governorates in Yemen.",
  keywords: "Yemen shopping, Cairo to Sanaa, cosmetics Yemen, LELA store"
};

const getGenericKey = async (key, fallback) => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .single();
      
    if (error) {
      console.warn(`Supabase settings load warning for key "${key}":`, error.message);
      return fallback;
    }
    return data ? data.value : fallback;
  } catch (e) {
    console.warn(`Exception reading settings key "${key}":`, e);
    return fallback;
  }
};

const saveGenericKey = async (key, value) => {
  try {
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value });
      
    if (error) {
      console.error(`Supabase settings save error for key "${key}":`, error.message);
      throw error;
    }
  } catch (e) {
    console.error(`Exception writing settings key "${key}":`, e);
    throw e;
  }
};

export const settingsService = {
  get: async () => {
    try {
      const homepage = await getGenericKey("homepage", defaultHomepage);
      const shippingRates = await getGenericKey("shippingRates", defaultShippingRates);
      const currency = await getGenericKey("currency", defaultCurrency);
      const contactInfo = await getGenericKey("contactInfo", defaultContactInfo);
      const branding = await getGenericKey("branding", defaultBranding);
      const theme = await getGenericKey("theme", defaultTheme);
      const seoSettings = await getGenericKey("seoSettings", defaultSeoSettings);
      const maintenanceMode = await getGenericKey("maintenanceMode", false);
      const announcements = await getGenericKey("announcements", []);

      return {
        homepage,
        shippingRates,
        currency,
        contactInfo,
        branding,
        theme,
        seoSettings,
        maintenanceMode,
        announcements
      };
    } catch (e) {
      console.warn("Recovered from settingsService.get critical exception:", e);
      return {
        homepage: defaultHomepage,
        shippingRates: defaultShippingRates,
        currency: defaultCurrency,
        contactInfo: defaultContactInfo,
        branding: defaultBranding,
        theme: defaultTheme,
        seoSettings: defaultSeoSettings,
        maintenanceMode: false,
        announcements: []
      };
    }
  },

  update: async (updatedSettings) => {
    for (const [key, value] of Object.entries(updatedSettings)) {
      if (["categories", "coupons", "faq", "reviews", "specialOrders", "activityLogs"].includes(key)) continue;
      await saveGenericKey(key, value);
    }
    return updatedSettings;
  },

  updateHomepage: async (homepageData) => {
    await saveGenericKey("homepage", homepageData);
    return homepageData;
  },

  updateShippingRates: async (rates) => {
    await saveGenericKey("shippingRates", rates);
    return rates;
  },

  updateCurrency: async (curr) => {
    await saveGenericKey("currency", curr);
    return curr;
  },

  updateContactInfo: async (contact) => {
    await saveGenericKey("contactInfo", contact);
    return contact;
  },

  updateBranding: async (branding) => {
    await saveGenericKey("branding", branding);
    return branding;
  },

  updateTheme: async (theme) => {
    await saveGenericKey("theme", theme);
    return theme;
  },

  // FAQ CRUD
  getFaqs: async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*");
        
      if (error) {
        console.warn("Supabase getFaqs warning:", error.message);
        return [];
      }
      return (data || []).map(f => ({
        id: f.id,
        question: f.question || { en: "", ar: "" },
        answer: f.answer || { en: "", ar: "" }
      }));
    } catch (e) {
      console.warn("Exception in getFaqs:", e);
      return [];
    }
  },

  saveFaqs: async (faqs) => {
    const { error: deleteError } = await supabase
      .from("faqs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
      
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from("faqs")
      .insert(faqs.map(f => ({
        question: f.question,
        answer: f.answer
      })));
      
    if (insertError) throw insertError;
    return faqs;
  },

  // Reviews CRUD
  getReviews: async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("date", { ascending: false });
        
      if (error) {
        console.warn("Supabase getReviews warning:", error.message);
        return [];
      }
      return (data || []).map(r => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        date: r.date,
        comment: r.comment || { en: "", ar: "" },
        avatar: r.avatar
      }));
    } catch (e) {
      console.warn("Exception in getReviews:", e);
      return [];
    }
  },

  saveReviews: async (reviews) => {
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
      
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from("reviews")
      .insert(reviews.map(r => ({
        name: r.name,
        rating: r.rating,
        date: r.date,
        comment: r.comment,
        avatar: r.avatar
      })));
      
    if (insertError) throw insertError;
    return reviews;
  },

  // Categories CRUD
  getCategories: async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("order", { ascending: true });
        
      if (error) {
        console.warn("Supabase getCategories warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn("Exception in getCategories:", e);
      return [];
    }
  },

  saveCategories: async (categories) => {
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .neq("id", "0");
      
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from("categories")
      .insert(categories.map(c => ({
        id: c.id,
        name: c.name,
        image: c.image,
        order: c.order,
        hidden: c.hidden
      })));
      
    if (insertError) throw insertError;
    return categories;
  },

  // Coupons CRUD
  getCoupons: async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*");
        
      if (error) {
        console.warn("Supabase getCoupons warning:", error.message);
        return [];
      }
      return (data || []).map(c => ({
        code: c.code,
        discountType: c.discount_type,
        discountValue: parseFloat(c.discount_value),
        expirationDate: c.expiration_date || "",
        maxUses: parseInt(c.max_uses || 100, 10),
        usedCount: parseInt(c.used_count || 0, 10),
        minOrderValue: parseFloat(c.min_order_value || 0),
        active: !!c.active
      }));
    } catch (e) {
      console.warn("Exception in getCoupons:", e);
      return [];
    }
  },

  saveCoupons: async (coupons) => {
    const { error: deleteError } = await supabase
      .from("coupons")
      .delete()
      .neq("code", "");
      
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from("coupons")
      .insert(coupons.map(c => ({
        code: c.code,
        discount_type: c.discountType,
        discount_value: c.discountValue,
        expiration_date: c.expirationDate || null,
        max_uses: c.maxUses || null,
        used_count: c.usedCount || 0,
        min_order_value: c.minOrderValue || 0,
        active: c.active
      })));
      
    if (insertError) throw insertError;
    return coupons;
  },

  // Special Orders CRUD
  getSpecialOrders: async () => {
    try {
      const { data, error } = await supabase
        .from("special_orders")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        console.warn("Supabase getSpecialOrders warning:", error.message);
        return [];
      }
      return (data || []).map(so => ({
        id: so.id,
        date: so.date,
        customer: so.customer,
        description: so.description,
        weight: so.weight,
        imageUrl: so.image_url,
        status: so.status
      }));
    } catch (e) {
      console.warn("Exception in getSpecialOrders:", e);
      return [];
    }
  },

  saveSpecialOrders: async (specialOrders) => {
    try {
      const { error: deleteError } = await supabase
        .from("special_orders")
        .delete()
        .neq("id", "0");
        
      if (deleteError) throw deleteError;

      if (specialOrders.length > 0) {
        const { error: insertError } = await supabase
          .from("special_orders")
          .insert(specialOrders.map(so => ({
            id: so.id,
            date: so.date,
            customer: so.customer,
            description: so.description,
            weight: so.weight,
            image_url: so.imageUrl,
            status: so.status
          })));
          
        if (insertError) throw insertError;
      }
      return specialOrders;
    } catch (e) {
      console.error("Exception in saveSpecialOrders:", e);
      throw e;
    }
  },

  // Activity Logs
  getActivityLogs: async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);
        
      if (error) {
        console.warn("Supabase getActivityLogs warning:", error.message);
        return [];
      }
      return (data || []).map(log => ({
        id: log.id,
        message: log.message,
        timestamp: log.timestamp
      }));
    } catch (e) {
      console.warn("Exception in getActivityLogs:", e);
      return [];
    }
  },

  addActivityLog: async (message) => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .insert([{ message }])
        .select()
        .single();
        
      if (error) {
        console.warn("Supabase addActivityLog warning:", error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("Exception in addActivityLog:", e);
      return null;
    }
  },

  // Announcements CRUD
  getAnnouncements: async () => {
    return await getGenericKey("announcements", []);
  },

  saveAnnouncements: async (announcements) => {
    await saveGenericKey("announcements", announcements);
    return announcements;
  },

  // SEO Settings CRUD
  getSeoSettings: async () => {
    return await getGenericKey("seoSettings", defaultSeoSettings);
  },

  saveSeoSettings: async (seoSettings) => {
    await saveGenericKey("seoSettings", seoSettings);
    return seoSettings;
  },

  // Maintenance Mode
  getMaintenanceMode: async () => {
    return await getGenericKey("maintenanceMode", false);
  },

  saveMaintenanceMode: async (mode) => {
    await saveGenericKey("maintenanceMode", mode);
    return mode;
  }
};
