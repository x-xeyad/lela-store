/**
 * LELA ERP Professional Excel Export Service
 * Generates formatted multi-worksheet XML Spreadsheet files (SpreadsheetML)
 * compatible natively with Microsoft Excel and LibreOffice Calc.
 */
export const excelExportService = {
  exportErpLedger: ({
    products = [],
    orders = [],
    purchases = [],
    expenses = [],
    suppliers = [],
    representatives = [],
    wholesalers = [],
    wholesaleInvoices = [],
    shippingCompanies = [],
    treasuryTransactions = [],
    currency = "EGP",
    preparedBy = "LELA Admin",
    language = "en"
  }) => {
    try {
      const nowStr = new Date().toLocaleString();

      // Styles & Header declarations for Excel XML
      let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>LELA Concierge ERP</Author>
    <Created>${new Date().toISOString()}</Created>
    <Version>16.00</Version>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="Subtitle">
      <Font ss:FontName="Segoe UI" ss:Size="9" ss:Italic="1" ss:Color="#64748B"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders/>
    </Style>
    <Style ss:ID="TableHeader">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
      </Borders>
    </Style>
    <Style ss:ID="Zebra">
      <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="SummaryLabel">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1E293B"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#475569"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
      </Borders>
    </Style>
    <Style ss:ID="SummaryValue">
      <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#475569"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
      </Borders>
    </Style>
    <Style ss:ID="NumberCell">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
    <Style ss:ID="CenterCell">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
  </Styles>\n`;

      // Helper to escape XML
      const escapeXml = (unsafe) => {
        if (unsafe === undefined || unsafe === null) return "";
        return String(unsafe)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
      };

      // Helper to generate a styled sheet
      const generateSheet = (sheetName, subtitle, columns, headers, rows, summaryRow = null) => {
        let sheetXml = `  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table ss:DefaultRowHeight="20">\n`;

        // Column widths
        columns.forEach(w => {
          sheetXml += `      <Column ss:Width="${w}" ss:AutoFitWidth="1"/>\n`;
        });

        // Report Meta Row 1 (Title)
        sheetXml += `      <Row ss:Height="24">
        <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="Title">
          <Data ss:Type="String">${escapeXml(sheetName)} Report - LELA Concierge</Data>
        </Cell>
      </Row>\n`;

        // Report Meta Row 2 (Subtitle/Period)
        sheetXml += `      <Row ss:Height="18">
        <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="Subtitle">
          <Data ss:Type="String">${escapeXml(subtitle)} | Generated: ${nowStr} | Currency: ${currency} | Prepared By: ${escapeXml(preparedBy)}</Data>
        </Cell>
      </Row>\n`;

        // Space Row
        sheetXml += `      <Row ss:Height="10"></Row>\n`;

        // Header Row (Row 4)
        sheetXml += `      <Row ss:Height="22">\n`;
        headers.forEach(h => {
          sheetXml += `        <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`;
        });
        sheetXml += `      </Row>\n`;

        // Data Rows
        rows.forEach((r, idx) => {
          const isZebra = idx % 2 === 1;
          const zebraStyle = isZebra ? ' ss:StyleID="Zebra"' : "";
          sheetXml += `      <Row ss:Height="20">\n`;
          r.forEach(cell => {
            const val = cell.value;
            const type = cell.type || "String";
            
            // Reconcile custom style if present (like NumberCell or CenterCell)
            let styleAttr = zebraStyle;
            if (cell.style) {
              styleAttr = ` ss:StyleID="${cell.style}${isZebra ? 'Zebra' : ''}"`;
              // Register hybrid styles if necessary or just use direct styles
              styleAttr = ` ss:StyleID="${cell.style}"`;
            }

            sheetXml += `        <Cell${styleAttr}><Data ss:Type="${type}">${type === 'Number' ? val : escapeXml(val)}</Data></Cell>\n`;
          });
          sheetXml += `      </Row>\n`;
        });

        // Totals/Summary Row (if provided)
        if (summaryRow) {
          sheetXml += `      <Row ss:Height="22">\n`;
          summaryRow.forEach(cell => {
            const styleAttr = ` ss:StyleID="${cell.style || 'SummaryLabel'}"`;
            sheetXml += `        <Cell${styleAttr}><Data ss:Type="${cell.type || 'String'}">${cell.type === 'Number' ? cell.value : escapeXml(cell.value)}</Data></Cell>\n`;
          });
          sheetXml += `      </Row>\n`;
        }

        sheetXml += `    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <PageSetup>
        <Layout x:Orientation="Landscape"/>
      </PageSetup>
      <Selected/>
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>4</SplitHorizontal>
      <TopRowBottomPane>4</TopRowBottomPane>
      <ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>\n`;

        return sheetXml;
      };

      // --- SHEET 1: SALES ---
      const salesHeaders = ["Order No", "Customer", "Representative", "Date", "Items Count", "Subtotal", "Shipping", "Discount", "Net Total (EGP)", "Status"];
      const salesCols = [80, 120, 120, 100, 80, 80, 80, 80, 90, 80];
      const salesRows = orders.map(o => {
        const itemsCount = (o.items || []).reduce((acc, item) => acc + parseInt(item.quantity || 1, 10), 0);
        const rep = representatives.find(r => r.id === o.representative_id);
        const repName = rep ? rep.name : "None / Storefront";
        return [
          { value: o.id },
          { value: o.customer?.name || "Retail Customer" },
          { value: repName },
          { value: o.createdAt ? o.createdAt.split("T")[0] : "" },
          { value: itemsCount, type: "Number", style: "CenterCell" },
          { value: o.totalEGP || 0, type: "Number", style: "NumberCell" },
          { value: o.shipping_cost_egp || 0, type: "Number", style: "NumberCell" },
          { value: o.discount_amount || 0, type: "Number", style: "NumberCell" },
          { value: o.totalEGP || 0, type: "Number", style: "NumberCell" },
          { value: o.status || "completed", style: "CenterCell" }
        ];
      });
      const totSalesNet = orders.reduce((acc, o) => acc + (o.totalEGP || 0), 0);
      const salesSummary = [
        { value: "Total Sales" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" },
        { value: totSalesNet, type: "Number", style: "SummaryValue" }, { value: "" }
      ];
      xml += generateSheet("Sales", "Completed Storefront Orders", salesCols, salesHeaders, salesRows, salesSummary);

      // --- SHEET 2: PRODUCTS ---
      const prodHeaders = ["Product ID", "Name", "Category", "Avg Purchase Cost", "Cairo profit", "Selling Price", "Available Stock", "Weight (KG)"];
      const prodCols = [240, 180, 100, 110, 90, 90, 90, 80];
      const prodRows = products.map(p => [
        { value: p.id },
        { value: p.name?.en || "" },
        { value: p.category },
        { value: p.purchaseCost || 0, type: "Number", style: "NumberCell" },
        { value: p.profitEGP || 0, type: "Number", style: "NumberCell" },
        { value: p.priceEGP || 0, type: "Number", style: "NumberCell" },
        { value: p.stock || 0, type: "Number", style: "CenterCell" },
        { value: p.weight || 0.5, type: "Number", style: "CenterCell" }
      ]);
      xml += generateSheet("Products", "Storefront Products List", prodCols, prodHeaders, prodRows);

      // --- SHEET 3: ORDERS ---
      const orderHeaders = ["Order No", "Customer Name", "Phone", "Governorate", "Items Detailed", "Exchange Rate", "Total YER", "Status"];
      const orderCols = [85, 120, 100, 100, 240, 90, 90, 80];
      const orderRows = orders.map(o => {
        const itemDetails = (o.items || []).map(i => `${i.product?.name?.en} (x${i.quantity})`).join(", ");
        return [
          { value: o.id },
          { value: o.customer?.name || "" },
          { value: o.customer?.phone || "" },
          { value: o.customer?.governorate || "" },
          { value: itemDetails },
          { value: o.exchange_rate || 11.5, type: "Number", style: "NumberCell" },
          { value: o.totalYER || 0, type: "Number", style: "NumberCell" },
          { value: o.status || "pending", style: "CenterCell" }
        ];
      });
      xml += generateSheet("Orders", "Customer Sourcing & Orders Ledger", orderCols, orderHeaders, orderRows);

      // --- SHEET 4: SMART INVENTORY ---
      const invHeaders = ["SKU / Product", "Available Stock", "Reserved Stock", "Incoming Stock", "Damaged Stock", "Returned Stock", "Sold Quantity", "Valuation (EGP)"];
      const invCols = [180, 100, 100, 100, 100, 100, 100, 120];
      const invRows = products.map(p => {
        const val = (p.stock || 0) * (p.purchaseCost || 0);
        return [
          { value: p.name?.en || "Unnamed" },
          { value: p.stock || 0, type: "Number", style: "CenterCell" },
          { value: p.reserved_stock || 0, type: "Number", style: "CenterCell" },
          { value: p.incoming_stock || 0, type: "Number", style: "CenterCell" },
          { value: p.damaged_stock || 0, type: "Number", style: "CenterCell" },
          { value: p.returned_stock || 0, type: "Number", style: "CenterCell" },
          { value: p.sold_quantity || 0, type: "Number", style: "CenterCell" },
          { value: val, type: "Number", style: "NumberCell" }
        ];
      });
      const totInvVal = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.purchaseCost || 0)), 0);
      const invSummary = [
        { value: "Total Inventory Value" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" },
        { value: totInvVal, type: "Number", style: "SummaryValue" }
      ];
      xml += generateSheet("Inventory", "Smart Inventory Balance & Ratios", invCols, invHeaders, invRows, invSummary);

      // --- SHEET 5: SUPPLIERS ---
      const supplierHeaders = ["Supplier Name", "Country", "Phone", "Email", "Total Purchase Batches", "Outstanding Balance (EGP)"];
      const supCols = [180, 100, 100, 140, 130, 150];
      const supplierRows = suppliers.map(s => {
        const supplierPurchases = purchases.filter(p => p.supplier_id === s.id);
        const totalPurchasesCost = supplierPurchases.reduce((acc, p) => acc + (parseFloat(p.purchase_cost) * parseInt(p.quantity, 10)) + parseFloat(p.shipping_cost || 0), 0);
        // Balance calculation logic
        return [
          { value: s.name },
          { value: s.country || "Egypt" },
          { value: s.phone || "" },
          { value: s.email || "" },
          { value: supplierPurchases.length, type: "Number", style: "CenterCell" },
          { value: totalPurchasesCost, type: "Number", style: "NumberCell" }
        ];
      });
      xml += generateSheet("Suppliers", "Registered Sourcing Vendors", supCols, supplierHeaders, supplierRows);

      // --- SHEET 6: EXPENSES ---
      const expHeaders = ["Expense ID", "Category", "Amount (EGP)", "Date", "Description", "Notes"];
      const expCols = [100, 120, 100, 100, 200, 160];
      const expenseRows = expenses.map(e => [
        { value: e.id ? e.id.substring(0, 8) : "" },
        { value: e.category },
        { value: e.amount || 0, type: "Number", style: "NumberCell" },
        { value: e.date || "" },
        { value: e.description || "" },
        { value: e.notes || "" }
      ]);
      const totExpensesVal = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
      const expSummary = [
        { value: "Total Expenses" }, { value: "" }, { value: totExpensesVal, type: "Number", style: "SummaryValue" }, { value: "" }, { value: "" }, { value: "" }
      ];
      xml += generateSheet("Expenses", "Operational Expenses Ledger", expCols, expHeaders, expenseRows, expSummary);

      // --- SHEET 7: REPRESENTATIVES ---
      const repHeaders = ["Representative Name", "Phone", "City", "Commission Type", "Total Orders", "Total Commission (EGP)"];
      const repCols = [150, 100, 100, 110, 100, 140];
      const repRows = representatives.map(r => {
        const repOrders = orders.filter(o => o.representative_id === r.id);
        const earned = repOrders.reduce((acc, o) => {
          if (r.commission_type === 'percentage') {
            return acc + (o.totalEGP * (parseFloat(r.commission_value || 0) / 100));
          } else {
            return acc + parseFloat(r.commission_value || 0);
          }
        }, 0);
        return [
          { value: r.name },
          { value: r.phone || "" },
          { value: r.city || "" },
          { value: r.commission_type === 'percentage' ? `${r.commission_value}%` : `${r.commission_value} EGP Fixed` },
          { value: repOrders.length, type: "Number", style: "CenterCell" },
          { value: earned, type: "Number", style: "NumberCell" }
        ];
      });
      xml += generateSheet("Representatives", "Sales Representatives Commission Audit", repCols, repHeaders, repRows);

      // --- SHEET 8: WHOLESALE CUSTOMERS ---
      const wholesaleCustHeaders = ["Wholesaler Name", "Contact Person", "Phone", "Email", "Tax ID", "Credit Limit (EGP)", "Discount (%)"];
      const wcCols = [180, 120, 100, 140, 100, 120, 90];
      const wcRows = wholesalers.map(w => [
        { value: w.company_name },
        { value: w.contact_person || "" },
        { value: w.phone || "" },
        { value: w.email || "" },
        { value: w.tax_number || "" },
        { value: w.credit_limit || 0, type: "Number", style: "NumberCell" },
        { value: w.custom_discount || 0, type: "Number", style: "CenterCell" }
      ]);
      xml += generateSheet("Wholesalers", "Corporate B2B Customers", wcCols, wholesaleCustHeaders, wcRows);

      // --- SHEET 9: PURCHASES ---
      const purchaseHeaders = ["Purchase ID", "Item / SKU", "Supplier", "Quantity", "Unit Cost (EGP)", "Shipping (EGP)", "Total cost (EGP)", "Date"];
      const purCols = [100, 160, 140, 80, 100, 100, 120, 100];
      const purRows = purchases.map(p => {
        const sup = suppliers.find(s => s.id === p.supplier_id);
        const totalCostVal = (parseFloat(p.purchase_cost) * parseInt(p.quantity, 10)) + parseFloat(p.shipping_cost || 0);
        return [
          { value: p.id ? p.id.substring(0, 8) : "" },
          { value: p.product_name || "New Item" },
          { value: sup ? sup.name : "Direct Market Sourcing" },
          { value: p.quantity || 0, type: "Number", style: "CenterCell" },
          { value: p.purchase_cost || 0, type: "Number", style: "NumberCell" },
          { value: p.shipping_cost || 0, type: "Number", style: "NumberCell" },
          { value: totalCostVal, type: "Number", style: "NumberCell" },
          { value: p.purchase_date || "" }
        ];
      });
      xml += generateSheet("Purchases", "Supplier Invoice Sourcing History", purCols, purchaseHeaders, purRows);

      // --- SHEET 10: SHIPPING COMPANIES ---
      const shipHeaders = ["Shipping Company Name", "Governate Coverage", "Rate per KG (EGP)", "Base Delivery Rate (EGP)", "Extra Charge (%)"];
      const shipCols = [180, 150, 120, 130, 110];
      const shipRows = shippingCompanies.map(sc => [
        { value: sc.name },
        { value: sc.governorates ? sc.governorates.join(", ") : "All Yemen" },
        { value: sc.rate_per_kg || 0, type: "Number", style: "NumberCell" },
        { value: sc.base_rate || 0, type: "Number", style: "NumberCell" },
        { value: sc.extra_charge || 0, type: "Number", style: "CenterCell" }
      ]);
      xml += generateSheet("Shipping", "Logistics Shipping Providers", shipCols, shipHeaders, shipRows);

      // --- SHEET 11: FINANCIAL SUMMARY ---
      const summaryHeaders = ["Financial Metric Description", "Balance Sum (EGP)"];
      const summaryCols = [300, 160];
      
      const salesSum = orders.reduce((acc, o) => acc + (o.totalEGP || 0), 0);
      const purchaseSum = purchases.reduce((acc, p) => acc + (parseFloat(p.purchase_cost) * parseInt(p.quantity, 10)) + parseFloat(p.shipping_cost || 0), 0);
      const expenseSum = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
      const treasuryBalance = treasuryTransactions.reduce((acc, t) => {
        if (t.transaction_type === 'cash_in' || t.transaction_type === 'deposit') return acc + parseFloat(t.amount || 0);
        return acc - parseFloat(t.amount || 0);
      }, 0);

      const summaryRows = [
        [ { value: "Gross Storefront Sales Revenue" }, { value: salesSum, type: "Number", style: "NumberCell" } ],
        [ { value: "Supplier Purchases Sourcing Cost" }, { value: purchaseSum, type: "Number", style: "NumberCell" } ],
        [ { value: "Operational Expenses & Salaries" }, { value: expenseSum, type: "Number", style: "NumberCell" } ],
        [ { value: "Treasury Real Cash Balance" }, { value: treasuryBalance, type: "Number", style: "NumberCell" } ],
        [ { value: "Net Profit / Yield" }, { value: salesSum - purchaseSum - expenseSum, type: "Number", style: "NumberCell" } ]
      ];
      xml += generateSheet("Financial Summary", "LELA Executive Financial Statement Overview", summaryCols, summaryHeaders, summaryRows);

      // Closing Workbook tags
      xml += `</Workbook>`;

      // Create blob and download client-side as .xls
      const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `lela_concierge_erp_ledger_${new Date().toISOString().split('T')[0]}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Excel XML generation failure:", err);
      throw new Error("Professional Excel ledger compilation failed.");
    }
  }
};
