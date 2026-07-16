import React, { useState, useMemo } from "react";
import { Plus, ArrowDownLeft, ArrowUpRight, Loader2, DollarSign, Wallet } from "lucide-react";
import { erpService } from "../../services/erpService";
import toast from "react-hot-toast";

export const ErpTreasury = ({ treasuryTransactions, loadData, settings, language = "en" }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    transactionType: "deposit", // deposit, withdrawal, manual_adjustment
    amount: "",
    currency: "EGP",
    exchangeRate: "1.0",
    description: "",
    notes: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "currency") {
        if (value === "EGP") updated.exchangeRate = "1.0";
        else if (value === "YER") updated.exchangeRate = String(settings?.currency?.egpToYerRate || 11.5);
        else if (value === "SAR") {
          const egpToYer = settings?.currency?.egpToYerRate || 11.5;
          const yerToSar = settings?.currency?.yerToSarRate || 140;
          updated.exchangeRate = String(egpToYer / yerToSar);
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      // Calculate EGP value based on currency input
      const amountInEgp = parseFloat(form.amount) / parseFloat(form.exchangeRate || 1.0);
      
      await erpService.addTreasuryTransaction({
        transactionType: form.transactionType,
        amount: amountInEgp,
        currency: form.currency,
        exchangeRate: parseFloat(form.exchangeRate),
        description: form.description || "Manual adjustment",
        notes: form.notes
      });

      toast.success("Treasury transaction logged successfully.");
      setShowModal(false);
      setForm({
        transactionType: "deposit",
        amount: "",
        currency: "EGP",
        exchangeRate: "1.0",
        description: "",
        notes: ""
      });
      loadData();
    } catch (err) {
      toast.error("Failed to save transaction.");
    } finally {
      setLoading(false);
    }
  };

  // Reconcile Balances
  const balanceMetrics = useMemo(() => {
    let currentBalanceEgp = 0;
    let totalInEgp = 0;
    let totalOutEgp = 0;

    // Sort transactions chronologically to compute opening/closing balances
    const chronological = [...treasuryTransactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    let openingBalanceEgp = 0;
    if (chronological.length > 0) {
      // Assume opening balance is state before last month/period, or simply 0 for all-time
      // For this overview, let's treat the balance before the first transaction in this list as 0
    }

    chronological.forEach(t => {
      const amt = parseFloat(t.amount || 0);
      if (t.transaction_type === 'cash_in' || t.transaction_type === 'deposit') {
        currentBalanceEgp += amt;
        totalInEgp += amt;
      } else {
        currentBalanceEgp -= amt;
        totalOutEgp += amt;
      }
    });

    const egpToYer = settings?.currency?.egpToYerRate || 11.5;
    const yerToSar = settings?.currency?.yerToSarRate || 140;

    return {
      currentBalanceEgp,
      currentBalanceYer: currentBalanceEgp * egpToYer,
      currentBalanceSar: (currentBalanceEgp * egpToYer) / yerToSar,
      totalInEgp,
      totalOutEgp,
      openingBalanceEgp: 0,
      closingBalanceEgp: currentBalanceEgp
    };
  }, [treasuryTransactions, settings]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-primary/5 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
            {language === "ar" ? "الخزينة والصندوق والسيولة" : "Treasury Ledger & Real Cash Balances"}
          </h3>
          <p className="text-[10px] text-brand-text/50 mt-1">
            Track real cash flow, deposits, withdrawals, and multi-currency exchange reconciliations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md shadow-primary/10"
        >
          <Plus className="w-4 h-4" />
          {language === "ar" ? "تسجيل حركة مالية" : "Log Cash Action"}
        </button>
      </div>

      {/* Main Cash Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: EGP Cash Balance */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl flex flex-col justify-between h-[140px]">
          <div className="flex justify-between items-start">
            <Wallet className="w-6 h-6 stroke-[1.2]" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">EGP Treasury</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-english">
              {balanceMetrics.currentBalanceEgp.toLocaleString(undefined, { minimumFractionDigits: 2 })} EGP
            </div>
            <p className="text-[9px] text-white/50 mt-1">Reconciled real-cash vault balance</p>
          </div>
        </div>

        {/* Card 2: Yemen Riyal Equivalent */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 text-white shadow-xl flex flex-col justify-between h-[140px]">
          <div className="flex justify-between items-start">
            <DollarSign className="w-6 h-6 stroke-[1.2]" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">YER Equivalent</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-english">
              {balanceMetrics.currentBalanceYer.toLocaleString(undefined, { maximumFractionDigits: 0 })} YER
            </div>
            <p className="text-[9px] text-white/50 mt-1">Converted at 1 EGP = {settings?.currency?.egpToYerRate || 11.5} YER</p>
          </div>
        </div>

        {/* Card 3: Saudi Riyal Equivalent */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-500 text-white shadow-xl flex flex-col justify-between h-[140px]">
          <div className="flex justify-between items-start">
            <DollarSign className="w-6 h-6 stroke-[1.2]" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">SAR Equivalent</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-english">
              {balanceMetrics.currentBalanceSar.toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR
            </div>
            <p className="text-[9px] text-white/50 mt-1">Converted at 1 YER = 1/{settings?.currency?.yerToSarRate || 140} SAR</p>
          </div>
        </div>
      </div>

      {/* Cashflow Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
        <div className="p-4 border border-primary/10 rounded-xl bg-brand-bg/5 space-y-1">
          <span className="text-[8px] uppercase tracking-wider text-brand-text/50">Total Cash Inflows</span>
          <div className="text-green-500 font-bold font-english">+{balanceMetrics.totalInEgp.toLocaleString()} EGP</div>
        </div>
        <div className="p-4 border border-primary/10 rounded-xl bg-brand-bg/5 space-y-1">
          <span className="text-[8px] uppercase tracking-wider text-brand-text/50">Total Cash Outflows</span>
          <div className="text-red-500 font-bold font-english">-{balanceMetrics.totalOutEgp.toLocaleString()} EGP</div>
        </div>
        <div className="p-4 border border-primary/10 rounded-xl bg-brand-bg/5 space-y-1">
          <span className="text-[8px] uppercase tracking-wider text-brand-text/50">Opening Balance (All-Time)</span>
          <div className="font-bold font-english">0.00 EGP</div>
        </div>
        <div className="p-4 border border-primary/10 rounded-xl bg-brand-bg/5 space-y-1">
          <span className="text-[8px] uppercase tracking-wider text-brand-text/50">Closing Balance (All-Time)</span>
          <div className="font-bold font-english">{balanceMetrics.closingBalanceEgp.toLocaleString()} EGP</div>
        </div>
      </div>

      {/* Cash Flow Ledger Logs */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text/60">Chronological Treasury Ledger</h4>
        <div className="border border-primary/10 rounded-2xl overflow-hidden bg-brand-card dark:bg-brand-dark-card shadow-sm text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-bg/25 border-b border-primary/5 text-[9px] uppercase tracking-wider text-brand-text/50 font-bold">
                <th className="p-3">Reference Date</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Reference Description</th>
                <th className="p-3 text-right">Invoiced Currency</th>
                <th className="p-3 text-right">EGP Equivalent</th>
              </tr>
            </thead>
            <tbody>
              {treasuryTransactions.map(t => {
                const isInflow = t.transaction_type === 'cash_in' || t.transaction_type === 'deposit';
                return (
                  <tr key={t.id} className="border-b border-primary/5 hover:bg-brand-bg/5 transition-colors">
                    <td className="p-3 font-english text-brand-text/60">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="p-3 uppercase">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold ${
                        isInflow ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {isInflow ? <ArrowDownLeft className="w-2.5 h-2.5" /> : <ArrowUpRight className="w-2.5 h-2.5" />}
                        {t.transaction_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      <p className="text-brand-text">{t.description}</p>
                      {t.notes && <p className="text-[9px] text-brand-text/50 mt-0.5">{t.notes}</p>}
                    </td>
                    <td className="p-3 text-right font-english">
                      {(parseFloat(t.amount) * parseFloat(t.exchange_rate || 1.0)).toLocaleString()} {t.currency}
                    </td>
                    <td className={`p-3 text-right font-bold font-english ${isInflow ? 'text-green-500' : 'text-red-500'}`}>
                      {isInflow ? '+' : '-'}{parseFloat(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} EGP
                    </td>
                  </tr>
                );
              })}
              {treasuryTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-brand-text/40 font-light italic">
                    No cashflow records generated in treasury.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">Log Treasury Adjustment</h4>
              <button 
                onClick={() => setShowModal(false)}
                className="text-brand-text/50 hover:text-brand-text text-sm uppercase tracking-wider font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Type */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Action Category</label>
                <select
                  name="transactionType"
                  value={form.transactionType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/15 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white font-medium"
                >
                  <option value="deposit">Deposit (Cash In)</option>
                  <option value="withdrawal">Withdrawal (Cash Out)</option>
                  <option value="manual_adjustment">Manual Audit Adjustment</option>
                </select>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Transaction Value</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleInputChange}
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/15 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Currency</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-secondary/15 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white font-medium"
                  >
                    <option value="EGP">EGP (Cairo)</option>
                    <option value="YER">YER (Yemen)</option>
                    <option value="SAR">SAR (Saudi)</option>
                  </select>
                </div>
              </div>

              {/* Exchange rate info */}
              {form.currency !== "EGP" && (
                <div className="p-3 rounded-lg bg-primary/5 text-[9px] text-brand-text/60 font-english space-y-1">
                  <p>Exchange rate used: 1 EGP = {form.exchangeRate} {form.currency}</p>
                  <p>Calculated EGP Value: {(parseFloat(form.amount || 0) / parseFloat(form.exchangeRate || 1.0)).toFixed(2)} EGP</p>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Description *</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="e.g. Sourced additional cash injection from owner"
                  value={form.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/15 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Notes</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Bank receipt, voucher ID numbers..."
                  value={form.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 dark:border-secondary/15 bg-brand-bg dark:bg-brand-dark-bg text-brand-text dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Reconcile Treasury
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
