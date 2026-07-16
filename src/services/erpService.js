import { supabase } from "./supabaseClient";

export const erpService = {
  // --- TREASURY ---
  getTreasuryTransactions: async () => {
    try {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase getTreasuryTransactions warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getTreasuryTransactions:", e);
      return [];
    }
  },

  addTreasuryTransaction: async (transaction) => {
    try {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .insert([{
          transaction_type: transaction.transactionType,
          amount: parseFloat(transaction.amount),
          currency: transaction.currency || "EGP",
          exchange_rate: parseFloat(transaction.exchangeRate || 1.0),
          description: transaction.description || "",
          notes: transaction.notes || ""
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Exception in addTreasuryTransaction:", e);
      throw e;
    }
  },

  // --- SALES REPRESENTATIVES ---
  getRepresentatives: async () => {
    try {
      const { data, error } = await supabase
        .from("representatives")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase getRepresentatives warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getRepresentatives:", e);
      return [];
    }
  },

  saveRepresentative: async (rep) => {
    try {
      if (rep.id) {
        const { data, error } = await supabase
          .from("representatives")
          .update({
            name: rep.name,
            phone: rep.phone || "",
            city: rep.city || "",
            address: rep.address || "",
            notes: rep.notes || "",
            commission_type: rep.commissionType,
            commission_value: parseFloat(rep.commissionValue || 0)
          })
          .eq("id", rep.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("representatives")
          .insert([{
            name: rep.name,
            phone: rep.phone || "",
            city: rep.city || "",
            address: rep.address || "",
            notes: rep.notes || "",
            commission_type: rep.commissionType || "percentage",
            commission_value: parseFloat(rep.commissionValue || 0)
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.error("Exception in saveRepresentative:", e);
      throw e;
    }
  },

  deleteRepresentative: async (id) => {
    try {
      const { error } = await supabase
        .from("representatives")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Exception in deleteRepresentative:", e);
      throw e;
    }
  },

  getRepresentativePayments: async (repId) => {
    try {
      const { data, error } = await supabase
        .from("representative_payments")
        .select("*")
        .eq("representative_id", repId)
        .order("payment_date", { ascending: false });

      if (error) {
        console.warn("Supabase getRepresentativePayments warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getRepresentativePayments:", e);
      return [];
    }
  },

  addRepresentativePayment: async (payment) => {
    try {
      const { data, error } = await supabase
        .from("representative_payments")
        .insert([{
          representative_id: payment.representativeId,
          amount: parseFloat(payment.amount),
          payment_date: payment.paymentDate || new Date().toISOString().split("T")[0],
          payment_method: payment.paymentMethod || "Cash",
          notes: payment.notes || ""
        }])
        .select()
        .single();

      if (error) throw error;

      // Log cashout to treasury
      await erpService.addTreasuryTransaction({
        transactionType: "cash_out",
        amount: parseFloat(payment.amount),
        currency: "EGP",
        exchangeRate: 1.0,
        description: `Commission Payout: Sales Representative ID ${payment.representativeId}`,
        notes: payment.notes || ""
      });

      return data;
    } catch (e) {
      console.error("Exception in addRepresentativePayment:", e);
      throw e;
    }
  },

  // --- WHOLESALE CUSTOMERS ---
  getWholesalers: async () => {
    try {
      const { data, error } = await supabase
        .from("wholesalers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase getWholesalers warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getWholesalers:", e);
      return [];
    }
  },

  saveWholesaler: async (w) => {
    try {
      if (w.id) {
        const { data, error } = await supabase
          .from("wholesalers")
          .update({
            company_name: w.companyName,
            contact_person: w.contactPerson || "",
            phone: w.phone || "",
            email: w.email || "",
            address: w.address || "",
            tax_number: w.taxNumber || "",
            custom_discount: parseFloat(w.customDiscount || 0),
            credit_limit: parseFloat(w.creditLimit || 0),
            payment_terms: w.paymentTerms || "",
            price_list_id: w.priceListId || "",
            notes: w.notes || ""
          })
          .eq("id", w.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("wholesalers")
          .insert([{
            company_name: w.companyName,
            contact_person: w.contactPerson || "",
            phone: w.phone || "",
            email: w.email || "",
            address: w.address || "",
            tax_number: w.taxNumber || "",
            custom_discount: parseFloat(w.customDiscount || 0),
            credit_limit: parseFloat(w.creditLimit || 0),
            payment_terms: w.paymentTerms || "",
            price_list_id: w.priceListId || "",
            notes: w.notes || ""
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.error("Exception in saveWholesaler:", e);
      throw e;
    }
  },

  deleteWholesaler: async (id) => {
    try {
      const { error } = await supabase
        .from("wholesalers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Exception in deleteWholesaler:", e);
      throw e;
    }
  },

  getWholesalerPrices: async (wholesalerId) => {
    try {
      const { data, error } = await supabase
        .from("wholesaler_prices")
        .select("*")
        .eq("wholesaler_id", wholesalerId);

      if (error) {
        console.warn("Supabase getWholesalerPrices warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getWholesalerPrices:", e);
      return [];
    }
  },

  saveWholesalerPrice: async (wholesalerId, productId, specialPrice) => {
    try {
      const { data, error } = await supabase
        .from("wholesaler_prices")
        .upsert({
          wholesaler_id: wholesalerId,
          product_id: productId,
          special_price: parseFloat(specialPrice)
        }, { onConflict: "wholesaler_id,product_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Exception in saveWholesalerPrice:", e);
      throw e;
    }
  },

  // --- WHOLESALE INVOICES & PAYMENTS ---
  getWholesaleInvoices: async () => {
    try {
      const { data, error } = await supabase
        .from("wholesale_invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase getWholesaleInvoices warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getWholesaleInvoices:", e);
      return [];
    }
  },

  saveWholesaleInvoice: async (invoice) => {
    try {
      const { data, error } = await supabase
        .from("wholesale_invoices")
        .upsert(invoice)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Exception in saveWholesaleInvoice:", e);
      throw e;
    }
  },

  getWholesalePayments: async (wholesalerId) => {
    try {
      const { data, error } = await supabase
        .from("wholesale_payments")
        .select("*")
        .eq("wholesaler_id", wholesalerId)
        .order("payment_date", { ascending: false });

      if (error) {
        console.warn("Supabase getWholesalePayments warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getWholesalePayments:", e);
      return [];
    }
  },

  addWholesalePayment: async (payment) => {
    try {
      const { data, error } = await supabase
        .from("wholesale_payments")
        .insert([{
          wholesaler_id: payment.wholesalerId,
          invoice_id: payment.invoiceId || null,
          amount: parseFloat(payment.amount),
          payment_date: payment.paymentDate || new Date().toISOString().split("T")[0],
          payment_method: payment.paymentMethod || "Cash",
          notes: payment.notes || ""
        }])
        .select()
        .single();

      if (error) throw error;

      // Log cashin to treasury
      await erpService.addTreasuryTransaction({
        transactionType: "cash_in",
        amount: parseFloat(payment.amount),
        currency: "EGP",
        exchangeRate: 1.0,
        description: `Wholesale Payment: Customer ID ${payment.wholesalerId}`,
        notes: payment.notes || ""
      });

      return data;
    } catch (e) {
      console.error("Exception in addWholesalePayment:", e);
      throw e;
    }
  },

  // --- PRODUCT COST HISTORY ---
  getProductCostHistories: async () => {
    try {
      const { data, error } = await supabase
        .from("product_cost_history")
        .select("*")
        .order("purchase_date", { ascending: false });

      if (error) {
        console.warn("Supabase getProductCostHistories warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getProductCostHistories:", e);
      return [];
    }
  },

  // --- USER PROFILES / ROLES ---
  getProfiles: async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase getProfiles warning:", error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error("Exception in getProfiles:", e);
      return [];
    }
  },

  saveProfileRole: async (userId, role) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Exception in saveProfileRole:", e);
      throw e;
    }
  },

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

      // Log cashout to treasury
      await erpService.addTreasuryTransaction({
        transactionType: "cash_out",
        amount: parseFloat(payment.amount),
        currency: "EGP",
        exchangeRate: 1.0,
        description: `Supplier payment: Supplier ID ${payment.supplierId}`,
        notes: payment.notes || ""
      });

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
          product_id: purchase.productId || null,
          purchase_date: purchase.purchaseDate || new Date().toISOString().split("T")[0],
          quantity: parseInt(purchase.quantity, 10),
          purchase_cost: parseFloat(purchase.purchaseCost),
          shipping_cost: parseFloat(purchase.shippingCost || 0),
          weight: parseFloat(purchase.weight || 0),
          currency: purchase.currency || "EGP",
          notes: purchase.notes || "",
          product_name: purchase.productName || ""
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      const purchaseCostVal = parseFloat(purchase.purchaseCost);
      const totalBatchCost = (purchaseCostVal * parseInt(purchase.quantity, 10)) + parseFloat(purchase.shippingCost || 0);

      // Log cashout to treasury
      await erpService.addTreasuryTransaction({
        transactionType: "cash_out",
        amount: totalBatchCost,
        currency: purchase.currency || "EGP",
        exchangeRate: 1.0,
        description: `Supplier Purchase Sourced: Batch ID ${purchaseData.id}`,
        notes: purchase.notes || ""
      });

      // 2. If it is linked to a website product, update stock, cost history, and log movement
      if (purchase.productId) {
        const { data: product, error: productFetchError } = await supabase
          .from("products")
          .select("stock, cost_egp, packaging_cost, incoming_stock")
          .eq("id", purchase.productId)
          .single();

        if (!productFetchError && product) {
          const currentStock = parseInt(product.stock || 0, 10);
          const currentIncoming = parseInt(product.incoming_stock || 0, 10);
          const newStock = currentStock + parseInt(purchase.quantity, 10);
          const newIncoming = Math.max(0, currentIncoming - parseInt(purchase.quantity, 10));
          const packagingCost = parseFloat(product.packaging_cost || 0);
          
          const perItemShipping = parseFloat(purchase.quantity) > 0 
            ? parseFloat(purchase.shippingCost || 0) / parseFloat(purchase.quantity)
            : 0;

          const totalCost = purchaseCostVal + perItemShipping + packagingCost;

          // Update Product Stock and Cost columns in Database
          await supabase
            .from("products")
            .update({
              stock: newStock,
              incoming_stock: newIncoming,
              purchase_cost: purchaseCostVal,
              shipping_cost: perItemShipping,
              cost_egp: totalCost
            })
            .eq("id", purchase.productId);

          // Log Stock Movement
          await supabase
            .from("stock_movements")
            .insert([{
              product_id: purchase.productId,
              movement_type: "purchase",
              quantity: parseInt(purchase.quantity, 10),
              description: `Supplier purchase batch added. Qty: ${purchase.quantity}`,
              reference_id: String(purchaseData.id)
            }]);

          // Write to Product Cost History table
          await supabase
            .from("product_cost_history")
            .insert([{
              product_id: purchase.productId,
              purchase_cost: purchaseCostVal,
              packaging_cost: packagingCost,
              shipping_cost: perItemShipping,
              supplier_id: purchase.supplierId || null,
              purchase_date: purchase.purchaseDate || new Date().toISOString().split("T")[0],
              landed_cost: totalCost
            }]);
        }
      }

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
          movement_type: movement.movementType,
          quantity: parseInt(movement.quantity, 10),
          description: movement.description || "",
          reference_id: movement.referenceId || null,
          reason: movement.reason || null
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

        // Log cashout to treasury
        await erpService.addTreasuryTransaction({
          transactionType: "cash_out",
          amount: parseFloat(expense.amount),
          currency: "EGP",
          exchangeRate: 1.0,
          description: `Operating Expense: ${expense.category} - ${expense.description}`,
          notes: expense.notes || ""
        });

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
