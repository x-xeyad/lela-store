import React, { useState, useMemo } from "react";
import { Plus, History, Loader2, ArrowUpDown, ShieldAlert } from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import { erpService } from "../../services/erpService";
import toast from "react-hot-toast";

export const ErpInventory = ({ products, orders, purchases, movements, loadData, language = "en" }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: "",
    adjustmentQty: "", // positive or negative
    description: "",
    notes: ""
  });

  // Calculate detailed inventory metrics per product
  const inventoryMetrics = useMemo(() => {
    return products.map(prod => {
      const prodPurchases = purchases.filter(p => p.product_id === prod.id);
      const totalPurchased = prodPurchases.reduce((acc, p) => acc + (p.quantity || 0), 0);
      
      const prodMovements = movements.filter(m => m.product_id === prod.id);

      // Sourced/Sold quantities
      const completedOrders = orders.filter(o => o.status === "completed");
      let totalSold = 0;
      let lastSellingDate = null;
      completedOrders.forEach(o => {
        const item = (o.items || []).find(it => it.product?.id === prod.id);
        if (item) {
          totalSold += parseInt(item.quantity || 0, 10);
          if (!lastSellingDate || new Date(o.createdAt) > new Date(lastSellingDate)) {
            lastSellingDate = o.createdAt;
          }
        }
      });

      // Reserved quantities (pending/processing orders)
      const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "sourced");
      let reservedStock = 0;
      pendingOrders.forEach(o => {
        const item = (o.items || []).find(it => it.product?.id === prod.id);
        if (item) {
          reservedStock += parseInt(item.quantity || 0, 10);
        }
      });

      // Last purchase date
      const lastPurchase = prodPurchases.length > 0 
        ? prodPurchases.reduce((latest, p) => new Date(p.purchase_date) > new Date(latest.purchase_date) ? p : latest, prodPurchases[0])
        : null;

      const currentStock = prod.stock || 0;
      const availableStock = Math.max(0, currentStock - reservedStock);
      const purchaseCost = parseFloat(prod.purchase_cost || prod.costEGP || 0);
      const inventoryValuation = currentStock * purchaseCost;

      return {
        ...prod,
        currentStock,
        reservedStock,
        soldQuantity: totalSold,
        purchasedQuantity: totalPurchased,
        availableStock,
        inventoryValue: inventoryValuation,
        lastPurchaseDate: lastPurchase ? lastPurchase.purchase_date : null,
        lastSellingDate: lastSellingDate ? lastSellingDate.split("T")[0] : null,
        movements: prodMovements
      };
    });
  }, [products, orders, purchases, movements]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustmentForm.productId || !adjustmentForm.adjustmentQty) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const prod = products.find(p => p.id === adjustmentForm.productId);
      if (!prod) throw new Error("Product not found");

      const qtyChange = parseInt(adjustmentForm.adjustmentQty, 10);
      const newStock = Math.max(0, (prod.stock || 0) + qtyChange);

      // 1. Update stock in products table
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", prod.id);

      if (updateError) throw updateError;

      // 2. Log movement
      await erpService.addStockMovement({
        productId: prod.id,
        movementType: "manual_adjustment",
        quantity: qtyChange,
        description: adjustmentForm.description || "Manual stock count adjustment",
        referenceId: "MANUAL-" + Date.now()
      });

      toast.success("Inventory stock levels adjusted successfully!");
      setShowAdjustModal(false);
      setAdjustmentForm({
        productId: "",
        adjustmentQty: "",
        description: "",
        notes: ""
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to adjust stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Row */}
      <div className="flex justify-between items-center border-b border-primary/5 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
            {language === "ar" ? "إدارة المخزون والتعديل" : "Inventory Ledger & Movement"}
          </h3>
          <p className="text-[10px] text-brand-text/50 mt-1">
            Realtime valuations, reserve checks, and historical logs
          </p>
        </div>
        <button
          onClick={() => setShowAdjustModal(true)}
          className="px-4 py-2 rounded-xl border border-primary/20 text-primary dark:text-secondary text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/5 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Manual Adjustment
        </button>
      </div>

      {/* Grid of Main Ledger and Right Side Log Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3 - Main Stock Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-primary/10 text-brand-text/50 font-bold uppercase">
                  <th className="py-2.5">Product</th>
                  <th className="py-2.5 text-center">Stock</th>
                  <th className="py-2.5 text-center">Reserved</th>
                  <th className="py-2.5 text-center">Sold</th>
                  <th className="py-2.5 text-center">Purchased</th>
                  <th className="py-2.5 text-right">Valuation</th>
                  <th className="py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {inventoryMetrics.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedProduct(p)}
                    className={`border-b border-primary/5 hover:bg-brand-bg/10 cursor-pointer transition-colors ${selectedProduct?.id === p.id ? 'bg-primary/5 border-l-2 border-l-primary pl-2' : ''}`}
                  >
                    <td className="py-3 font-semibold text-brand-text dark:text-brand-dark-text max-w-[150px] truncate">
                      {p.name?.[language] || p.name?.en}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold font-english text-[10px] ${p.currentStock < 5 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {p.currentStock}
                      </span>
                    </td>
                    <td className="py-3 text-center font-english text-brand-text/60">{p.reservedStock}</td>
                    <td className="py-3 text-center font-english text-brand-text/60">{p.soldQuantity}</td>
                    <td className="py-3 text-center font-english text-brand-text/60">{p.purchasedQuantity}</td>
                    <td className="py-3 text-right font-bold font-english">{p.inventoryValue.toLocaleString()} EGP</td>
                    <td className="py-3 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(p);
                        }}
                        className="text-[9px] uppercase tracking-wider font-bold text-primary hover:underline cursor-pointer"
                      >
                        Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1/3 - Detailed Movement logs and parameters for chosen product */}
        <div className="p-5 rounded-2xl bg-brand-bg/5 dark:bg-brand-dark-card/25 border border-primary/5 space-y-5 h-[480px] flex flex-col">
          {selectedProduct ? (
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div>
                <h4 className="text-xs font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wide truncate">
                  {selectedProduct.name?.[language] || selectedProduct.name?.en}
                </h4>
                <span className="text-[9px] text-brand-text/40 block mt-0.5">Inventory Audit Trail</span>
              </div>

              {/* Stats Mini Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px] bg-brand-bg/10 p-3 rounded-xl border border-primary/5">
                <div>
                  <span className="text-brand-text/50 block">Last Purchased:</span>
                  <span className="font-bold font-english text-brand-text">{selectedProduct.lastPurchaseDate || "Never"}</span>
                </div>
                <div>
                  <span className="text-brand-text/50 block">Last Sold:</span>
                  <span className="font-bold font-english text-brand-text">{selectedProduct.lastSellingDate || "Never"}</span>
                </div>
                <div className="mt-1">
                  <span className="text-brand-text/50 block">Available (Unreserved):</span>
                  <span className="font-bold font-english text-green-500">{selectedProduct.availableStock} units</span>
                </div>
                <div className="mt-1">
                  <span className="text-brand-text/50 block">Unit Cost:</span>
                  <span className="font-bold font-english text-primary dark:text-secondary">{parseFloat(selectedProduct.purchase_cost || selectedProduct.costEGP || 0).toLocaleString()} EGP</span>
                </div>
              </div>

              {/* Chronological movements list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px]">
                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-text/50 block mb-1">Stock History Logs ({selectedProduct.movements.length})</span>
                {selectedProduct.movements.map(m => (
                  <div key={m.id} className="p-2.5 rounded-xl border border-primary/5 bg-brand-bg/20 flex flex-col space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        m.movement_type === 'purchase' ? 'bg-green-500/10 text-green-500' :
                        m.movement_type === 'sale' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {m.movement_type.replace("_", " ")}
                      </span>
                      <span className={`font-bold font-english ${m.quantity > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </div>
                    <p className="text-brand-text/70">{m.description}</p>
                    <span className="text-[7px] text-brand-text/40 font-english mt-0.5">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {selectedProduct.movements.length === 0 && (
                  <p className="text-xs text-brand-text/40 text-center py-10 italic">No movement logs registered for this product.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 text-brand-text/40">
              <History className="w-12 h-12 stroke-[1.2] text-brand-text/30" />
              <p className="text-xs font-light max-w-[180px]">Select a product from the list to view stock movement logs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                Manual Inventory Adjustment
              </h4>
              <button 
                onClick={() => setShowAdjustModal(false)}
                className="text-brand-text/50 hover:text-brand-text text-sm uppercase tracking-wider font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              {/* Product Selection */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Select Product *</label>
                <select
                  name="productId"
                  required
                  value={adjustmentForm.productId}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-medium"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name?.[language] || p.name?.en} (Current stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Quantity */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Adjustment Qty *</label>
                <input
                  type="number"
                  name="adjustmentQty"
                  required
                  placeholder="Use negative numbers for deductions (e.g. -5 or 10)"
                  value={adjustmentForm.adjustmentQty}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, adjustmentQty: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Reason / Description *</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="e.g. Stock count audit / Broken bottle damage"
                  value={adjustmentForm.description}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Actions */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Stock Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
