import React, { useState, useMemo, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, Loader2, Users, FileText, Printer, ShieldAlert } from "lucide-react";
import { erpService } from "../../services/erpService";
import toast from "react-hot-toast";

export const ErpWholesalers = ({ wholesalers, products, loadData, language = "en" }) => {
  const [subTab, setSubTab] = useState("directory"); // directory, invoices
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingWholesaler, setEditingWholesaler] = useState(null);
  const [selectedWholesaler, setSelectedWholesaler] = useState(null);
  
  // Ledger states
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Forms
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxNumber: "",
    customDiscount: "",
    creditLimit: "",
    paymentTerms: "Net 30",
    notes: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    notes: ""
  });

  const [priceForm, setPriceForm] = useState({
    productId: "",
    specialPrice: ""
  });

  // Invoice builder state
  const [invoiceForm, setInvoiceForm] = useState({
    wholesalerId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    items: [], // { productId, name, qty, price, discount, total }
    shipping: "0",
    notes: ""
  });

  useEffect(() => {
    loadWholesaleInvoices();
  }, []);

  const loadWholesaleInvoices = async () => {
    try {
      const invs = await erpService.getWholesaleInvoices();
      setInvoices(invs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (w) => {
    setEditingWholesaler(w);
    setForm({
      companyName: w.company_name,
      contactPerson: w.contact_person || "",
      phone: w.phone || "",
      email: w.email || "",
      address: w.address || "",
      taxNumber: w.tax_number || "",
      customDiscount: w.custom_discount?.toString() || "0",
      creditLimit: w.credit_limit?.toString() || "0",
      paymentTerms: w.payment_terms || "Net 30",
      notes: w.notes || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete wholesaler profile? All linked payments will be removed.")) {
      try {
        await erpService.deleteWholesaler(id);
        toast.success("Wholesaler profile deleted.");
        loadData();
      } catch (err) {
        toast.error("Operation failed.");
      }
    }
  };

  const loadWholesalerLedger = async (w) => {
    setSelectedWholesaler(w);
    setLoadingLedger(true);
    try {
      const [pms, prs] = await Promise.all([
        erpService.getWholesalePayments(w.id),
        erpService.getWholesalerPrices(w.id)
      ]);
      setPayments(pms || []);
      setPrices(prs || []);
    } catch (err) {
      toast.error("Failed to load customer B2B ledger.");
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName) {
      toast.error("Company Name is required.");
      return;
    }

    setLoading(true);
    try {
      await erpService.saveWholesaler({
        ...form,
        id: editingWholesaler ? editingWholesaler.id : undefined
      });
      toast.success(editingWholesaler ? "Profile updated!" : "Profile created!");
      setShowModal(false);
      setEditingWholesaler(null);
      setForm({
        companyName: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        taxNumber: "",
        customDiscount: "",
        creditLimit: "",
        paymentTerms: "Net 30",
        notes: ""
      });
      loadData();
    } catch (err) {
      toast.error("Failed to save wholesaler.");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    if (!priceForm.productId || !priceForm.specialPrice || !selectedWholesaler) {
      toast.error("All price list fields are required.");
      return;
    }

    setLoading(true);
    try {
      await erpService.saveWholesalerPrice(selectedWholesaler.id, priceForm.productId, priceForm.specialPrice);
      toast.success("Special product price mapped!");
      setShowPriceModal(false);
      setPriceForm({ productId: "", specialPrice: "" });
      loadWholesalerLedger(selectedWholesaler);
    } catch (err) {
      toast.error("Failed to map price.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !selectedWholesaler) {
      toast.error("Please enter payout amount.");
      return;
    }

    setLoading(true);
    try {
      await erpService.addWholesalePayment({
        ...paymentForm,
        wholesalerId: selectedWholesaler.id
      });
      toast.success("Payment recorded, cashbox balanced!");
      setShowPaymentModal(false);
      setPaymentForm({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Cash",
        notes: ""
      });
      loadWholesalerLedger(selectedWholesaler);
      loadWholesaleInvoices();
      loadData();
    } catch (err) {
      toast.error("Failed to register payment.");
    } finally {
      setLoading(false);
    }
  };

  // Compile calculations for each wholesaler dynamically
  const wholesalerMetrics = useMemo(() => {
    return wholesalers.map(w => {
      const wholesalerInvs = invoices.filter(i => i.wholesaler_id === w.id);
      const totalBilled = wholesalerInvs.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
      return {
        ...w,
        invoiceCount: wholesalerInvs.length,
        totalBilled
      };
    });
  }, [wholesalers, invoices]);

  // Invoice builder helpers
  const handleAddInvoiceItem = (prodId) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    // Check if there is a special price mapped for this wholesaler
    const special = prices.find(p => p.product_id === prodId);
    const unitPrice = special ? parseFloat(special.special_price) : parseFloat(prod.priceEGP);

    setInvoiceForm(prev => {
      const existingIdx = prev.items.findIndex(i => i.productId === prodId);
      const updatedItems = [...prev.items];

      if (existingIdx > -1) {
        updatedItems[existingIdx].qty += 1;
        updatedItems[existingIdx].total = (updatedItems[existingIdx].qty * updatedItems[existingIdx].price) - updatedItems[existingIdx].discount;
      } else {
        updatedItems.push({
          productId: prod.id,
          name: prod.name?.en || "Unnamed Product",
          qty: 1,
          price: unitPrice,
          discount: 0,
          total: unitPrice
        });
      }
      return { ...prev, items: updatedItems };
    });
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceForm.wholesalerId || invoiceForm.items.length === 0) {
      toast.error("Please select customer and items.");
      return;
    }

    const itemsTotal = invoiceForm.items.reduce((acc, i) => acc + i.total, 0);
    const shippingVal = parseFloat(invoiceForm.shipping || 0);
    const invoiceTotal = itemsTotal + shippingVal;

    // Credit limit validation
    const w = wholesalers.find(cust => cust.id === invoiceForm.wholesalerId);
    if (w && w.credit_limit > 0 && invoiceTotal > w.credit_limit) {
      if (!window.confirm(`Warning: Invoice total (${invoiceTotal} EGP) exceeds B2B credit limit (${w.credit_limit} EGP). Proceed?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await erpService.saveWholesaleInvoice({
        id: invoiceNumber,
        wholesaler_id: invoiceForm.wholesalerId,
        invoice_date: invoiceForm.invoiceDate,
        payment_due_date: invoiceForm.paymentDueDate,
        items: invoiceForm.items,
        shipping: shippingVal,
        total: invoiceTotal,
        payment_status: "unpaid",
        notes: invoiceForm.notes
      });

      toast.success("B2B Invoice created!");
      setShowInvoiceModal(false);
      setInvoiceForm({
        wholesalerId: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        items: [],
        shipping: "0",
        notes: ""
      });
      loadWholesaleInvoices();
      loadData();
    } catch (err) {
      toast.error("Failed to generate invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = (inv) => {
    const printWindow = window.open("", "_blank");
    const cust = wholesalers.find(w => w.id === inv.wholesaler_id) || {};
    const itemsRows = (inv.items || []).map(i => `
      <tr>
        <td>${i.name}</td>
        <td style="text-align: center;">${i.qty}</td>
        <td style="text-align: right;">${i.price.toLocaleString()} EGP</td>
        <td style="text-align: right;">${i.discount.toLocaleString()} EGP</td>
        <td style="text-align: right;">${i.total.toLocaleString()} EGP</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${inv.id}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1E293B; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0F172A; padding-bottom: 20px; }
            .meta { margin-top: 30px; display: grid; grid-template-cols: 1fr 1fr; gap: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th, td { border: 1px solid #E2E8F0; padding: 12px; font-size: 13px; }
            th { background-color: #F8FAFC; font-weight: bold; }
            .totals { margin-left: auto; width: 300px; margin-top: 40px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #E2E8F0; padding-top: 12px; margin-top: 8px; }
            .footer { margin-top: 80px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px dashed #E2E8F0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; color: #0F172A; font-size: 24px; font-weight: 800; letter-spacing: 1px;">LELA CONCIERGE</h1>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748B;">B2B Corporate Wholesale Invoice</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #0F172A; font-size: 18px;">INVOICE</h2>
              <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: bold; font-family: monospace;">${inv.id}</p>
            </div>
          </div>

          <div class="meta">
            <div>
              <h4 style="margin: 0 0 8px 0; color: #64748B; font-size: 10px; text-transform: uppercase;">Billed To:</h4>
              <p style="margin: 0; font-weight: bold; font-size: 14px;">${cust.company_name}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Contact: ${cust.contact_person || "N/A"}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Tax ID: ${cust.tax_number || "N/A"}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Phone: ${cust.phone || "N/A"}</p>
            </div>
            <div style="text-align: right;">
              <h4 style="margin: 0 0 8px 0; color: #64748B; font-size: 10px; text-transform: uppercase;">Invoice Details:</h4>
              <p style="margin: 0; font-size: 12px;"><strong>Invoice Date:</strong> ${inv.invoice_date}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px;"><strong>Due Date:</strong> ${inv.payment_due_date || "Upon Receipt"}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px;"><strong>Terms:</strong> ${cust.payment_terms || "COD"}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Product Item / Sourced SKU</th>
                <th style="width: 80px; text-align: center;">Qty</th>
                <th style="width: 120px; text-align: right;">Unit Price</th>
                <th style="width: 100px; text-align: right;">Discount</th>
                <th style="width: 130px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Items Subtotal:</span>
              <span>${inv.items ? inv.items.reduce((acc, i) => acc + i.total, 0).toLocaleString() : 0} EGP</span>
            </div>
            <div class="totals-row">
              <span>Shipping cost:</span>
              <span>${(parseFloat(inv.shipping) || 0).toLocaleString()} EGP</span>
            </div>
            <div class="totals-row grand-total">
              <span>Grand Total Due:</span>
              <span>${parseFloat(inv.total).toLocaleString()} EGP</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing LELA. Please wire invoice payments to our verified banking terms.</p>
            <p>LELA Concierge - Cairo / Sana'a</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Subtab navigation */}
      <div className="flex justify-between items-center border-b border-primary/5 pb-4">
        <div className="flex bg-brand-bg/15 p-0.5 rounded-lg border border-primary/5">
          <button
            onClick={() => setSubTab("directory")}
            className={`px-4 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
              subTab === "directory" ? "bg-primary text-white shadow-xs" : "text-brand-text/50 hover:text-brand-text"
            }`}
          >
            Directory & Price Lists
          </button>
          <button
            onClick={() => setSubTab("invoices")}
            className={`px-4 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
              subTab === "invoices" ? "bg-primary text-white shadow-xs" : "text-brand-text/50 hover:text-brand-text"
            }`}
          >
            B2B Wholesale Invoices ({invoices.length})
          </button>
        </div>
        {subTab === "directory" ? (
          <button
            onClick={() => {
              setEditingWholesaler(null);
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            Add Wholesaler
          </button>
        ) : (
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold uppercase tracking-wider hover:bg-primary/95 flex items-center gap-1.5 transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            Create B2B Invoice
          </button>
        )}
      </div>

      {subTab === "directory" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wholesalers Directory */}
          <div className="lg:col-span-2 space-y-4">
            <div className="overflow-x-auto bg-brand-card dark:bg-brand-dark-card border border-primary/5 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-primary/5 bg-brand-bg/25 text-brand-text/50 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3">Company Name</th>
                    <th className="p-3">Terms & Limits</th>
                    <th className="p-3 text-center">B2B Invoices</th>
                    <th className="p-3 text-right">Total Invoiced</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wholesalerMetrics.map(w => (
                    <tr 
                      key={w.id} 
                      onClick={() => loadWholesalerLedger(w)}
                      className={`border-b border-primary/5 hover:bg-brand-bg/10 cursor-pointer transition-colors ${selectedWholesaler?.id === w.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                    >
                      <td className="p-3 font-semibold text-primary dark:text-secondary">{w.company_name}</td>
                      <td className="p-3 font-english">
                        <p>{w.payment_terms} | Credit: {w.credit_limit?.toLocaleString()} EGP</p>
                        <p className="text-[10px] text-brand-text/45 mt-0.5">Discount: {w.custom_discount}%</p>
                      </td>
                      <td className="p-3 text-center font-english">{w.invoiceCount} invoices</td>
                      <td className="p-3 text-right font-bold font-english">{w.totalBilled.toLocaleString()} EGP</td>
                      <td className="p-3 text-center flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(w)}
                          className="p-1 rounded hover:bg-primary/5 text-primary"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="p-1 rounded hover:bg-red-500/5 text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {wholesalers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-brand-text/40 font-light">
                        No B2B wholesalers registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Wholesaler Price lists & Payments Ledger */}
          <div className="p-5 rounded-2xl bg-brand-bg/5 border border-primary/5 space-y-5 h-[480px] flex flex-col justify-between">
            {selectedWholesaler ? (
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden text-[10px]">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-brand-text uppercase truncate max-w-[140px]">{selectedWholesaler.company_name}</h4>
                    <span className="text-[9px] text-brand-text/40 block mt-0.5">Special Price Mappings ({prices.length})</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowPriceModal(true)}
                      className="px-2 py-1 rounded-lg bg-primary text-white text-[8px] font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> Map Price
                    </button>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-2 py-1 rounded-lg bg-green-600 text-white text-[8px] font-bold uppercase tracking-wider hover:bg-green-700 flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> Pay
                    </button>
                  </div>
                </div>

                {/* Price mappings list */}
                <div className="flex-1 overflow-y-auto space-y-1.5 border border-primary/5 p-2 rounded-xl bg-brand-card/50">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-brand-text/50 block mb-1">Custom Prices Grid</span>
                  {prices.map(pr => {
                    const prod = products.find(p => p.id === pr.product_id);
                    return (
                      <div key={pr.id} className="flex justify-between items-center py-1.5 border-b border-primary/5">
                        <span className="truncate max-w-[120px]">{prod ? prod.name?.en : "Unknown SKU"}</span>
                        <div className="font-english font-bold">
                          <span className="text-brand-text/40 line-through mr-1.5">{prod ? prod.priceEGP : 0} EGP</span>
                          <span className="text-primary">{pr.special_price} EGP</span>
                        </div>
                      </div>
                    );
                  })}
                  {prices.length === 0 && (
                    <p className="text-xs text-brand-text/40 text-center py-8 italic">No special prices set. Client inherits store standard prices.</p>
                  )}
                </div>

                {/* Payments Log list */}
                <div className="h-[120px] overflow-y-auto space-y-1.5 mt-2">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-brand-text/50 block">Payment Ledger Receipts ({payments.length})</span>
                  {payments.map(p => (
                    <div key={p.id} className="p-1.5 border border-primary/5 rounded bg-brand-bg/25 flex justify-between">
                      <span className="font-english">{p.payment_date} ({p.payment_method})</span>
                      <span className="font-bold text-green-500 font-english">+{parseFloat(p.amount).toLocaleString()} EGP</span>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <p className="text-[9px] text-brand-text/40 text-center py-4 italic">No payments logged.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 text-brand-text/40">
                <Users className="w-12 h-12 stroke-[1.2] text-brand-text/30" />
                <p className="text-xs font-light max-w-[180px]">Select a wholesaler B2B profile from the directory to reconcile prices and ledgers.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Invoices Tab */
        <div className="space-y-4">
          <div className="overflow-x-auto bg-brand-card dark:bg-brand-dark-card border border-primary/5 rounded-2xl">
            <table className="w-full text-xs text-left text-brand-text">
              <thead>
                <tr className="border-b border-primary/5 bg-brand-bg/25 text-brand-text/50 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Customer Company</th>
                  <th className="p-3">Invoice Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Invoice Total</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Print</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const cust = wholesalers.find(w => w.id === inv.wholesaler_id) || {};
                  return (
                    <tr key={inv.id} className="border-b border-primary/5 hover:bg-brand-bg/5 transition-colors">
                      <td className="p-3 font-bold font-english text-primary">{inv.id}</td>
                      <td className="p-3 font-semibold">{cust.company_name || "Unknown"}</td>
                      <td className="p-3 font-english">{inv.invoice_date}</td>
                      <td className="p-3 font-english">{inv.payment_due_date || "Upon Receipt"}</td>
                      <td className="p-3 text-right font-bold font-english">{parseFloat(inv.total).toLocaleString()} EGP</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                          inv.payment_status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {inv.payment_status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handlePrintInvoice(inv)}
                          className="p-1 rounded hover:bg-primary/5 text-primary"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-brand-text/40 font-light italic">
                      No corporate wholesale invoices generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wholesaler Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                {editingWholesaler ? "Edit Wholesaler B2B Profile" : "Register Wholesaler Customer"}
              </h4>
              <button onClick={() => setShowModal(false)} className="text-brand-text/50 hover:text-brand-text text-sm font-semibold uppercase cursor-pointer">Close</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  placeholder="e.g. Sanaa Textiles Ltd"
                  value={form.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Ali Ahmed"
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="967..."
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Credit Limit (EGP)</label>
                  <input
                    type="number"
                    name="creditLimit"
                    value={form.creditLimit}
                    onChange={handleInputChange}
                    placeholder="100000"
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Custom Discount (%)</label>
                  <input
                    type="number"
                    name="customDiscount"
                    value={form.customDiscount}
                    onChange={handleInputChange}
                    placeholder="10"
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Tax ID / Number</label>
                  <input
                    type="text"
                    name="taxNumber"
                    value={form.taxNumber}
                    onChange={handleInputChange}
                    placeholder="TAX-8839"
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Payment Terms</label>
                  <select
                    name="paymentTerms"
                    value={form.paymentTerms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-medium"
                  >
                    <option value="COD">COD (Cash on Delivery)</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Wholesaler Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Special Price Mapping Modal */}
      {showPriceModal && selectedWholesaler && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">Map Special Product Price</h4>
              <button onClick={() => setShowPriceModal(false)} className="text-brand-text/50 hover:text-brand-text text-sm font-semibold uppercase cursor-pointer">Close</button>
            </div>

            <form onSubmit={handlePriceSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Select Website Product</label>
                <select
                  value={priceForm.productId}
                  onChange={(e) => setPriceForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-medium"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name?.en} (Standard: {p.priceEGP} EGP)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[10px] uppercase text-brand-text/60">Wholesale Price (EGP) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 750"
                  value={priceForm.specialPrice}
                  onChange={(e) => setPriceForm(prev => ({ ...prev, specialPrice: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Map Custom Price
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedWholesaler && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">Log Wholesale Receipt</h4>
              <button onClick={() => setShowPaymentModal(false)} className="text-brand-text/50 hover:text-brand-text text-sm font-semibold uppercase cursor-pointer">Close</button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Amount Paid (EGP) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 10000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Receipt Date *</label>
                  <input
                    type="date"
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
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-medium"
                >
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank Transfer">Bank wire</option>
                  <option value="Other">Check / Mobile Wallet</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Wholesale Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999]">
          <div className="bg-brand-card dark:bg-brand-dark-card border border-primary/10 rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text">Generate Corporate B2B Invoice</h4>
              <button 
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceForm(prev => ({ ...prev, items: [] }));
                }} 
                className="text-brand-text/50 hover:text-brand-text text-sm font-semibold uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">B2B Wholesaler Client *</label>
                  <select
                    required
                    value={invoiceForm.wholesalerId}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, wholesalerId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-medium"
                  >
                    <option value="">-- Select Company --</option>
                    {wholesalers.map(w => (
                      <option key={w.id} value={w.id}>{w.company_name} (Credit Limit: {w.credit_limit?.toLocaleString()} EGP)</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
              </div>

              {/* Product Selector to append items */}
              <div className="p-3 bg-brand-bg/15 rounded-xl border border-primary/5 space-y-2">
                <label className="font-bold text-[9px] uppercase tracking-wider text-brand-text/50">Add Items to invoice</label>
                <div className="flex gap-2">
                  <select
                    id="invoice-product-selector"
                    className="flex-1 px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-medium text-xs"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddInvoiceItem(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">-- Choose Product to add --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name?.en} ({p.priceEGP} EGP)</option>
                    ))}
                  </select>
                </div>

                {/* Interactive Items Table */}
                {invoiceForm.items.length > 0 && (
                  <div className="max-h-[120px] overflow-y-auto border border-primary/5 rounded-lg text-[10px] font-english">
                    <table className="w-full text-left">
                      <thead className="bg-brand-bg/15 text-[8px] uppercase tracking-wider text-brand-text/45">
                        <tr>
                          <th className="p-1.5">Product</th>
                          <th className="p-1.5 text-center">Qty</th>
                          <th className="p-1.5 text-right">Price</th>
                          <th className="p-1.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceForm.items.map((item, idx) => (
                          <tr key={item.productId} className="border-b border-primary/5">
                            <td className="p-1.5 font-medium truncate max-w-[150px]">{item.name}</td>
                            <td className="p-1.5 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  setInvoiceForm(prev => {
                                    const nextItems = [...prev.items];
                                    nextItems[idx].qty = val;
                                    nextItems[idx].total = (val * nextItems[idx].price) - nextItems[idx].discount;
                                    return { ...prev, items: nextItems };
                                  });
                                }}
                                className="w-10 text-center border border-primary/15 rounded bg-brand-bg"
                              />
                            </td>
                            <td className="p-1.5 text-right">{item.price} EGP</td>
                            <td className="p-1.5 text-right font-bold">{item.total} EGP</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Shipping Fee (EGP)</label>
                  <input
                    type="number"
                    value={invoiceForm.shipping}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, shipping: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-brand-text/60">Payment Due Date</label>
                  <input
                    type="date"
                    value={invoiceForm.paymentDueDate}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, paymentDueDate: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-primary/10 bg-brand-bg text-brand-text font-english"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/95 flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Generate Professional B2B Invoice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
