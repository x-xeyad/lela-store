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
  const totalEGP = o.totalEGP || 0;
  const exchangeRate = o.exchangeRate || 11.5;
  const totalYER = o.totalYER !== undefined && o.totalYER !== null ? o.totalYER : (totalEGP * exchangeRate);

  return {
    id: o.id,
    customer: o.customer,
    items: o.items,
    total_egp: totalEGP,
    total_yer: totalYER,
    selected_currency: o.selectedCurrency || "YER",
    exchange_rate: exchangeRate,
    status: o.status || "pending",
    coupon_code: o.couponCode || null,
    discount_amount: o.discountAmount || 0,
    created_at: o.createdAt
  };
};

export const orderService = {
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        console.warn("Supabase orders load warning:", error.message);
        return [];
      }
      return (data || []).map(mapOrderFromDb);
    } catch (e) {
      console.warn("Exception in getAll orders:", e);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) {
        console.warn(`Supabase getOrderById warning for id "${id}":`, error.message);
        return null;
      }
      return mapOrderFromDb(data);
    } catch (e) {
      console.warn(`Exception in getOrderById for id "${id}":`, e);
      return null;
    }
  },

  create: async (orderData) => {
    try {
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
        console.error("Supabase order creation error:", error.message);
        throw error;
      }
      return mapOrderFromDb(data);
    } catch (e) {
      console.error("Exception in create order:", e);
      throw e;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
        
      if (error) {
        console.error(`Supabase order status update error for id "${id}":`, error.message);
        throw error;
      }
      return mapOrderFromDb(data);
    } catch (e) {
      console.error(`Exception in updateStatus order for id "${id}":`, e);
      throw e;
    }
  },

  delete: async (id) => {
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);
        
      if (error) {
        console.error(`Supabase delete order error for id "${id}":`, error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error(`Exception in delete order for id "${id}":`, e);
      throw e;
    }
  }
};
