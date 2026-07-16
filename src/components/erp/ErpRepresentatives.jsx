import React, { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Check, Loader2, UserCheck, DollarSign, Printer } from "lucide-react";
import { erpService } from "../../services/erpService";
import toast from "react-hot-toast";

export const ErpRepresentatives = ({ representatives, orders, loadData, language = "en" }) => {
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingRep, setEditingRep] = useState(null);
  const [selectedRep, setSelectedRep] = useState(null);
  
  // Rep payments ledger
  const [repPayments, setRepPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
    commissionType: "percentage", // percentage, fixed
    commissionValue: ""
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

  const handleEdit = (rep) => {
    setEditingRep(rep);
    setForm({
      name: rep.name,
      phone: rep.phone || "",
      city: rep.city || "",
      address: rep.address || "",
      notes: rep.notes || "",
      commissionType: rep.commission_type || "percentage",
      commissionValue: rep.commission_value?.toString() || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this Sales Representative? All payment ledger logs will be removed.")) {
      try {
        await erpService.deleteRepresentative(id);
        toast.success("Representative profile deleted.");
        loadData();
      } catch (err) {
        toast.error("Failed to delete representative.");
      }
    }
  };

  const loadRepPayments = async (rep) => {
    setSelectedRep(rep);
    setLoadingPayments(true);
    try {
      const payments = await erpService.getRepresentativePayments(rep.id);
      setRepPayments(payments || []);
    } catch (err) {
      toast.error("Failed to load rep payment history.");
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.commissionValue) {
      toast.error("Please fill in required fields.");
      return;
    }

    setLoading(true);
    try {
      await erpService.saveRepresentative({
        ...form,
        id: editingRep ? editingRep.id : undefined
      });
      toast.success(editingRep ? "Profile updated!" : "Profile registered!");
      setShowModal(false);
      setEditingRep(null);
      setForm({
        name: "",
        phone: "",
        city: "",
        address: "",
        notes: "",
        commissionType: "percentage",
        commissionValue: ""
      });
      loadData();
    } catch (err) {
      toast.error("Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !selectedRep) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      await erpService.addRepresentativePayment({
        ...paymentForm,
        representativeId: selectedRep.id
      });
      toast.success("Commission payment logged successfully!");
      setShowPaymentModal(false);
      setPaymentForm({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Cash",
        notes: ""
      });
      loadRepPayments(selectedRep);
      loadData();
    } catch (err) {
      toast.error("Payout transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  // Compile calculations for each rep dynamically
  const repMetrics = useMemo(() => {
    return representatives.map(r => {
      const repOrders = orders.filter(o => o.representative_id === r.id && o.status === "completed");
      const totalSales = repOrders.reduce((acc, o) => acc + (o.totalEGP || 0), 0);
      
      const totalCommission = repOrders.reduce((acc, o) => {
        if (r.commission_type === 'percentage') {
          return acc + (o.totalEGP * (parseFloat(r.commission_value || 0) / 100));
        } else {
          return acc + parseFloat(r.commission_value || 0);
        }
      }, 0);

      return {
        ...r,
        totalOrders: repOrders.length,
        totalSales,
        totalCommission
      };
    });
  }, [representatives, orders]);

  // Handle Printable Commission Statement
  const handlePrintStatement = (rep) => {
    const printWindow = window.open("", "_blank");
    const statementPayments = repPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
    const balance = rep.totalCommission - statementPayments;

    printWindow.document.write(`
      <html>
        <head>
          <title>Commission Statement - ${rep.name}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1E293B; }
            h2 { border-bottom: 2px solid #0F172A; padding-bottom: 10px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #E2E8F0; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #F8FAFC; font-weight: bold; }
            .totals { margin-top: 30px; padding: 15px; background: #F1F5F9; border-radius: 8px; font-size: 14px; }
            .sign { margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px; }
          </style>
        </head>
        <body>
          <h2>LELA CONCIERGE ERP - COMMISSION STATEMENT</h2>
          <p><strong>Representative Name:</strong> ${rep.name}</p>
          <p><strong>Phone:</strong> ${rep.phone || "N/A"}</p>
          <p><strong>Commission Type:</strong> ${rep.commission_type === 'percentage' ? `${rep.commission_value}%` : `${rep.commission_value} EGP Fixed`}</p>
          
          <div class="totals">
            <p><strong>Total Orders:</strong> ${rep.totalOrders}</p>
            <p><strong>Total Sourced Sales Volume:</strong> ${rep.totalSales.toLocaleString()} EGP</p>
            <p><strong>Total Commission Earned:</strong> ${rep.totalCommission.toLocaleString()} EGP</p>
            <p><strong>Paid Commissions:</strong> ${statementPayments.toLocaleString()} EGP</p>
            <p><strong>Outstanding Balance Due:</strong> ${balance.toLocaleString()} EGP</p>
          </div>

          <div class="sign">
            <span>Prepared By: Admin</span>
            <span>Signature: __________________________</span>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-primary/5 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
            {language === "ar" ? "إدارة مناديب المبيعات والعمولات" : "Sales Representatives & Commission Registers"}
          </h3>
          <p className="text-[10px] text-brand-text/50 mt-1">
            Reconcile representative sales volumes, track payout records, and configure commission brackets
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRep(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md shadow-primary/10"
        >
          <Plus className="w-4 h-4" />
          Add Representative
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Directory Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-x-auto bg-brand-card dark:bg-brand-dark-card border border-primary/5 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-primary/5 bg-brand-bg/25 text-brand-text/50 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">Representative Name</th>
                  <th className="p-3">Commission Terms</th>
                  <th className="p-3 text-center">Completed Orders</th>
                  <th className="p-3 text-right">Commission Earned</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {repMetrics.map(r => (
                  <tr 
                    key={r.id} 
                    onClick={() => loadRepPayments(r)}
                    className={`border-b border-primary/5 hover:bg-brand-bg/10 cursor-pointer transition-colors ${selectedRep?.id === r.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  >
                    <td className="p-3 font-semibold text-primary dark:text-secondary">{r.name}</td>
                    <td className="p-3 capitalize">{r.commission_type === "percentage" ? `${r.commission_value}% Percentage` : `${r.commission_value} EGP Fixed`}</td>
                    <td className="p-3 text-center font-english">{r.totalOrders} orders</td>
                    <td className="p-3 text-right font-bold font-english">{r.totalCommission.toLocaleString()} EGP</td>
                    <td className="p-3 text-center flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(r)}
                        className="p-1 rounded hover:bg-primary/5 text-primary"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1 rounded hover:bg-red-500/5 text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {representatives.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-brand-text/40 font-light">
                      No sales representatives registered. Click 'Add Representative' to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rep Ledger details */}
        <div className="p-5 rounded-2xl bg-brand-bg/5 border border-primary/5 space-y-5 h-[480px] flex flex-col justify-between">
          {selectedRep ? (
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-brand-text uppercase truncate max-w-[140px]">{selectedRep.name}</h4>
                  <span className="text-[9px] text-brand-text/40 block mt-0.5">Commissions Ledger</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handlePrintStatement(selectedRep)}
                    className="p-1.5 rounded-lg border border-primary/10 hover:bg-primary/5 text-primary"
                    title="Print Statement"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-2 py-1 rounded-lg bg-primary text-white text-[9px] font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> Payout
                  </button>
                </div>
              </div>

              {/* Commission Stats */}
              <div className="bg-brand-bg/10 p-3 rounded-xl border border-primary/5 text-[10px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-brand-text/50">Total Sourced Sales:</span>
                  <span className="font-bold font-english">{selectedRep.totalSales.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text/50">Total Earned:</span>
                  <span className="font-bold font-english">{selectedRep.totalCommission.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-text/50">Total Paid:</span>
                  <span className="font-bold font-english text-green-500">
                    {repPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0).toLocaleString()} EGP
                  </span>
                </div>
                <div className="border-t border-primary/5 mt-2 pt-2 flex justify-between">
                  <span className="font-bold text-brand-text/60">Outstanding Due:</span>
                  <span className="font-extrabold font-english text-primary">
                    {Math.max(0, selectedRep.totalCommission - repPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0)).toLocaleString()} EGP
                  </span>
                </div>
              </div>

              {/* Payment logs */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px]">
                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-text/50 block mb-1">Payout Vouchers ({repPayments.length})</span>
                {loadingPayments ? (
                  <div className="flex justify-center py-6 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  repPayments.map(p => (
                    <div key={p.id} className="p-2 rounded-lg border border-primary/5 bg-brand-bg/20 flex flex-col space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-green-500 font-english">-{parseFloat(p.amount).toLocaleString()} EGP</span>
                        <span className="px-1 py-0.5 rounded text-[6px] font-bold uppercase bg-primary/10 text-primary">{p.payment_method}</span>
                      </div>
                      {p.notes && <p className="text-brand-text/70">{p.notes}</p>}
                      <span className="text-[7px] text-brand-text/40 font-english">{p.payment_date}</span>
                    </div>
                  ))
                )}
                {!loadingPayments && repPayments.length === 0 && (
                  <p className="text-xs text-brand-text/40 text-center py-8 italic">No payouts logged in representative ledger.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 text-brand-text/40">
              <UserCheck className="w-12 h-12 stroke-[1.2] text-brand-text/30" />
              <p className="text-xs font-light max-w-[180px]">Select a Sales Representative from the directory list to view ledger details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Representative Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                {editingRep ? "Edit Rep Profile" : "Register Sales Rep"}
              </h4>
              <button 
                onClick={() => setShowModal(false)}
                className="text-brand-text/50 hover:text-brand-text text-sm uppercase tracking-wider font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Representative Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Mahmoud Ali"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="967..."
                    value={form.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Sana'a"
                    value={form.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Commission Type</label>
                  <select
                    name="commissionType"
                    value={form.commissionType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (EGP)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Rate / Value *</label>
                  <input
                    type="number"
                    name="commissionValue"
                    required
                    placeholder={form.commissionType === "percentage" ? "5" : "150"}
                    value={form.commissionValue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Governorate assignment, special bonus terms..."
                  value={form.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Representative profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {showPaymentModal && selectedRep && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                Record Commission Payout for {selectedRep.name}
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
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Amount Paid (EGP) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 2000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Payment Date *</label>
                  <input
                    type="date"
                    name="paymentDate"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-medium"
                >
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank Transfer">Bank wire</option>
                  <option value="Wallet">Mobile Wallet / Check</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Receipt check number, bank transfer transaction ID..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Log Payout Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
