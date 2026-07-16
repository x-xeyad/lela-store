import { supabase } from "./supabaseClient";

export const erpService = {
  // --- SUPPLIERS ---
  getSuppliers: async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase getSuppliers warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getSuppliers:", e);
      return [];
    }
  },

  saveSupplier: async (supplier) => {
    try {
      if (supplier.id) {
        const { data, error } = await supabase
          .from("suppliers")
          .update({
            name: supplier.name,
            phone: supplier.phone || "",
            email: supplier.email || "",
            country: supplier.country || "",
            address: supplier.address || "",
            notes: supplier.notes || ""
          })
          .eq("id", supplier.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("suppliers")
          .insert([{
            name: supplier.name,
            phone: supplier.phone || "",
            email: supplier.email || "",
            country: supplier.country || "",
            address: supplier.address || "",
            notes: supplier.notes || ""
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.error("Exception in saveSupplier:", e);
      throw e;
    }
  },

  deleteSupplier: async (id) => {
    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Exception in deleteSupplier:", e);
      throw e;
    }
  },

  // --- SUPPLIER PAYMENTS ---
  getSupplierPayments: async (supplierId) => {
    try {
      const { data, error } = await supabase
        .from("supplier_payments")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("payment_date", { ascending: false });

      if (error) {
        console.warn("Supabase getSupplierPayments warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getSupplierPayments:", e);
      return [];
    }
  },

  addSupplierPayment: async (payment) => {
    try {
      const { data, error } = await supabase
        .from("supplier_payments")
        .insert([{
          supplier_id: payment.supplierId,
          amount: parseFloat(payment.amount),
          payment_date: payment.paymentDate || new Date().toISOString().split("T")[0],
          payment_method: payment.paymentMethod || "Cash",
          notes: payment.notes || ""
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Exception in addSupplierPayment:", e);
      throw e;
    }
  },

  // --- PURCHASES ---
  getPurchases: async () => {
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("purchase_date", { ascending: false });

      if (error) {
        console.warn("Supabase getPurchases warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getPurchases:", e);
      return [];
    }
  },

  addPurchase: async (purchase) => {
    try {
      // 1. Insert Purchase Record
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .insert([{
          supplier_id: purchase.supplierId || null,
          product_id: purchase.productId,
          purchase_date: purchase.purchaseDate || new Date().toISOString().split("T")[0],
          quantity: parseInt(purchase.quantity, 10),
          purchase_cost: parseFloat(purchase.purchaseCost),
          shipping_cost: parseFloat(purchase.shippingCost || 0),
          weight: parseFloat(purchase.weight || 0),
          currency: purchase.currency || "EGP",
          notes: purchase.notes || ""
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // 2. Fetch current product details to calculate cost increases
      const { data: product, error: productFetchError } = await supabase
        .from("products")
        .select("stock, cost_egp, packaging_cost")
        .eq("id", purchase.productId)
        .single();

      if (productFetchError) throw productFetchError;

      const currentStock = parseInt(product.stock || 0, 10);
      const newStock = currentStock + parseInt(purchase.quantity, 10);
      const newPurchaseCost = parseFloat(purchase.purchaseCost); // Update product base purchase cost
      
      // Calculate dynamic average or update product database pricing columns
      const packagingCost = parseFloat(product.packaging_cost || 0);
      
      // Calculate individual shipping cost for this batch
      // (purchase.shippingCost is total shipping for this batch. Divide by quantity to get per item shipping cost)
      const perItemShipping = parseFloat(purchase.quantity) > 0 
        ? parseFloat(purchase.shippingCost || 0) / parseFloat(purchase.quantity)
        : 0;

      const totalCost = newPurchaseCost + perItemShipping + packagingCost;

      // 3. Update Product Stock and Cost columns in Database
      const { error: productUpdateError } = await supabase
        .from("products")
        .update({
          stock: newStock,
          purchase_cost: newPurchaseCost,
          shipping_cost: perItemShipping,
          cost_egp: totalCost // Compatibility with existing cost_egp column (represents total unit cost)
        })
        .eq("id", purchase.productId);

      if (productUpdateError) throw productUpdateError;

      // 4. Log Stock Movement
      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert([{
          product_id: purchase.productId,
          movement_type: "purchase",
          quantity: parseInt(purchase.quantity, 10),
          description: `Supplier purchase batch added. Qty: ${purchase.quantity}`,
          reference_id: purchaseData.id
        }]);

      if (movementError) throw movementError;

      return purchaseData;
    } catch (e) {
      console.error("Exception in addPurchase:", e);
      throw e;
    }
  },

  // --- STOCK MOVEMENTS ---
  getStockMovements: async () => {
    try {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase getStockMovements warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getStockMovements:", e);
      return [];
    }
  },

  addStockMovement: async (movement) => {
    try {
      const { data, error } = await supabase
        .from("stock_movements")
        .insert([{
          product_id: movement.productId,
          movement_type: movement.movementType, // 'purchase', 'sale', 'manual_adjustment', etc.
          quantity: parseInt(movement.quantity, 10),
          description: movement.description || "",
          reference_id: movement.referenceId || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Exception in addStockMovement:", e);
      throw e;
    }
  },

  // --- SHIPPING COMPANIES ---
  getShippingCompanies: async () => {
    try {
      const { data, error } = await supabase
        .from("shipping_companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase getShippingCompanies warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getShippingCompanies:", e);
      return [];
    }
  },

  saveShippingCompany: async (company) => {
    try {
      if (company.id) {
        const { data, error } = await supabase
          .from("shipping_companies")
          .update({
            company_name: company.companyName,
            country: company.country,
            city: company.city,
            cost_per_kg: parseFloat(company.costPerKg),
            fixed_fees: parseFloat(company.fixedFees || 0),
            extra_fees: parseFloat(company.extraFees || 0),
            date: company.date || new Date().toISOString().split("T")[0]
          })
          .eq("id", company.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("shipping_companies")
          .insert([{
            company_name: company.companyName,
            country: company.country,
            city: company.city,
            cost_per_kg: parseFloat(company.costPerKg),
            fixed_fees: parseFloat(company.fixedFees || 0),
            extra_fees: parseFloat(company.extraFees || 0),
            date: company.date || new Date().toISOString().split("T")[0]
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.error("Exception in saveShippingCompany:", e);
      throw e;
    }
  },

  deleteShippingCompany: async (id) => {
    try {
      const { error } = await supabase
        .from("shipping_companies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Exception in deleteShippingCompany:", e);
      throw e;
    }
  },

  // --- EXPENSES ---
  getExpenses: async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.warn("Supabase getExpenses warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getExpenses:", e);
      return [];
    }
  },

  saveExpense: async (expense) => {
    try {
      if (expense.id) {
        const { data, error } = await supabase
          .from("expenses")
          .update({
            category: expense.category,
            amount: parseFloat(expense.amount),
            date: expense.date || new Date().toISOString().split("T")[0],
            description: expense.description || "",
            notes: expense.notes || ""
          })
          .eq("id", expense.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("expenses")
          .insert([{
            category: expense.category,
            amount: parseFloat(expense.amount),
            date: expense.date || new Date().toISOString().split("T")[0],
            description: expense.description || "",
            notes: expense.notes || ""
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.error("Exception in saveExpense:", e);
      throw e;
    }
  },

  deleteExpense: async (id) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Exception in deleteExpense:", e);
      throw e;
    }
  }
};
