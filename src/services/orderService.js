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
      const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
      
      // Calculate order shipping cost from shipping_companies table
      let calculatedShippingEGP = 0;
      try {
        const customerGov = (orderData.customer?.governorate || "sanaa").toLowerCase();
        // Fetch shipping companies
        const { data: carriers } = await supabase
          .from("shipping_companies")
          .select("*");
        
        // Find carrier matching customer city
        const carrier = (carriers || []).find(
          c => c.city.toLowerCase() === customerGov || customerGov.includes(c.city.toLowerCase())
        );

        const totalWeight = (orderData.items || []).reduce(
          (acc, item) => acc + (parseFloat(item.product?.weight || 0.5) * parseInt(item.quantity || 1, 10)),
          0
        );

        if (carrier) {
          calculatedShippingEGP = (totalWeight * parseFloat(carrier.cost_per_kg)) + parseFloat(carrier.fixed_fees || 0) + parseFloat(carrier.extra_fees || 0);
        } else {
          // Fallback to storefront default rate
          const isPersonal = (orderData.items || []).some(item => item.product?.category === "Personal Care");
          const defaultRatePerKg = isPersonal ? 450 : 300;
          calculatedShippingEGP = totalWeight * defaultRatePerKg;
        }
      } catch (err) {
        console.warn("Failed to automatically calculate ERP shipping cost:", err);
      }

      const newOrder = {
        ...orderData,
        id: orderId,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      const dbPayload = mapOrderToDb(newOrder);
      dbPayload.shipping_cost_egp = calculatedShippingEGP; // Store on order

      const { data, error } = await supabase
        .from("orders")
        .insert([dbPayload])
        .select()
        .single();
        
      if (error) {
        console.error("Supabase order creation error:", error.message);
        throw error;
      }

      // Deduct inventory and log movements for each item
      for (const item of (orderData.items || [])) {
        try {
          const productId = item.product?.id;
          const qty = parseInt(item.quantity || 1, 10);
          if (productId) {
            // Fetch current stock
            const { data: prodData } = await supabase
              .from("products")
              .select("stock")
              .eq("id", productId)
              .single();
            
            const currentStock = parseInt(prodData?.stock || 0, 10);
            const newStock = Math.max(0, currentStock - qty);

            // Update product stock
            await supabase
              .from("products")
              .update({ stock: newStock })
              .eq("id", productId);

            // Log stock movement
            await supabase
              .from("stock_movements")
              .insert([{
                product_id: productId,
                movement_type: "sale",
                quantity: -qty, // negative for sale
                description: `Storefront order checkout. Order ID: ${orderId}`,
                reference_id: orderId
              }]);
          }
        } catch (itemErr) {
          console.warn("Failed to update inventory for order item:", itemErr);
        }
      }

      return mapOrderFromDb(data);
    } catch (e) {
      console.error("Exception in create order:", e);
      throw e;
    }
  },

  updateStatus: async (id, status) => {
    try {
      // Get current order status before updating to check if we are transitioning to cancelled
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("status, items")
        .eq("id", id)
        .single();

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

      // If transition to cancelled: return stock
      if (status === "cancelled" && currentOrder && currentOrder.status !== "cancelled") {
        const items = currentOrder.items || [];
        for (const item of items) {
          try {
            const productId = item.product?.id;
            const qty = parseInt(item.quantity || 1, 10);
            if (productId) {
              const { data: prodData } = await supabase
                .from("products")
                .select("stock")
                .eq("id", productId)
                .single();
              
              const currentStock = parseInt(prodData?.stock || 0, 10);
              const newStock = currentStock + qty;

              // Restore stock
              await supabase
                .from("products")
                .update({ stock: newStock })
                .eq("id", productId);

              // Log stock movement
              await supabase
                .from("stock_movements")
                .insert([{
                  product_id: productId,
                  movement_type: "order_cancelled",
                  quantity: qty,
                  description: `Order cancelled. Returned to stock. Order ID: ${id}`,
                  reference_id: id
                }]);
            }
          } catch (restoreErr) {
            console.warn("Failed to restore stock for cancelled order:", restoreErr);
          }
        }
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
