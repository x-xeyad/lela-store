import React, { useState } from "react";
import { Plus, Check, Loader2, ArrowLeft } from "lucide-react";
import { erpService } from "../../services/erpService";
import toast from "react-hot-toast";

export const ErpPurchases = ({ products, suppliers, purchases, loadData, language = "en" }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    supplierId: "",
    productId: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    quantity: "",
    purchaseCost: "",
    shippingCost: "",
    weight: "",
    currency: "EGP",
    notes: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.quantity || !form.purchaseCost) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await erpService.addPurchase(form);
      toast.success("Purchase recorded and inventory updated successfully!");
      setShowAddModal(false);
      setForm({
        supplierId: "",
        productId: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        quantity: "",
        purchaseCost: "",
        shippingCost: "",
        weight: "",
        currency: "EGP",
        notes: ""
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to record purchase.");
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
            {language === "ar" ? "المشتريات وتوريد المخزون" : "Supplier Purchases Ledger"}
          </h3>
          <p className="text-[10px] text-brand-text/50 mt-1">
            Increase product stock and update cost metrics automatically
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Purchase
        </button>
      </div>

      {/* Purchases List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-primary/10 text-brand-text/50 font-bold uppercase">
              <th className="py-2.5">Date</th>
              <th className="py-2.5">Product</th>
              <th className="py-2.5">Supplier</th>
              <th className="py-2.5 text-center">Quantity</th>
              <th className="py-2.5 text-right">Cost (Unit)</th>
              <th className="py-2.5 text-right">Shipping Cost</th>
              <th className="py-2.5 text-right">Total Cost</th>
              <th className="py-2.5">Notes</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => {
              const prod = products.find(pr => pr.id === p.product_id) || {};
              const supplier = suppliers.find(s => s.id === p.supplier_id) || {};
              const totalCost = (parseFloat(p.purchase_cost) * parseInt(p.quantity, 10)) + parseFloat(p.shipping_cost || 0);

              return (
                <tr key={p.id} className="border-b border-primary/5 hover:bg-brand-bg/10">
                  <td className="py-3 font-english font-medium whitespace-nowrap">{p.purchase_date}</td>
                  <td className="py-3 font-semibold text-primary dark:text-secondary">
                    {prod.name?.[language] || prod.name?.en || "Unknown Product"}
                  </td>
                  <td className="py-3 font-medium">{supplier.name || "None / Direct"}</td>
                  <td className="py-3 text-center font-bold font-english">{p.quantity} units</td>
                  <td className="py-3 text-right font-english">{parseFloat(p.purchase_cost).toLocaleString()} EGP</td>
                  <td className="py-3 text-right font-english">{parseFloat(p.shipping_cost || 0).toLocaleString()} EGP</td>
                  <td className="py-3 text-right font-bold font-english">{totalCost.toLocaleString()} EGP</td>
                  <td className="py-3 text-brand-text/50 italic max-w-xs truncate">{p.notes || "-"}</td>
                </tr>
              );
            })}
            {purchases.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-brand-text/40 font-light">
                  No purchases recorded in history. Click 'Add Purchase' to import stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                Record New Supplier Purchase
              </h4>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-brand-text/50 hover:text-brand-text text-sm uppercase tracking-wider font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Product Selection */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Product *</label>
                <select
                  name="productId"
                  required
                  value={form.productId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-medium"
                >
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name?.[language] || p.name?.en} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Supplier Selection */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Supplier</label>
                  <select
                    name="supplierId"
                    value={form.supplierId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="">-- Direct Purchase (No Supplier) --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Purchase Date */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Purchase Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    required
                    value={form.purchaseDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Quantity */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={form.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>

                {/* Unit Purchase Cost */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Unit Cost (EGP) *</label>
                  <input
                    type="number"
                    name="purchaseCost"
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 150"
                    value={form.purchaseCost}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>

                {/* Total Shipping Cost */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Batch Shipping (EGP)</label>
                  <input
                    type="number"
                    name="shippingCost"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 400"
                    value={form.shippingCost}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Weight */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Total Weight (KG)</label>
                  <input
                    type="number"
                    name="weight"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 15.5"
                    value={form.weight}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Currency</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="EGP">Egyptian Pound (EGP)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="SAR">Saudi Riyal (SAR)</option>
                    <option value="YER">Yemeni Rial (YER)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Purchase details, batch numbers, invoice reference..."
                  value={form.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Actions */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm Purchase
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
