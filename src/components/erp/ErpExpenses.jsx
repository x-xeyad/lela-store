import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, Loader2 } from "lucide-react";
import { erpService } from "../../services/erpService";
import toast from "react-hot-toast";

export const ErpExpenses = ({ expenses, loadData, language = "en" }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [form, setForm] = useState({
    category: "Marketing",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    notes: ""
  });

  const expenseCategories = [
    "Rent",
    "Salaries",
    "Marketing",
    "Packaging",
    "Shipping",
    "Utilities",
    "Miscellaneous"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setForm({
      category: expense.category,
      amount: expense.amount.toString(),
      date: expense.date || new Date().toISOString().split("T")[0],
      description: expense.description || "",
      notes: expense.notes || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this expense log?")) {
      try {
        await erpService.deleteExpense(id);
        toast.success("Expense deleted successfully.");
        loadData();
      } catch (err) {
        toast.error("Failed to delete expense.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        id: editingExpense ? editingExpense.id : undefined
      };
      await erpService.saveExpense(payload);
      toast.success(editingExpense ? "Expense updated!" : "Expense logged!");
      setShowModal(false);
      setEditingExpense(null);
      setForm({
        category: "Marketing",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        notes: ""
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save expense details.");
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
            {language === "ar" ? "المصاريف التشغيلية" : "Operational Expenses Ledger"}
          </h3>
          <p className="text-[10px] text-brand-text/50 mt-1">
            Log overhead and marketing costs to deduct from net profit totals
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-primary/10 text-brand-text/50 font-bold uppercase">
              <th className="py-2.5">Date</th>
              <th className="py-2.5">Category</th>
              <th className="py-2.5">Description</th>
              <th className="py-2.5 text-right">Amount</th>
              <th className="py-2.5">Notes</th>
              <th className="py-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-primary/5 hover:bg-brand-bg/10">
                <td className="py-3 font-english font-medium whitespace-nowrap">{e.date}</td>
                <td className="py-3 font-bold text-primary dark:text-secondary">{e.category}</td>
                <td className="py-3 font-medium">{e.description}</td>
                <td className="py-3 text-right font-bold text-red-500 font-english">{parseFloat(e.amount).toLocaleString()} EGP</td>
                <td className="py-3 text-brand-text/50 italic max-w-xs truncate">{e.notes || "-"}</td>
                <td className="py-3 text-center flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(e)}
                    className="p-1 rounded hover:bg-primary/5 text-primary cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="p-1 rounded hover:bg-red-500/5 text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-brand-text/40 font-light">
                  No expense records found. Click 'Add Expense' to record operational overheads.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                {editingExpense ? "Edit Expense Log" : "Log Operational Expense"}
              </h4>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingExpense(null);
                }}
                className="text-brand-text/50 hover:text-brand-text text-sm uppercase tracking-wider font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Category *</label>
                  <select
                    name="category"
                    required
                    value={form.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-medium"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Amount (EGP) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 500"
                    value={form.amount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Date *</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={form.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Description *</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="e.g. Cardboard box packaging tape batch"
                  value={form.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Receipt number, payment vendor or cards details..."
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
                {editingExpense ? "Save Expense Log" : "Confirm Expense Log"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
