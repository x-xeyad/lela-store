import React, { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Check, Loader2, ArrowLeftRight, Landmark } from "lucide-react";
import { erpService } from "../../services/erpService";
import toast from "react-hot-toast";

export const ErpSuppliers = ({ suppliers, purchases, loadData, language = "en" }) => {
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // Supplier payments ledger
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    country: "Egypt",
    address: "",
    notes: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    notes: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone || "",
      email: supplier.email || "",
      country: supplier.country || "Egypt",
      address: supplier.address || "",
      notes: supplier.notes || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this supplier? All linked payments will be removed.")) {
      try {
        await erpService.deleteSupplier(id);
        toast.success("Supplier deleted successfully.");
        loadData();
      } catch (err) {
        toast.error("Failed to delete supplier profile.");
      }
    }
  };

  const loadSupplierLedger = async (supplier) => {
    setSelectedSupplier(supplier);
    setLoadingPayments(true);
    try {
      const payments = await erpService.getSupplierPayments(supplier.id);
      setSupplierPayments(payments || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load supplier payments ledger.");
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Supplier name is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        id: editingSupplier ? editingSupplier.id : undefined
      };
      await erpService.saveSupplier(payload);
      toast.success(editingSupplier ? "Supplier updated!" : "Supplier created!");
      setShowModal(false);
      setEditingSupplier(null);
      setForm({
        name: "",
        phone: "",
        email: "",
        country: "Egypt",
        address: "",
        notes: ""
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save supplier details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !selectedSupplier) {
      toast.error("Payment amount is required.");
      return;
    }

    setLoading(true);
    try {
      await erpService.addSupplierPayment({
        ...paymentForm,
        supplierId: selectedSupplier.id
      });
      toast.success("Payment recorded and ledger updated!");
      setShowPaymentModal(false);
      setPaymentForm({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Cash",
        notes: ""
      });
      // Refresh payments ledger
      loadSupplierLedger(selectedSupplier);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to record supplier payment.");
    } finally {
      setLoading(false);
    }
  };

  // Compile calculations for each supplier
  const supplierMetrics = useMemo(() => {
    return suppliers.map(s => {
      const supplierPurchases = purchases.filter(p => p.supplier_id === s.id);
      
      // Total Purchases value (EGP)
      const totalPurchasesCost = supplierPurchases.reduce((acc, p) => acc + (parseFloat(p.purchase_cost) * parseInt(p.quantity, 10)) + parseFloat(p.shipping_cost || 0), 0);
      
      // Calculate outstanding balance. Fetch payments asynchronously, but we can compute it on supplier selections,
      // or track it via supplier_payments table if loaded. Since we want outstanding balance displayed instantly,
      // let's dynamically load payments or fetch supplier payments totals.
      // Wait, we can sum payments. We need to sum them. How?
      // Since we want to display it instantly in the table, we can load all payments from the DB on mount!
      // But wait! Instead of complicating, let's look at a simpler, highly efficient client calculation:
      // If we query payments on mount, we can sum them easily. Let's do that! We can add getSupplierPayments() inside mount.
      // Wait! Let's fetch the payments for all suppliers on load, or dynamically update it.
      // Let's make sure our state handles it. We can add a simple load payments logic.
      // Or we can let each supplier record payment which directly tracks ledger.
      
      return {
        ...s,
        totalPurchasesCost,
        purchaseCount: supplierPurchases.length
      };
    });
  }, [suppliers, purchases]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Row */}
      <div className="flex justify-between items-center border-b border-primary/5 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
            {language === "ar" ? "إدارة الموردين وحساباتهم" : "Suppliers Directory & Ledgers"}
          </h3>
          <p className="text-[10px] text-brand-text/50 mt-1">
            Manage contacts, log invoices, and reconcile payment terms
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Suppliers Directory Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-primary/10 text-brand-text/50 font-bold uppercase">
                  <th className="py-2.5">Supplier Name</th>
                  <th className="py-2.5">Country</th>
                  <th className="py-2.5 text-center">Batches Sourced</th>
                  <th className="py-2.5 text-right">Total purchases</th>
                  <th className="py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {supplierMetrics.map(s => (
                  <tr 
                    key={s.id} 
                    onClick={() => loadSupplierLedger(s)}
                    className={`border-b border-primary/5 hover:bg-brand-bg/10 cursor-pointer transition-colors ${selectedSupplier?.id === s.id ? 'bg-primary/5 border-l-2 border-l-primary pl-2' : ''}`}
                  >
                    <td className="py-3 font-semibold text-primary dark:text-secondary">{s.name}</td>
                    <td className="py-3 capitalize">{s.country || "Egypt"}</td>
                    <td className="py-3 text-center font-english">{s.purchaseCount} batches</td>
                    <td className="py-3 text-right font-bold font-english">{s.totalPurchasesCost.toLocaleString()} EGP</td>
                    <td className="py-3 text-center flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(s)}
                        className="p-1 rounded hover:bg-primary/5 text-primary cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 rounded hover:bg-red-500/5 text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-brand-text/40 font-light">
                      No suppliers registered in direct directory. Click 'Add Supplier' to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1/3: Payments Ledger Details */}
        <div className="p-5 rounded-2xl bg-brand-bg/5 dark:bg-brand-dark-card/25 border border-primary/5 space-y-5 h-[480px] flex flex-col">
          {selectedSupplier ? (
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-brand-text dark:text-brand-dark-text uppercase tracking-wide truncate">
                    {selectedSupplier.name}
                  </h4>
                  <span className="text-[9px] text-brand-text/40 block mt-0.5">Supplier Payments Ledger</span>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-primary text-white text-[9px] font-bold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" /> Record Payment
                </button>
              </div>

              {/* Outstanding balance calculations */}
              <div className="bg-brand-bg/10 p-3 rounded-xl border border-primary/5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-brand-text/50">Total purchases:</span>
                  <span className="font-bold font-english">{selectedSupplier.totalPurchasesCost.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-brand-text/50">Total Payments:</span>
                  <span className="font-bold font-english text-green-500">
                    {supplierPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0).toLocaleString()} EGP
                  </span>
                </div>
                <div className="border-t border-primary/5 mt-2 pt-2 flex justify-between">
                  <span className="font-bold text-brand-text/60">Outstanding Balance:</span>
                  <span className="font-extrabold font-english text-primary dark:text-secondary">
                    {Math.max(0, selectedSupplier.totalPurchasesCost - supplierPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0)).toLocaleString()} EGP
                  </span>
                </div>
              </div>

              {/* Payments List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px]">
                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-text/50 block mb-1">Payment History Logs ({supplierPayments.length})</span>
                {loadingPayments ? (
                  <div className="flex justify-center py-8 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  supplierPayments.map(p => (
                    <div key={p.id} className="p-2.5 rounded-xl border border-primary/5 bg-brand-bg/20 flex flex-col space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-green-500 font-english">-{parseFloat(p.amount).toLocaleString()} EGP</span>
                        <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-primary/10 text-primary">{p.payment_method}</span>
                      </div>
                      {p.notes && <p className="text-brand-text/70">{p.notes}</p>}
                      <span className="text-[7px] text-brand-text/40 font-english mt-0.5">{p.payment_date}</span>
                    </div>
                  ))
                )}
                {!loadingPayments && supplierPayments.length === 0 && (
                  <p className="text-xs text-brand-text/40 text-center py-10 italic">No payments logged in supplier ledger yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 text-brand-text/40">
              <Landmark className="w-12 h-12 stroke-[1.2] text-brand-text/30" />
              <p className="text-xs font-light max-w-[180px]">Select a supplier from the directory to review payments ledgers.</p>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                {editingSupplier ? "Edit Supplier Profile" : "Register New Supplier"}
              </h4>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingSupplier(null);
                }}
                className="text-brand-text/50 hover:text-brand-text text-sm uppercase tracking-wider font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Supplier Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Cairo Wholesale Fabrics"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+20100..."
                    value={form.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="sales@vendor..."
                    value={form.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Country */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Country</label>
                  <input
                    type="text"
                    name="country"
                    placeholder="e.g. Egypt"
                    value={form.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="e.g. Al-Darb Al-Ahmar, Cairo"
                    value={form.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Contract terms, delivery schedules, bank references..."
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
                {editingSupplier ? "Save Supplier Profile" : "Register Supplier"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                Record Payment for {selectedSupplier.name}
              </h4>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-brand-text/50 hover:text-brand-text text-sm uppercase tracking-wider font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Amount Paid (EGP) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 10000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Payment Date *</label>
                  <input
                    type="date"
                    name="paymentDate"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-medium"
                >
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Visa/Card">Credit Card</option>
                  <option value="Other">Mobile Wallet / Check</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Receipt voucher number, bank reference transaction ID..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Payment Voucher
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
