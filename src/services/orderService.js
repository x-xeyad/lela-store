import { supabase } from "./supabaseClient";

const mapOrderFromDb = (o) => {
  if (!o) return null;
  return {
    id: o.id,
    customer: o.customer || { name: "", phone: "", governorate: "", address: "" },
    items: o.items || [],
    totalEGP: parseFloat(o.total_egp !== undefined ? o.total_egp : o.totalEGP || 0),
    totalYER: parseFloat(o.total_yer !== undefined ? o.total_yer : o.totalYER || 0),
    selectedCurrency: o.selected_currency || o.selectedCurrency || "YER",
    exchangeRate: parseFloat(o.exchange_rate !== undefined ? o.exchange_rate : o.exchangeRate || 11.5),
    status: o.status || "pending",
    couponCode: o.coupon_code || o.couponCode || "",
    discountAmount: parseFloat(o.discount_amount !== undefined ? o.discount_amount : o.discountAmount || 0),
    createdAt: o.created_at || o.createdAt
  };
};

const mapOrderToDb = (o) => {
  if (!o) return null;
  return {
    id: o.id,
    customer: o.customer,
    items: o.items,
    total_egp: o.totalEGP,
    total_yer: o.totalYER,
    selected_currency: o.selectedCurrency,
    exchange_rate: o.exchangeRate,
    status: o.status,
    coupon_code: o.couponCode || null,
    discount_amount: o.discountAmount || 0,
    created_at: o.createdAt
  };
};

export const orderService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Supabase orders error:", error);
      throw error;
    }
    return (data || []).map(mapOrderFromDb);
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      console.error("Supabase getOrderById error:", error);
      throw error;
    }
    return mapOrderFromDb(data);
  },

  create: async (orderData) => {
    const newOrder = {
      ...orderData,
      id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const dbPayload = mapOrderToDb(newOrder);
    const { data, error } = await supabase
      .from("orders")
      .insert([dbPayload])
      .select()
      .single();
      
    if (error) {
      console.error("Supabase order creation error:", error);
      throw error;
    }
    return mapOrderFromDb(data);
  },

  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      console.error("Supabase order status update error:", error);
      throw error;
    }
    return mapOrderFromDb(data);
  },

  delete: async (id) => {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("Supabase delete order error:", error);
      throw error;
    }
    return true;
  }
};
