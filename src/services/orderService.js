import { supabase, isSupabaseConfigured } from "./supabaseClient";

const ORDERS_KEY = "lela_orders";

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

const initOrders = () => {
  const existing = localStorage.getItem(ORDERS_KEY);
  if (!existing) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
    return [];
  }
  try {
    return JSON.parse(existing);
  } catch (e) {
    return [];
  }
};

export const orderService = {
  getAll: async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          console.error("Supabase orders error:", error);
        } else if (data) {
          return data.map(mapOrderFromDb);
        }
      } catch (err) {
        console.error("Supabase orders connection issue:", err);
      }
    }
    return initOrders();
  },

  getById: async (id) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .single();
        if (error) {
          console.error("Supabase getOrderById error:", error);
        } else if (data) {
          return mapOrderFromDb(data);
        }
      } catch (err) {
        console.error("Supabase getOrderById connection issue:", err);
      }
    }
    const orders = initOrders();
    return orders.find(o => o.id === id) || null;
  },

  create: async (orderData) => {
    const newOrder = {
      ...orderData,
      id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
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
      } catch (err) {
        console.error("Supabase order create exception:", err);
      }
    }

    const orders = initOrders();
    orders.unshift(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
  },

  updateStatus: async (id, status) => {
    if (isSupabaseConfigured) {
      try {
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
      } catch (err) {
        console.error("Supabase order status update exception:", err);
      }
    }

    const orders = initOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error("Order not found");
    orders[idx].status = status;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return orders[idx];
  },

  delete: async (id) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("orders")
          .delete()
          .eq("id", id);
        if (error) {
          console.error("Supabase delete order error:", error);
          throw error;
        }
        return true;
      } catch (err) {
        console.error("Supabase delete order exception:", err);
      }
    }
    const orders = initOrders();
    const filtered = orders.filter(o => o.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
    return true;
  }
};
