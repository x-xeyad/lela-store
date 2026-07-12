import { supabase } from "./supabaseClient";

const getGenericKey = async (key) => {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();
    
  if (error) {
    console.error(`Supabase settings error for key ${key}:`, error);
    throw error;
  }
  return data ? data.value : null;
};

const saveGenericKey = async (key, value) => {
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value });
    
  if (error) {
    console.error(`Supabase settings save error for key ${key}:`, error);
    throw error;
  }
};

export const settingsService = {
  get: async () => {
    const homepage = await getGenericKey("homepage");
    const shippingRates = await getGenericKey("shippingRates");
    const currency = await getGenericKey("currency");
    const contactInfo = await getGenericKey("contactInfo");
    const branding = await getGenericKey("branding");
    const theme = await getGenericKey("theme");
    const seoSettings = await getGenericKey("seoSettings");
    const maintenanceMode = await getGenericKey("maintenanceMode");
    
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
    const { data, error } = await supabase
      .from("faqs")
      .select("*");
      
    if (error) {
      console.error("Supabase getFaqs error:", error);
      throw error;
    }
    return (data || []).map(f => ({
      id: f.id,
      question: f.question || { en: "", ar: "" },
      answer: f.answer || { en: "", ar: "" }
    }));
  },

  saveFaqs: async (faqs) => {
    // Delete existing list, and insert new updated items
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
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("date", { ascending: false });
      
    if (error) {
      console.error("Supabase getReviews error:", error);
      throw error;
    }
    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      date: r.date,
      comment: r.comment || { en: "", ar: "" },
      avatar: r.avatar
    }));
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
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order", { ascending: true });
      
    if (error) {
      console.error("Supabase getCategories error:", error);
      throw error;
    }
    return data || [];
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
    const { data, error } = await supabase
      .from("coupons")
      .select("*");
      
    if (error) {
      console.error("Supabase getCoupons error:", error);
      throw error;
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
    const { data, error } = await supabase
      .from("special_orders")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Supabase getSpecialOrders error:", error);
      throw error;
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
  },

  saveSpecialOrders: async (specialOrders) => {
    const { error: deleteError } = await supabase
      .from("special_orders")
      .delete()
      .neq("id", "0");
      
    if (deleteError) throw deleteError;

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
    return specialOrders;
  },

  // Activity Logs
  getActivityLogs: async () => {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);
      
    if (error) {
      console.error("Supabase getActivityLogs error:", error);
      throw error;
    }
    return (data || []).map(log => ({
      id: log.id,
      message: log.message,
      timestamp: log.timestamp
    }));
  },

  addActivityLog: async (message) => {
    const { data, error } = await supabase
      .from("activity_logs")
      .insert([{ message }])
      .select()
      .single();
      
    if (error) {
      console.error("Supabase addActivityLog error:", error);
      throw error;
    }
    return data;
  },

  // Announcements CRUD
  getAnnouncements: async () => {
    return await getGenericKey("announcements");
  },

  saveAnnouncements: async (announcements) => {
    await saveGenericKey("announcements", announcements);
    return announcements;
  },

  // SEO Settings CRUD
  getSeoSettings: async () => {
    return await getGenericKey("seoSettings");
  },

  saveSeoSettings: async (seoSettings) => {
    await saveGenericKey("seoSettings", seoSettings);
    return seoSettings;
  },

  // Maintenance Mode
  getMaintenanceMode: async () => {
    return await getGenericKey("maintenanceMode");
  },

  saveMaintenanceMode: async (mode) => {
    await saveGenericKey("maintenanceMode", mode);
    return mode;
  }
};
