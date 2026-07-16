import React, { useState, useMemo } from "react";
import { Download, Printer, Calendar, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";

export const ErpReports = ({ products, orders, purchases, expenses, language = "en" }) => {
  const [rangeType, setRangeType] = useState("monthly"); // daily, weekly, monthly, yearly
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Reconcile dates ranges
  const filteredData = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (customStartDate && customEndDate) {
      start = new Date(customStartDate);
      end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
    } else {
      switch (rangeType) {
        case "daily":
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "weekly":
          // Last 7 days
          start.setDate(now.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          break;
        case "yearly":
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case "monthly":
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    const inRange = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    // Filter datasets
    const rangeOrders = orders.filter(o => inRange(o.createdAt) && o.status === "completed");
    const rangePurchases = purchases.filter(p => inRange(p.purchase_date));
    const rangeExpenses = expenses.filter(e => inRange(e.date));

    // Calculate Sales
    const salesVal = rangeOrders.reduce((acc, o) => acc + (o.totalEGP || 0), 0);
    
    // Calculate COGS and packaging/shipping
    let cogsVal = 0;
    let shippingVal = 0;
    let packagingVal = 0;
    const productSoldCounts = {};

    rangeOrders.forEach(o => {
      shippingVal += (o.shipping_cost_egp || 0);
      (o.items || []).forEach(item => {
        const prod = item.product || {};
        const qty = parseInt(item.quantity || 1, 10);
        
        cogsVal += parseFloat(prod.purchase_cost || prod.costEGP || 0) * qty;
        packagingVal += parseFloat(prod.packaging_cost || 0) * qty;

        const pid = prod.id || "unknown";
        if (!productSoldCounts[pid]) {
          productSoldCounts[pid] = {
            product: prod,
            qty: 0,
            revenue: 0,
            profit: 0
          };
        }
        productSoldCounts[pid].qty += qty;
        productSoldCounts[pid].revenue += (parseFloat(item.priceEGP || prod.priceEGP || 0) * qty);
        
        const uCost = parseFloat(prod.purchase_cost || prod.costEGP || 0) + parseFloat(prod.packaging_cost || 0) + parseFloat(prod.shipping_cost || 0);
        productSoldCounts[pid].profit += ((parseFloat(item.priceEGP || prod.priceEGP || 0) - uCost) * qty);
      });
    });

    const expensesVal = rangeExpenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
    const purchasesVal = rangePurchases.reduce((acc, p) => acc + (parseFloat(p.purchase_cost) * parseInt(p.quantity, 10)) + parseFloat(p.shipping_cost || 0), 0);
    
    const grossProfit = salesVal - cogsVal;
    const netProfit = grossProfit - shippingVal - packagingVal - expensesVal;

    // Inventory Valuation
    const inventoryValuation = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.purchase_cost || p.costEGP || 0)), 0);

    // Rank products
    const productList = Object.values(productSoldCounts);
    const topSelling = [...productList].sort((a, b) => b.qty - a.qty).slice(0, 5);
    const lowestSelling = [...productList].sort((a, b) => a.qty - b.qty).slice(0, 5);
    const mostProfitable = [...productList].sort((a, b) => b.profit - a.profit).slice(0, 5);
    const leastProfitable = [...productList].sort((a, b) => a.profit - b.profit).slice(0, 5);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      salesVal,
      purchasesVal,
      expensesVal,
      shippingVal,
      packagingVal,
      grossProfit,
      netProfit,
      inventoryValuation,
      topSelling,
      lowestSelling,
      mostProfitable,
      leastProfitable
    };
  }, [products, orders, purchases, expenses, rangeType, customStartDate, customEndDate]);

  // --- EXPORT TO CSV ---
  const handleExportCSV = () => {
    const rows = [
      ["LELA FINANCIAL REPORT STATEMENT"],
      ["Date Range", `${filteredData.startDate} to ${filteredData.endDate}`],
      [],
      ["Financial Metrics", "Value (EGP)"],
      ["Total Completed Sales", filteredData.salesVal.toFixed(2)],
      ["Total Purchases Sourced", filteredData.purchasesVal.toFixed(2)],
      ["Operating Expenses", filteredData.expensesVal.toFixed(2)],
      ["Sales Delivery Cost", filteredData.shippingVal.toFixed(2)],
      ["Sales Packaging Cost", filteredData.packagingVal.toFixed(2)],
      ["Gross Profit", filteredData.grossProfit.toFixed(2)],
      ["Net Profit", filteredData.netProfit.toFixed(2)],
      ["Remaining Stock Valuation", filteredData.inventoryValuation.toFixed(2)],
      [],
      ["Top 5 Selling Products", "Quantity Sold", "Revenue (EGP)", "Estimated Net Profit (EGP)"],
      ...filteredData.topSelling.map(p => [
        p.product.name?.[language] || p.product.name?.en || "Unknown",
        p.qty,
        p.revenue.toFixed(2),
        p.profit.toFixed(2)
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lela_erp_report_${filteredData.startDate}_to_${filteredData.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded successfully!");
  };

  // --- PRINT / PDF EXPORT ---
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Row */}
      <div className="flex justify-between items-center border-b border-primary/5 pb-4 print:hidden">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text/80">
            {language === "ar" ? "التقارير المالية والمحاسبية" : "Financial Auditing & Reports"}
          </h3>
          <p className="text-[10px] text-brand-text/50 mt-1">
            Export transaction logs and analyze gross/net product yields
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl border border-primary/20 text-primary dark:text-secondary text-[10px] font-bold uppercase tracking-wider font-english hover:bg-primary/5 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV / Excel
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-wider font-english hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Date Filters Row */}
      <div className="p-4 rounded-xl bg-brand-bg/10 border border-primary/5 flex flex-wrap items-center justify-between gap-4 print:hidden text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-bold text-[10px] uppercase text-brand-text/60">Date Interval:</span>
          <div className="flex bg-brand-bg dark:bg-brand-dark-bg p-0.5 rounded-lg border border-primary/10">
            {["daily", "weekly", "monthly", "yearly"].map(type => (
              <button
                key={type}
                onClick={() => {
                  setRangeType(type);
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className={`px-3 py-1 rounded-md text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                  rangeType === type && !customStartDate ? "bg-primary text-white shadow-xs" : "text-brand-text/50 hover:text-brand-text"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-[10px] uppercase text-brand-text/60">Custom Range:</span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="px-2 py-1 rounded-md border border-primary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text font-english text-[10px]"
          />
          <span className="text-brand-text/40">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="px-2 py-1 rounded-md border border-primary/10 bg-brand-bg dark:bg-brand-dark-bg text-brand-text font-english text-[10px]"
          />
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="p-8 rounded-2xl border border-primary/10 bg-white dark:bg-brand-dark-card space-y-6 shadow-sm print:border-0 print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="border-b-2 border-primary/20 pb-4 flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-primary dark:text-secondary uppercase tracking-wider font-english">
              LELA CONCIERGE ERP
            </h2>
            <span className="text-[9px] uppercase tracking-widest text-brand-text/50 font-bold block">
              Accounting Statement Ledger
            </span>
          </div>
          <div className="text-right text-[9px] font-english">
            <p className="font-bold">Period Statement:</p>
            <p className="text-brand-text/65 mt-0.5">{filteredData.startDate} to {filteredData.endDate}</p>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 border border-primary/10 rounded-xl bg-brand-bg/5 space-y-1">
            <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/50">Sales Revenue</span>
            <p className="text-sm font-extrabold text-brand-text font-english">{filteredData.salesVal.toLocaleString()} EGP</p>
          </div>
          <div className="p-4 border border-primary/10 rounded-xl bg-brand-bg/5 space-y-1">
            <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/50">COGS (Stock Cost)</span>
            <p className="text-sm font-extrabold text-brand-text font-english">{filteredData.purchasesVal.toLocaleString()} EGP</p>
          </div>
          <div className="p-4 border border-primary/10 rounded-xl bg-brand-bg/5 space-y-1">
            <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/50">Expenses & Overheads</span>
            <p className="text-sm font-extrabold text-brand-text font-english">{filteredData.expensesVal.toLocaleString()} EGP</p>
          </div>
          <div className={`p-4 border rounded-xl space-y-1 ${filteredData.netProfit >= 0 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/50">Reconciled Net Yield</span>
            <p className={`text-sm font-extrabold font-english ${filteredData.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{filteredData.netProfit.toLocaleString()} EGP</p>
          </div>
        </div>

        {/* Ledger table */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text/60">Profit & Loss Ledger Detail</h4>
          <div className="border border-primary/10 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-2 p-3 border-b border-primary/5 hover:bg-brand-bg/5 font-medium">
              <span className="text-brand-text/60">Gross Product Sales Revenue</span>
              <span className="text-right font-bold font-english text-green-500">+{filteredData.salesVal.toLocaleString()} EGP</span>
            </div>
            <div className="grid grid-cols-2 p-3 border-b border-primary/5 hover:bg-brand-bg/5 font-medium">
              <span className="text-brand-text/60">Direct Sourced Inventory cost (COGS)</span>
              <span className="text-right font-bold font-english text-red-500">-{filteredData.purchasesVal.toLocaleString()} EGP</span>
            </div>
            <div className="grid grid-cols-2 p-3 border-b border-primary/5 hover:bg-brand-bg/5 font-medium">
              <span className="text-brand-text/60">Operational Overhead Expenses (Marketing, Rent, atc.)</span>
              <span className="text-right font-bold font-english text-red-500">-{filteredData.expensesVal.toLocaleString()} EGP</span>
            </div>
            <div className="grid grid-cols-2 p-3 border-b border-primary/5 hover:bg-brand-bg/5 font-medium">
              <span className="text-brand-text/60">Sales Logistics Shipping Cost</span>
              <span className="text-right font-bold font-english text-red-500">-{filteredData.shippingVal.toLocaleString()} EGP</span>
            </div>
            <div className="grid grid-cols-2 p-3 border-b border-primary/5 hover:bg-brand-bg/5 font-medium">
              <span className="text-brand-text/60">Sales Ribbons & Boxes Packaging Cost</span>
              <span className="text-right font-bold font-english text-red-500">-{filteredData.packagingVal.toLocaleString()} EGP</span>
            </div>
            <div className="grid grid-cols-2 p-3 bg-brand-bg/15 font-bold">
              <span>Estimated Net Surplus / Yield</span>
              <span className={`text-right font-extrabold font-english ${filteredData.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {filteredData.netProfit.toLocaleString()} EGP
              </span>
            </div>
          </div>
        </div>

        {/* Product Ranks (Top Selling and Most Profitable) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
          {/* Top Selling */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text/60">Top Selling Products</h4>
            <div className="border border-primary/10 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-brand-bg/10 border-b border-primary/5 font-bold uppercase text-[9px] text-brand-text/50">
                    <th className="p-2">Name</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.topSelling.map(p => (
                    <tr key={p.product.id} className="border-b border-primary/5">
                      <td className="p-2 font-medium truncate max-w-[120px]">{p.product.name?.[language] || p.product.name?.en}</td>
                      <td className="p-2 text-center font-bold font-english">{p.qty}</td>
                      <td className="p-2 text-right font-english">{p.revenue.toLocaleString()} EGP</td>
                    </tr>
                  ))}
                  {filteredData.topSelling.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-brand-text/40">No sales recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Most Profitable */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text/60">Most Profitable Products</h4>
            <div className="border border-primary/10 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-brand-bg/10 border-b border-primary/5 font-bold uppercase text-[9px] text-brand-text/50">
                    <th className="p-2">Name</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.mostProfitable.map(p => (
                    <tr key={p.product.id} className="border-b border-primary/5">
                      <td className="p-2 font-medium truncate max-w-[120px]">{p.product.name?.[language] || p.product.name?.en}</td>
                      <td className="p-2 text-center font-bold font-english">{p.qty}</td>
                      <td className="p-2 text-right font-bold text-green-500 font-english">{p.profit.toLocaleString()} EGP</td>
                    </tr>
                  ))}
                  {filteredData.mostProfitable.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-brand-text/40">No sales recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Disclaimer / Sign Off for physical printing */}
        <div className="hidden print:block pt-16 text-[9px] text-brand-text/40 flex justify-between border-t border-dashed border-primary/20">
          <span>Report compiled automatically by LELA ERP.</span>
          <span>Signature / Approval: _____________________</span>
        </div>
      </div>
    </div>
  );
};
