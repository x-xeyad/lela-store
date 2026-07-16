import React, { useState, useMemo, useEffect } from "react";
import { Plus, History, Loader2, ArrowUpDown, ShieldAlert, BarChart2, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import { erpService } from "../../services/erpService";
import toast from "react-hot-toast";

export const ErpInventory = ({ products, orders, purchases, movements, loadData, language = "en" }) => {
  const [activeSubTab, setActiveSubTab] = useState("ledger"); // ledger, adjustment, cost_history, analytics
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [costHistories, setCostHistories] = useState([]);
  const [loadingCosts, setLoadingCosts] = useState(false);

  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: "",
    adjustmentQty: "", // positive or negative
    reason: "correction", // damaged, lost, correction, gift, internal_use, returned
    description: "",
    notes: ""
  });

  useEffect(() => {
    loadCostHistories();
  }, []);

  const loadCostHistories = async () => {
    setLoadingCosts(true);
    try {
      const costs = await erpService.getProductCostHistories();
      setCostHistories(costs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCosts(false);
    }
  };

  // Calculate detailed inventory metrics & analytics per product
  const inventoryMetrics = useMemo(() => {
    return products.map(prod => {
      const prodPurchases = purchases.filter(p => p.product_id === prod.id);
      const totalPurchased = prodPurchases.reduce((acc, p) => acc + (p.quantity || 0), 0);
      
      const prodMovements = movements.filter(m => m.product_id === prod.id);

      // Completed Sales
      const completedOrders = orders.filter(o => o.status === "completed");
      let totalSold = 0;
      let totalRevenue = 0;
      let lastSellingDate = null;
      completedOrders.forEach(o => {
        const item = (o.items || []).find(it => it.product?.id === prod.id);
        if (item) {
          const qty = parseInt(item.quantity || 0, 10);
          totalSold += qty;
          totalRevenue += (parseFloat(item.priceEGP || item.price || 0) * qty);
          if (!lastSellingDate || new Date(o.createdAt) > new Date(lastSellingDate)) {
            lastSellingDate = o.createdAt;
          }
        }
      });

      // Reserved quantities (pending/sourcing/transit orders)
      const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "sourced" || o.status === "in_transit");
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
      const purchaseCost = parseFloat(prod.purchaseCost || prod.costEGP || 0);
      const inventoryValuation = currentStock * purchaseCost;

      // Analytics Calculations
      const avgCost = prodPurchases.length > 0 
        ? prodPurchases.reduce((acc, p) => acc + parseFloat(p.purchase_cost || 0), 0) / prodPurchases.length 
        : purchaseCost;

      const avgSellingPrice = totalSold > 0 ? totalRevenue / totalSold : parseFloat(prod.priceEGP || 0);
      const totalCostOfGoodsSold = totalSold * avgCost;
      const profit = totalRevenue - totalCostOfGoodsSold;
      
      // Stock turnover ratio: COGS / Average Inventory Value
      const avgInventoryValue = Math.max(1, inventoryValuation); 
      const stockTurnover = totalCostOfGoodsSold / avgInventoryValue;

      return {
        ...prod,
        currentStock,
        reservedStock,
        incomingStock: prod.incoming_stock || 0,
        damagedStock: prod.damaged_stock || 0,
        returnedStock: prod.returned_stock || 0,
        soldQuantity: totalSold,
        purchasedQuantity: totalPurchased,
        availableStock,
        inventoryValue: inventoryValuation,
        lastPurchaseDate: lastPurchase ? lastPurchase.purchase_date : null,
        lastSellingDate: lastSellingDate ? lastSellingDate.split("T")[0] : null,
        movements: prodMovements,
        avgCost,
        avgSellingPrice,
        profit,
        stockTurnover
      };
    });
  }, [products, orders, purchases, movements]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustmentForm.productId || !adjustmentForm.adjustmentQty) {
      toast.error("Please select a product and adjust quantity.");
      return;
    }

    setLoading(true);
    try {
      const prod = products.find(p => p.id === adjustmentForm.productId);
      if (!prod) throw new Error("Product not found");

      const qtyChange = parseInt(adjustmentForm.adjustmentQty, 10);
      let newStock = prod.stock || 0;
      let newDamaged = prod.damaged_stock || 0;
      let newReturned = prod.returned_stock || 0;

      // Adjust appropriate stock bucket depending on reason
      if (adjustmentForm.reason === "damaged") {
        newDamaged += Math.abs(qtyChange);
        newStock = Math.max(0, newStock - Math.abs(qtyChange));
      } else if (adjustmentForm.reason === "returned") {
        newReturned += Math.abs(qtyChange);
        newStock += Math.abs(qtyChange);
      } else {
        newStock = Math.max(0, newStock + qtyChange);
      }

      // 1. Update stock in products table
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          stock: newStock,
          damaged_stock: newDamaged,
          returned_stock: newReturned
        })
        .eq("id", prod.id);

      if (updateError) throw updateError;

      // 2. Log stock movement
      await erpService.addStockMovement({
        productId: prod.id,
        movementType: "manual_adjustment",
        quantity: qtyChange,
        description: `Manual adjustment: [Reason: ${adjustmentForm.reason}] ${adjustmentForm.description}`,
        referenceId: "MANUAL-" + Date.now(),
        reason: adjustmentForm.reason
      });

      toast.success("Inventory stock levels adjusted successfully!");
      setShowAdjustModal(false);
      setAdjustmentForm({
        productId: "",
        adjustmentQty: "",
        reason: "correction",
        description: "",
        notes: ""
      });
      loadCostHistories();
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to adjust stock.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProductMetrics = useMemo(() => {
    if (!selectedProduct) return null;
    return inventoryMetrics.find(p => p.id === selectedProduct.id);
  }, [selectedProduct, inventoryMetrics]);

  return (
    <div className="space-y-6 font-sans">
      {/* Sub-tabs header */}
      <div className="flex justify-between items-center border-b border-primary/5 pb-4">
        <div className="flex bg-brand-bg/15 p-0.5 rounded-lg border border-primary/5">
          {["ledger", "cost_history", "analytics"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                activeSubTab === tab ? "bg-primary text-white shadow-xs" : "text-brand-text/50 hover:text-brand-text"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdjustModal(true)}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md shadow-primary/10"
        >
          <Plus className="w-4 h-4" />
          Log Manual Adjustment
        </button>
      </div>

      {activeSubTab === "ledger" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stock Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="overflow-x-auto bg-brand-card dark:bg-brand-dark-card border border-primary/5 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-primary/5 bg-brand-bg/25 text-brand-text/50 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">Available</th>
                    <th className="p-3 text-center">Reserved</th>
                    <th className="p-3 text-center">Incoming</th>
                    <th className="p-3 text-center">Damaged</th>
                    <th className="p-3 text-right">Landed Cost</th>
                    <th className="p-3 text-right">Valuation</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryMetrics.map(p => (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedProduct(p)}
                      className={`border-b border-primary/5 hover:bg-brand-bg/10 cursor-pointer transition-colors ${selectedProduct?.id === p.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                    >
                      <td className="p-3 font-semibold text-primary dark:text-secondary truncate max-w-[150px]">
                        {p.name?.[language] || p.name?.en}
                      </td>
                      <td className="p-3 text-center font-bold font-english">
                        <span className={`px-2 py-0.5 rounded ${p.availableStock < 5 ? 'bg-red-500/10 text-red-500 font-extrabold animate-pulse' : 'text-brand-text'}`}>
                          {p.availableStock}
                        </span>
                      </td>
                      <td className="p-3 text-center font-english text-brand-text/60">{p.reservedStock}</td>
                      <td className="p-3 text-center font-english text-brand-text/60">{p.incomingStock}</td>
                      <td className="p-3 text-center font-english text-red-500">{p.damagedStock}</td>
                      <td className="p-3 text-right font-english text-brand-text/75">{(p.purchaseCost || p.costEGP || 0).toLocaleString()} EGP</td>
                      <td className="p-3 text-right font-bold font-english">{p.inventoryValue.toLocaleString()} EGP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right side Log details */}
          <div className="p-5 rounded-2xl bg-brand-bg/5 border border-primary/5 space-y-5 h-[480px] flex flex-col justify-between">
            {selectedProductMetrics ? (
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden text-[10px]">
                <div>
                  <h4 className="text-xs font-bold text-brand-text uppercase truncate max-w-[180px]">{selectedProductMetrics.name?.[language] || selectedProductMetrics.name?.en}</h4>
                  <span className="text-[9px] text-brand-text/40 block mt-0.5">Inventory Audit Trail</span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-brand-bg/10 p-3 rounded-xl border border-primary/5">
                  <div>
                    <span className="text-brand-text/50 block">Last Purchased:</span>
                    <span className="font-bold font-english">{selectedProductMetrics.lastPurchaseDate || "Never"}</span>
                  </div>
                  <div>
                    <span className="text-brand-text/50 block">Last Sold:</span>
                    <span className="font-bold font-english">{selectedProductMetrics.lastSellingDate || "Never"}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-brand-text/50 block">Current stock:</span>
                    <span className="font-bold font-english">{selectedProductMetrics.currentStock} units</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-brand-text/50 block">Returned stock:</span>
                    <span className="font-bold font-english text-green-500">{selectedProductMetrics.returnedStock} units</span>
                  </div>
                </div>

                {/* Movements list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px]">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-brand-text/50 block mb-1">Stock History Logs</span>
                  {selectedProductMetrics.movements.map(m => (
                    <div key={m.id} className="p-2.5 rounded-xl border border-primary/5 bg-brand-bg/25 flex flex-col space-y-1">
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
                      <p className="text-brand-text/75">{m.description}</p>
                      <span className="text-[7px] text-brand-text/45 font-english mt-0.5">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                  {selectedProductMetrics.movements.length === 0 && (
                    <p className="text-xs text-brand-text/40 text-center py-8 italic">No stock movements.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 text-brand-text/40">
                <History className="w-12 h-12 stroke-[1.2] text-brand-text/30" />
                <p className="text-xs font-light max-w-[180px]">Select a product to audit movements.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "cost_history" && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text/60">Product Costing History Audit Trail</h4>
          <div className="overflow-x-auto bg-brand-card dark:bg-brand-dark-card border border-primary/5 rounded-2xl text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-primary/5 bg-brand-bg/25 text-brand-text/50 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3 text-right">Base Purchase Cost</th>
                  <th className="p-3 text-right">Packaging Cost</th>
                  <th className="p-3 text-right">Sourcing Shipping</th>
                  <th className="p-3 text-right">Final Landed Cost</th>
                </tr>
              </thead>
              <tbody>
                {costHistories.map(ch => {
                  const prod = products.find(p => p.id === ch.product_id);
                  return (
                    <tr key={ch.id} className="border-b border-primary/5 hover:bg-brand-bg/5 transition-colors">
                      <td className="p-3 font-semibold text-primary">{prod ? prod.name?.en : "Deleted Product"}</td>
                      <td className="p-3 font-english text-brand-text/65">{ch.purchase_date}</td>
                      <td className="p-3 text-right font-english">{parseFloat(ch.purchase_cost).toLocaleString()} EGP</td>
                      <td className="p-3 text-right font-english">{parseFloat(ch.packaging_cost).toLocaleString()} EGP</td>
                      <td className="p-3 text-right font-english">{parseFloat(ch.shipping_cost).toLocaleString()} EGP</td>
                      <td className="p-3 text-right font-bold font-english text-green-500">{parseFloat(ch.landed_cost).toLocaleString()} EGP</td>
                    </tr>
                  );
                })}
                {costHistories.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-brand-text/40 font-light italic">
                      No historical cost records captured. Add supplier purchases to seed cost entries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "analytics" && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text/60">B2B & Retail Product Analytics Dashboard</h4>
          <div className="overflow-x-auto bg-brand-card dark:bg-brand-dark-card border border-primary/5 rounded-2xl text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-primary/5 bg-brand-bg/25 text-brand-text/50 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">Product Item</th>
                  <th className="p-3 text-center">Total Sales</th>
                  <th className="p-3 text-right">Avg Unit Cost</th>
                  <th className="p-3 text-right">Avg Selling Price</th>
                  <th className="p-3 text-right">Net Profit</th>
                  <th className="p-3 text-center">Stock Turnover</th>
                  <th className="p-3 text-right">Inventory Value</th>
                </tr>
              </thead>
              <tbody>
                {inventoryMetrics.map(p => (
                  <tr key={p.id} className="border-b border-primary/5 hover:bg-brand-bg/5 transition-colors">
                    <td className="p-3 font-semibold text-primary">{p.name?.en}</td>
                    <td className="p-3 text-center font-english">{p.soldQuantity} units</td>
                    <td className="p-3 text-right font-english">{p.avgCost.toFixed(2)} EGP</td>
                    <td className="p-3 text-right font-english">{p.avgSellingPrice.toFixed(2)} EGP</td>
                    <td className={`p-3 text-right font-bold font-english ${p.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {p.profit.toLocaleString()} EGP
                    </td>
                    <td className="p-3 text-center font-english font-medium text-brand-text/75">{p.stockTurnover.toFixed(2)}x</td>
                    <td className="p-3 text-right font-bold font-english">{p.inventoryValue.toLocaleString()} EGP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Adjustment Dialog */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">Manual Stock Adjustment</h4>
              <button onClick={() => setShowAdjustModal(false)} className="text-brand-text/50 hover:text-brand-text text-sm font-semibold uppercase cursor-pointer">Close</button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Select Website Product *</label>
                <select
                  required
                  value={adjustmentForm.productId}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-medium"
                >
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name?.en} (Current stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Adjustment Qty *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. -3 or 5"
                    value={adjustmentForm.adjustmentQty}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, adjustmentQty: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Adjustment Reason</label>
                  <select
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-medium"
                  >
                    <option value="correction">Correction / Count Audit</option>
                    <option value="damaged">Damaged Stock</option>
                    <option value="lost">Lost / Misplaced</option>
                    <option value="gift">Gift / Promotional Handout</option>
                    <option value="internal_use">Internal Office Use</option>
                    <option value="returned">Customer Returned</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Audit Notes / Reason Description *</label>
                <input
                  type="text"
                  required
                  placeholder="Notes about count discrepancy or damage..."
                  value={adjustmentForm.description}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Execute Stock Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
