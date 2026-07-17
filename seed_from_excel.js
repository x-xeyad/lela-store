import XLSX from "xlsx";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fxtljyedamlvmzqgwnxj.supabase.co";
const supabaseAnonKey = "sb_publishable_dpcdtfyUjUOIQwYqxN2eqg_NAZbnqvw";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const file1Path = "C:/Users/XPRISTO/.gemini/antigravity/scratch/lela-ecommerce/منتجات ملف نهائي (version 1).xlsb.xlsx";
const file2Path = "C:/Users/XPRISTO/.gemini/antigravity/scratch/lela-ecommerce/المصنف1.xlsx";
const logPath = "./imported_ids.json";

const convertExcelDate = (serial) => {
  if (!serial || isNaN(serial)) return new Date().toISOString();
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString();
};

const cleanName = (name) => String(name || "").trim().toLowerCase();

async function runSeed() {
  console.log("Starting Excel Seeding script for both files...");
  
  let importedProductIds = [];
  let importedOrderIds = [];
  
  // Read existing log to preserve previously imported IDs
  if (fs.existsSync(logPath)) {
    try {
      const prevLog = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      importedProductIds = prevLog.products || [];
      importedOrderIds = prevLog.orders || [];
      console.log(`Loaded existing import log: ${importedProductIds.length} products, ${importedOrderIds.length} orders.`);
    } catch (e) {
      console.warn("⚠️ Could not read previous log file.");
    }
  }

  try {
    // Authenticate
    console.log("Authenticating as admin...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "admin@lela.com",
      password: "lela2026"
    });

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    // Load database products map
    const { data: existingDbProducts } = await supabase.from("products").select("id, name");
    const existingNameMap = new Map();
    (existingDbProducts || []).forEach(p => {
      if (p.name?.ar) existingNameMap.set(cleanName(p.name.ar), p.id);
      if (p.name?.en) existingNameMap.set(cleanName(p.name.en), p.id);
    });

    const productsToInsert = [];

    // ==========================================
    // PHASE A: PROCESS PRODUCTS FROM FILE 1
    // ==========================================
    if (fs.existsSync(file1Path)) {
      console.log("Processing File 1 products...");
      const workbook1 = XLSX.readFile(file1Path);
      const targetSheets1 = [
        { key: "المشتريات", defaultCat: "General" },
        { key: "بيع للتجار مع التفاصيل", defaultCat: "Wholesale" },
        { key: "اكسسوارات", defaultCat: "Accessories" }
      ];

      for (const sheetTarget of targetSheets1) {
        const actualName = workbook1.SheetNames.find(name => name.trim() === sheetTarget.key);
        if (!actualName) continue;
        
        const sheet = workbook1.Sheets[actualName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        for (const row of rows) {
          const prodName = row["اسم المنتج "] || row["اسم المنتج"];
          if (!prodName) continue;

          const arName = String(prodName).trim();
          const cleaned = cleanName(arName);

          if (existingNameMap.has(cleaned) || productsToInsert.some(p => cleanName(p.name.ar) === cleaned)) {
            continue;
          }

          const costEgp = parseFloat(row["التكلفة النهائية "] || row["سعر الحافظ"] || 0) || 0;
          const priceEgp = parseFloat(row["سعر نهائي جنية"] || row["سعر نهائي جنية "] || row["سعر التجزئة"] || 0) || 0;
          const profitEgp = parseFloat(row["ربحي ج"] || 0) || 0;
          const itemWeight = parseFloat(row["الوزن الفعلي "] || row["الوزن الفعلي"] || 0) || 0;

          productsToInsert.push({
            name: { ar: arName, en: arName },
            description: { ar: `منتج مستورد: ${arName}`, en: `Imported item: ${arName}` },
            category: sheetTarget.defaultCat,
            price_egp: priceEgp,
            cost_egp: costEgp,
            purchase_cost: costEgp,
            profit_egp: profitEgp,
            weight: itemWeight / 1000,
            stock: 15,
            status: "visible",
            featured: false,
            images: ["/placeholder.png"]
          });
        }
      }
    }

    // ==========================================
    // PHASE B: PROCESS PRODUCTS FROM FILE 2 (المصنف1.xlsx)
    // ==========================================
    if (fs.existsSync(file2Path)) {
      console.log("Processing File 2 (المصنف1.xlsx) products...");
      const workbook2 = XLSX.readFile(file2Path);
      const actualName = workbook2.SheetNames.find(name => name.trim().includes("الشحنات"));
      
      if (actualName) {
        const sheet = workbook2.Sheets[actualName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        for (const row of rows) {
          const prodName = row["اسم الصنف"] || row["اسم الصنف "];
          if (!prodName) continue;

          const arName = String(prodName).trim();
          const cleaned = cleanName(arName);

          if (existingNameMap.has(cleaned) || productsToInsert.some(p => cleanName(p.name.ar) === cleaned)) {
            continue;
          }

          const costEgp = parseFloat(row["سعر الجملة"]) || 0;
          const priceEgp = parseFloat(row["سعر البيع بالجنيه"]) || 0;
          const profitEgp = parseFloat(row["ربحي ج"]) || 0;

          productsToInsert.push({
            name: { ar: arName, en: arName },
            description: { ar: `منتج مستورد من الشحنات: ${arName}`, en: `Imported shipment item: ${arName}` },
            category: "General",
            price_egp: priceEgp,
            cost_egp: costEgp,
            purchase_cost: costEgp,
            profit_egp: profitEgp,
            weight: 0.5,
            stock: 15,
            status: "visible",
            featured: false,
            images: ["/placeholder.png"]
          });
        }
      }
    }

    // Insert Stage Products
    console.log(`Inserting ${productsToInsert.length} new products into database...`);
    if (productsToInsert.length > 0) {
      const { data: insertedProds, error: prodErr } = await supabase
        .from("products")
        .insert(productsToInsert)
        .select();

      if (prodErr) throw prodErr;
      (insertedProds || []).forEach(p => {
        importedProductIds.push(p.id);
        existingNameMap.set(cleanName(p.name.ar), p.id);
      });
      console.log(`✅ Successfully seeded ${insertedProds.length} new products.`);
    } else {
      console.log("No new products to insert.");
    }

    const ordersToInsert = [];

    // ==========================================
    // PHASE C: PROCESS ORDERS FROM FILE 1
    // ==========================================
    if (fs.existsSync(file1Path)) {
      const workbook1 = XLSX.readFile(file1Path);
      const orderSheetNames1 = workbook1.SheetNames.filter(name => name.trim() === "الطلبات");

      for (const sheetName of orderSheetNames1) {
        const sheet = workbook1.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        console.log(`Processing ${rows.length} rows in File 1 [${sheetName}] for orders...`);

        for (const row of rows) {
          const clientName = row["اسم العميل"] || row["اسم العميل "];
          const productName = row["المنتج"] || row["المنتج "];
          if (!clientName || !productName) continue;

          const totalPaid = parseFloat(row["المبلغ المدفوع  "] || row["المبلغ المدفوع"] || 0) || 0;
          const totalRemaining = parseFloat(row["المبلغ المتبقي "] || row["المبلغ المتبقي"] || 0) || 0;
          const totalYer = totalPaid + totalRemaining;
          const exchangeRate = 11.5;
          const totalEgp = totalYer / exchangeRate;

          const cleanedProdName = cleanName(productName);
          const matchedProdId = existingNameMap.get(cleanedProdName) || null;
          const qty = parseInt(row["العدد"] || row["العدد "] || 1, 10);

          const itemsArray = [{
            product: {
              id: matchedProdId,
              name: { ar: productName, en: productName },
              priceEGP: totalEgp / qty
            },
            quantity: qty,
            price: totalEgp / qty
          }];

          const orderId = `EXCEL-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

          ordersToInsert.push({
            id: orderId,
            customer: {
              name: String(clientName).trim(),
              phone: String(row["رقم التلفون "] || row["طريقة التواصل "] || ""),
              governorate: "Sanaa",
              address: "Sanaa"
            },
            items: itemsArray,
            total_egp: totalEgp,
            total_yer: totalYer,
            selected_currency: "YER",
            exchange_rate: exchangeRate,
            status: totalRemaining === 0 ? "completed" : "pending",
            discount_amount: 0,
            created_at: convertExcelDate(row["تاريخ الطلب "] || row["تاريخ الطلب"])
          });
        }
      }
    }

    // ==========================================
    // PHASE D: PROCESS ORDERS FROM FILE 2 (المصنف1.xlsx)
    // ==========================================
    if (fs.existsSync(file2Path)) {
      const workbook2 = XLSX.readFile(file2Path);
      const actualName = workbook2.SheetNames.find(name => name.trim().includes("الشحنات"));

      if (actualName) {
        const sheet = workbook2.Sheets[actualName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        console.log(`Processing ${rows.length} rows in File 2 [${actualName}] for orders...`);

        for (const row of rows) {
          const clientName = row["__EMPTY"] || row["الجهة"];
          const productName = row["اسم الصنف"];
          if (!clientName || !productName) continue;

          const totalPaid = parseFloat(row["المقدم"] || 0) || 0;
          const totalRemaining = parseFloat(row["المتبقي"] || 0) || 0;
          const totalYer = totalPaid + totalRemaining;
          const exchangeRate = 11.5;
          const totalEgp = totalYer / exchangeRate;

          const cleanedProdName = cleanName(productName);
          const matchedProdId = existingNameMap.get(cleanedProdName) || null;
          const qty = parseInt(row["العدد"] || 1, 10);

          const itemsArray = [{
            product: {
              id: matchedProdId,
              name: { ar: productName, en: productName },
              priceEGP: totalEgp / qty
            },
            quantity: qty,
            price: totalEgp / qty
          }];

          const orderId = `EXCEL-SHIP-${Math.floor(100000 + Math.random() * 900000)}`;

          ordersToInsert.push({
            id: orderId,
            customer: {
              name: String(clientName).trim(),
              phone: String(row["رقم التلفون "] || ""),
              governorate: String(row["الجهة"] || "Sanaa"),
              address: String(row["الصندوق"] || row["الصندوق_1"] || "Sanaa")
            },
            items: itemsArray,
            total_egp: totalEgp,
            total_yer: totalYer,
            selected_currency: "YER",
            exchange_rate: exchangeRate,
            status: totalRemaining === 0 ? "completed" : "pending",
            discount_amount: 0,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // Filter out orders that already exist or duplicates staged
    const uniqueOrdersToInsert = ordersToInsert.filter((ord, idx, self) =>
      self.findIndex(o => o.customer.name === ord.customer.name && o.created_at === ord.created_at) === idx
    );

    console.log(`Inserting ${uniqueOrdersToInsert.length} orders into database...`);
    if (uniqueOrdersToInsert.length > 0) {
      const { data: insertedOrders, error: orderErr } = await supabase
        .from("orders")
        .insert(uniqueOrdersToInsert)
        .select();

      if (orderErr) throw orderErr;
      (insertedOrders || []).forEach(o => {
        importedOrderIds.push(o.id);
      });
      console.log(`✅ Successfully seeded ${insertedOrders.length} orders.`);
    } else {
      console.log("No new orders to insert.");
    }

    // 4. Save combined imported IDs log for easy rollback
    const importLog = {
      timestamp: new Date().toISOString(),
      products: importedProductIds,
      orders: importedOrderIds
    };
    fs.writeFileSync(logPath, JSON.stringify(importLog, null, 2));
    console.log(`💾 Saved batch records mapping details to ${logPath} for easy delete/rollback!`);

  } catch (err) {
    console.error("❌ Seeding process error:", err);
  }
}

runSeed();
