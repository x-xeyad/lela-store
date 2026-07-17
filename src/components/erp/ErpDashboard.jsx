import React, { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Truck, 
  Archive, 
  AlertTriangle, 
  CheckCircle, 
  Clock 
} from "lucide-react";

export const ErpDashboard = ({ products, orders, purchases, expenses, representatives = [], language = "en" }) => {
  // --- FINANCIAL CALCULATIONS ---
  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === "completed");
    
    // 1. Total Sales (EGP)
    const totalSales = completedOrders.reduce((acc, o) => acc + (o.totalEGP || 0), 0);
    
    // 2. Cost calculations
    let totalCogs = 0;
    let totalSalesShippingEstimated = 0;
    let totalSalesShippingActual = 0;
    let totalSalesPackaging = 0;
    let totalDistributorProfit = 0;
    let totalRepCommissions = 0;
    let totalSalesDiscounts = 0;
    
    completedOrders.forEach(o => {
      // Estimated vs Actual shipping
      const estShip = parseFloat(o.estimated_shipping_cost_egp || o.shipping_cost_egp || 0);
      const actShip = parseFloat(o.actual_shipping_cost_egp || estShip);
      totalSalesShippingEstimated += estShip;
      totalSalesShippingActual += actShip;

      // Discounts
      totalSalesDiscounts += parseFloat(o.discount_amount || o.discountAmount || 0);

      // Rep commissions
      let orderRepCommission = 0;
      if (o.representative_id) {
        const rep = representatives.find(r => r.id === o.representative_id);
        if (rep) {
          if (rep.commission_type === 'percentage') {
            orderRepCommission = (o.totalEGP || 0) * (parseFloat(rep.commission_value || 0) / 100);
          } else {
            orderRepCommission = parseFloat(rep.commission_value || 0);
          }
        }
      }
      totalRepCommissions += orderRepCommission;
      
      (o.items || []).forEach(item => {
        const prod = item.product || {};
        const qty = parseInt(item.quantity || 1, 10);
        
        const purchaseCost = parseFloat(prod.purchase_cost || prod.costEGP || 0);
        const packagingCost = parseFloat(prod.packaging_cost || 0);
        const distProfit = parseFloat(prod.distributor_profit || 0);
        
        totalCogs += purchaseCost * qty;
        totalSalesPackaging += packagingCost * qty;
        totalDistributorProfit += distProfit * qty;
      });
    });

    // 3. Total Expenses (EGP)
    const totalExpenses = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
    
    // 4. Gross Profit = Sales - COGS
    const grossProfit = totalSales - totalCogs;
    
    // 5. Total Costs = COGS + Packaging + Actual Shipping + Distributor Profit + Rep Commissions + Discounts + Expenses
    const totalCosts = totalCogs + totalSalesPackaging + totalSalesShippingActual + totalDistributorProfit + totalRepCommissions + totalSalesDiscounts + totalExpenses;
    
    // 6. Net Profit = Sales - Total Costs
    const netProfit = totalSales - totalCosts;
    
    // 7. Total Purchases (EGP)
    const totalPurchases = purchases.reduce((acc, p) => acc + (parseFloat(p.purchase_cost) * parseInt(p.quantity, 10)), 0);
    const totalPurchasesShipping = purchases.reduce((acc, p) => acc + (parseFloat(p.shipping_cost) || 0), 0);
    
    // 8. Inventory Value = current stock * product purchase cost
    const inventoryValue = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.purchase_cost || p.costEGP || 0)), 0);

    // 9. Order Status counts
    const pendingOrdersCount = orders.filter(o => o.status === "pending").length;
    const completedOrdersCount = completedOrders.length;
    
    // 10. Low stock alert list (stock < 5)
    const lowStockProducts = products.filter(p => (p.stock || 0) < 5);

    // 11. Shipping Profit/Loss
    const shippingGainLoss = totalSalesShippingEstimated - totalSalesShippingActual;

    return {
      totalSales,
      totalPurchases: totalPurchases + totalPurchasesShipping,
      grossProfit,
      totalCosts,
      netProfit,
      totalSalesShippingEstimated,
      totalSalesShippingActual,
      shippingGainLoss,
      totalSalesPackaging,
      totalDistributorProfit,
      totalRepCommissions,
      totalSalesDiscounts,
      inventoryValue,
      ordersCount: orders.length,
      productsCount: products.length,
      lowStockCount: lowStockProducts.length,
      pendingOrdersCount,
      completedOrdersCount,
      lowStockProducts
    };
  }, [products, orders, purchases, expenses, representatives]);

  // --- CHART DATA COMPILATION ---
  // Last 6 months trends
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        sales: 0,
        profit: 0
      });
    }

    // Allocate completed orders
    orders.forEach(o => {
      if (o.status !== "completed" || !o.createdAt) return;
      const orderDate = new Date(o.createdAt);
      const match = months.find(m => m.monthIndex === orderDate.getMonth() && m.year === orderDate.getFullYear());
      
      if (match) {
        match.sales += (o.totalEGP || 0);
        
        let oCogs = 0;
        let oPackaging = 0;
        let oDistProfit = 0;
        (o.items || []).forEach(item => {
          oCogs += parseFloat(item.product?.purchase_cost || item.product?.costEGP || 0) * parseInt(item.quantity || 1, 10);
          oPackaging += parseFloat(item.product?.packaging_cost || 0) * parseInt(item.quantity || 1, 10);
          oDistProfit += parseFloat(item.product?.distributor_profit || 0) * parseInt(item.quantity || 1, 10);
        });

        const estShip = parseFloat(o.estimated_shipping_cost_egp || o.shipping_cost_egp || 0);
        const actShip = parseFloat(o.actual_shipping_cost_egp || estShip);
        const disc = parseFloat(o.discount_amount || o.discountAmount || 0);

        let oRepCommission = 0;
        if (o.representative_id) {
          const rep = representatives.find(r => r.id === o.representative_id);
          if (rep) {
            if (rep.commission_type === 'percentage') {
              oRepCommission = (o.totalEGP || 0) * (parseFloat(rep.commission_value || 0) / 100);
            } else {
              oRepCommission = parseFloat(rep.commission_value || 0);
            }
          }
        }

        const oTotalCost = oCogs + oPackaging + actShip + oDistProfit + oRepCommission + disc;
        const oNetProfit = (o.totalEGP || 0) - oTotalCost;
        match.profit += oNetProfit;
      }
    });

    return months;
  }, [orders, representatives]);

  // SVG Chart Dimensions & Computations
  const chartWidth = 500;
  const chartHeight = 150;
  const maxSalesVal = Math.max(...chartData.map(d => d.sales), 1000);
  const maxProfitVal = Math.max(...chartData.map(d => d.profit), maxSalesVal * 0.5, 500);

  const salesPoints = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((d.sales / maxSalesVal) * (chartHeight - 40) + 20);
    return `${x},${y}`;
  }).join(" ");

  const profitPoints = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((Math.max(0, d.profit) / maxProfitVal) * (chartHeight - 40) + 20);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-6">
      {/* 1. Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI: Sales */}
        <div className="p-5 rounded-2xl border border-primary/5 bg-brand-bg/20 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-brand-text/45">Gross Revenue</span>
            <div className="text-base font-extrabold text-primary dark:text-secondary font-english">
              {stats.totalSales.toLocaleString()} EGP
            </div>
            <p className="text-[8px] text-green-500 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> Completed Orders
            </p>
          </div>
          <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Total Costs */}
        <div className="p-5 rounded-2xl border border-primary/5 bg-brand-bg/20 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-brand-text/45">Total Costs</span>
            <div className="text-base font-extrabold text-primary dark:text-secondary font-english">
              {stats.totalCosts.toLocaleString()} EGP
            </div>
            <p className="text-[8px] text-brand-text/50 font-medium">COGS + Shipping + Expenses</p>
          </div>
          <div className="p-2.5 bg-rose-500/5 rounded-xl text-rose-500">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Net Profit */}
        <div className={`p-5 rounded-2xl border border-primary/5 flex items-center justify-between shadow-sm ${stats.netProfit >= 0 ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-brand-text/45">Net Profit</span>
            <div className={`text-base font-extrabold font-english ${stats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.netProfit.toLocaleString()} EGP
            </div>
            <p className="text-[8px] text-brand-text/50 font-medium">Revenue - All Costs</p>
          </div>
          <div className={`p-2.5 rounded-xl ${stats.netProfit >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {stats.netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        </div>

        {/* KPI: Inventory Value */}
        <div className="p-5 rounded-2xl border border-primary/5 bg-brand-bg/20 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-brand-text/45">Inventory Value</span>
            <div className="text-base font-extrabold text-primary dark:text-secondary font-english">
              {stats.inventoryValue.toLocaleString()} EGP
            </div>
            <p className="text-[8px] text-brand-text/50 font-medium">Stock * Purchase Costs</p>
          </div>
          <div className="p-2.5 bg-blue-500/5 rounded-xl text-blue-500">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <div className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10">
          <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/40 block">Purchases</span>
          <span className="text-xs font-bold font-english text-brand-text dark:text-brand-dark-text">{stats.totalPurchases.toLocaleString()} EGP</span>
        </div>
        <div className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10">
          <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/40 block">Expenses</span>
          <span className="text-xs font-bold font-english text-brand-text dark:text-brand-dark-text">{expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0).toLocaleString()} EGP</span>
        </div>
        <div className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10">
          <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/40 block">Rep Commissions</span>
          <span className="text-xs font-bold font-english text-brand-text dark:text-brand-dark-text">{stats.totalRepCommissions.toLocaleString()} EGP</span>
        </div>
        <div className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10">
          <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/40 block">Distributor Margin</span>
          <span className="text-xs font-bold font-english text-brand-text dark:text-brand-dark-text">{stats.totalDistributorProfit.toLocaleString()} EGP</span>
        </div>
        <div className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10">
          <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/40 block">Shipping Bal (Diff)</span>
          <span className={`text-xs font-bold font-english ${stats.shippingGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.shippingGainLoss >= 0 ? '+' : ''}{stats.shippingGainLoss.toLocaleString()} EGP
          </span>
        </div>
        <div className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10">
          <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/40 block">Total Orders</span>
          <span className="text-xs font-bold text-brand-text dark:text-brand-dark-text mt-1 block font-english">{stats.ordersCount}</span>
        </div>
        <div className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10">
          <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/40 block">Pending Orders</span>
          <span className="text-xs font-bold text-yellow-500 mt-1 block font-english">{stats.pendingOrdersCount}</span>
        </div>
        <div className="p-4 rounded-xl border border-primary/5 bg-brand-bg/10">
          <span className="text-[8px] uppercase tracking-wider font-bold text-brand-text/40 block">Completed Orders</span>
          <span className="text-xs font-bold text-green-500 mt-1 block font-english">{stats.completedOrdersCount}</span>
        </div>
      </div>

      {/* 4. Graphical Trends (SVG Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="p-5 rounded-2xl border border-primary/5 bg-brand-bg/5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text/70">Sales Trend (Last 6 Months)</h4>
            <span className="text-[8px] font-semibold uppercase font-english text-primary dark:text-secondary bg-primary/5 px-2 py-0.5 rounded-full">Line Chart</span>
          </div>
          <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
              {/* Grid Lines */}
              <line x1="20" y1="20" x2={chartWidth - 20} y2="20" stroke="currentColor" className="text-primary/5" strokeDasharray="3" />
              <line x1="20" y1="50" x2={chartWidth - 20} y2="50" stroke="currentColor" className="text-primary/5" strokeDasharray="3" />
              <line x1="20" y1="80" x2={chartWidth - 20} y2="80" stroke="currentColor" className="text-primary/5" strokeDasharray="3" />
              <line x1="20" y1="110" x2={chartWidth - 20} y2="110" stroke="currentColor" className="text-primary/5" strokeDasharray="3" />
              <line x1="20" y1={chartHeight - 20} x2={chartWidth - 20} y2={chartHeight - 20} stroke="currentColor" className="text-primary/10" />
              
              {/* Line Polyline */}
              <polyline fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" points={salesPoints} />
              
              {/* Dots */}
              {chartData.map((d, i) => {
                const x = (i / (chartData.length - 1)) * (chartWidth - 40) + 20;
                const y = chartHeight - ((d.sales / maxSalesVal) * (chartHeight - 40) + 20);
                return (
                  <g key={i} className="group/dot cursor-pointer">
                    <circle cx={x} cy={y} r="4" fill="currentColor" className="text-primary" />
                    <circle cx={x} cy={y} r="8" fill="currentColor" className="text-primary/20 opacity-0 group-hover/dot:opacity-100 transition-opacity" />
                    <text x={x} y={y - 8} textAnchor="middle" className="text-[7px] font-bold fill-brand-text dark:fill-brand-dark-text opacity-0 group-hover/dot:opacity-100 transition-opacity font-english bg-slate-900">
                      {d.sales.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Month Labels */}
              {chartData.map((d, i) => (
                <text key={i} x={(i / (chartData.length - 1)) * (chartWidth - 40) + 20} y={chartHeight - 5} textAnchor="middle" className="text-[7px] font-bold text-brand-text/50 font-english">
                  {d.name}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Profit Chart */}
        <div className="p-5 rounded-2xl border border-primary/5 bg-brand-bg/5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text/70">Net Profit Trend (Last 6 Months)</h4>
            <span className="text-[8px] font-semibold uppercase font-english text-green-500 bg-green-500/5 px-2 py-0.5 rounded-full">Bar Chart</span>
          </div>
          <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
              {/* Grid Lines */}
              <line x1="20" y1="20" x2={chartWidth - 20} y2="20" stroke="currentColor" className="text-primary/5" strokeDasharray="3" />
              <line x1="20" y1="50" x2={chartWidth - 20} y2="50" stroke="currentColor" className="text-primary/5" strokeDasharray="3" />
              <line x1="20" y1="80" x2={chartWidth - 20} y2="80" stroke="currentColor" className="text-primary/5" strokeDasharray="3" />
              <line x1="20" y1="110" x2={chartWidth - 20} y2="110" stroke="currentColor" className="text-primary/5" strokeDasharray="3" />
              <line x1="20" y1={chartHeight - 20} x2={chartWidth - 20} y2={chartHeight - 20} stroke="currentColor" className="text-primary/10" />

              {/* Bar Elements */}
              {chartData.map((d, i) => {
                const x = (i / (chartData.length - 1)) * (chartWidth - 40) + 12;
                const h = (Math.max(0, d.profit) / maxProfitVal) * (chartHeight - 40);
                const y = chartHeight - h - 20;
                return (
                  <g key={i} className="group/bar cursor-pointer">
                    <rect x={x} y={y} width="16" height={Math.max(2, h)} fill="currentColor" className="text-green-500 opacity-80 hover:opacity-100 rx-[3px] transition-all" />
                    <text x={x + 8} y={y - 5} textAnchor="middle" className="text-[7px] font-bold fill-brand-text dark:fill-brand-dark-text opacity-0 group-hover/bar:opacity-100 transition-opacity font-english">
                      {d.profit.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Month Labels */}
              {chartData.map((d, i) => (
                <text key={i} x={(i / (chartData.length - 1)) * (chartWidth - 40) + 20} y={chartHeight - 5} textAnchor="middle" className="text-[7px] font-bold text-brand-text/50 font-english">
                  {d.name}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* 5. Warning Stock Tracker & Operations Alerts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="p-5 rounded-2xl border border-red-500/10 bg-red-500/5 space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider">
              Stock Warnings & Shortage Alerts ({stats.lowStockCount})
            </h4>
          </div>
          <div className="overflow-x-auto text-[10px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-primary/10 text-brand-text/50 font-bold uppercase">
                  <th className="py-2">Product Name</th>
                  <th className="py-2">Category</th>
                  <th className="py-2 text-center">Remaining Stock</th>
                  <th className="py-2 text-right">Valuation</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockProducts.map(p => (
                  <tr key={p.id} className="border-b border-primary/5 hover:bg-red-500/5">
                    <td className="py-2.5 font-medium">{p.name?.[language] || p.name?.en}</td>
                    <td className="py-2.5">{p.category}</td>
                    <td className="py-2.5 text-center font-bold text-red-500 font-english">{p.stock} units</td>
                    <td className="py-2.5 text-right font-bold font-english">{((p.stock || 0) * (p.purchase_cost || p.costEGP || 0)).toLocaleString()} EGP</td>
                  </tr>
                ))}
                {stats.lowStockCount === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-brand-text/40">
                      All products stock levels are secure. No shortage alerts recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
