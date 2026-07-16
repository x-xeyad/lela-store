import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, Loader2 } from "lucide-react";
import { erpService } from "../../services/erpService";
import toast from "react-hot-toast";

export const ErpShipping = ({ shippingCompanies, loadData, language = "en" }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const [form, setForm] = useState({
    companyName: "",
    country: "Yemen",
    city: "Sanaa",
    costPerKg: "",
    fixedFees: "",
    extraFees: "",
    date: new Date().toISOString().split("T")[0]
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setForm({
      companyName: company.company_name,
      country: company.country,
      city: company.city,
      costPerKg: company.cost_per_kg.toString(),
      fixedFees: company.fixed_fees.toString(),
      extraFees: company.extra_fees.toString(),
      date: company.date || new Date().toISOString().split("T")[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this shipping company rate profile?")) {
      try {
        await erpService.deleteShippingCompany(id);
        toast.success("Shipping profile deleted successfully.");
        loadData();
      } catch (err) {
        toast.error("Failed to delete shipping profile.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName || !form.city || !form.costPerKg) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        id: editingCompany ? editingCompany.id : undefined
      };
      await erpService.saveShippingCompany(payload);
      toast.success(editingCompany ? "Shipping profile updated!" : "Shipping profile added!");
      setShowModal(false);
      setEditingCompany(null);
      setForm({
        companyName: "",
        country: "Yemen",
        city: "Sanaa",
        costPerKg: "",
        fixedFees: "",
        extraFees: "",
        date: new Date().toISOString().split("T")[0]
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save shipping rate.");
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
            {language === "ar" ? "حسابات وتكاليف الشحن" : "Shipping Accounting & Rates"}
          </h3>
          <p className="text-[10px] text-brand-text/50 mt-1">
            Configure delivery costs and weights per Yemeni city
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCompany(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Shipping Company
        </button>
      </div>

      {/* RLS Policies note */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-[10px] text-brand-text/75 leading-relaxed">
        <strong>Historical Safety Rule:</strong> Changing these shipping rate configs applies to future checkout orders and product calculations immediately. Existing orders in the database store their historical shipping cost calculations statically and are <strong>NOT</strong> affected by new changes.
      </div>

      {/* Rates Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-primary/10 text-brand-text/50 font-bold uppercase">
              <th className="py-2.5">Company Name</th>
              <th className="py-2.5">Country</th>
              <th className="py-2.5">City / Governorate</th>
              <th className="py-2.5 text-right">Cost per KG</th>
              <th className="py-2.5 text-right">Fixed Fees</th>
              <th className="py-2.5 text-right">Extra Fees</th>
              <th className="py-2.5">Active Date</th>
              <th className="py-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shippingCompanies.map((c) => (
              <tr key={c.id} className="border-b border-primary/5 hover:bg-brand-bg/10">
                <td className="py-3 font-semibold text-primary dark:text-secondary">{c.company_name}</td>
                <td className="py-3">{c.country}</td>
                <td className="py-3 font-medium capitalize">{c.city}</td>
                <td className="py-3 text-right font-english">{parseFloat(c.cost_per_kg).toLocaleString()} EGP</td>
                <td className="py-3 text-right font-english">{parseFloat(c.fixed_fees || 0).toLocaleString()} EGP</td>
                <td className="py-3 text-right font-english">{parseFloat(c.extra_fees || 0).toLocaleString()} EGP</td>
                <td className="py-3 font-english">{c.date || "-"}</td>
                <td className="py-3 text-center flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(c)}
                    className="p-1 rounded hover:bg-primary/5 text-primary cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 rounded hover:bg-red-500/5 text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {shippingCompanies.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-brand-text/40 font-light">
                  No shipping profiles configured. Click 'Add Shipping Company' to set up destinations.
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
                {editingCompany ? "Edit Shipping Company Rate" : "Add Shipping Company Rate"}
              </h4>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCompany(null);
                }}
                className="text-brand-text/50 hover:text-brand-text text-sm uppercase tracking-wider font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Company Name */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  placeholder="e.g. Yemen Cargo Group"
                  value={form.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Country */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Country *</label>
                  <input
                    type="text"
                    name="country"
                    required
                    value={form.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">City / Governorate *</label>
                  <select
                    name="city"
                    required
                    value={form.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="sanaa">Sanaa</option>
                    <option value="aden">Aden</option>
                    <option value="taiz">Taiz</option>
                    <option value="ibb">Ibb</option>
                    <option value="hadhramaut">Hadhramaut</option>
                    <option value="hodeidah">Hodeidah</option>
                    <option value="dhamar">Dhamar</option>
                    <option value="marib">Marib</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Cost Per KG */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Cost/KG (EGP)*</label>
                  <input
                    type="number"
                    name="costPerKg"
                    required
                    min="0"
                    placeholder="250"
                    value={form.costPerKg}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>

                {/* Fixed Fees */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Fixed (EGP)</label>
                  <input
                    type="number"
                    name="fixedFees"
                    min="0"
                    placeholder="50"
                    value={form.fixedFees}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>

                {/* Extra Fees */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Extra (EGP)</label>
                  <input
                    type="number"
                    name="extraFees"
                    min="0"
                    placeholder="0"
                    value={form.extraFees}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Activation Date</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={form.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white focus:outline-none focus:border-primary font-english"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingCompany ? "Save Shipping Profile" : "Create Shipping Profile"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
