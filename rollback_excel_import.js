import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fxtljyedamlvmzqgwnxj.supabase.co";
const supabaseAnonKey = "sb_publishable_dpcdtfyUjUOIQwYqxN2eqg_NAZbnqvw";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const logPath = "./imported_ids.json";

async function runRollback() {
  console.log("Starting rollback process...");
  
  if (!fs.existsSync(logPath)) {
    console.error("❌ No imported_ids.json batch log found! Cannot rollback automatically.");
    return;
  }

  try {
    // Authenticate as admin
    console.log("Authenticating as admin...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "admin@lela.com",
      password: "lela2026"
    });

    if (authError) {
      console.warn("⚠️ Admin login failed, attempting fallback password...");
      const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
        email: "admin@lela.com",
        password: "lela"
      });
      if (authError2) {
        throw new Error(`Authentication failed: ${authError2.message}`);
      }
    }

    const importLog = JSON.parse(fs.readFileSync(logPath, "utf-8"));
    const { products, orders } = importLog;

    console.log(`Rollback targets: ${products.length} products, ${orders.length} orders.`);

    // 1. Delete imported orders
    if (orders.length > 0) {
      console.log(`Deleting ${orders.length} orders...`);
      const { error: orderErr } = await supabase
        .from("orders")
        .delete()
        .in("id", orders);

      if (orderErr) {
        console.error("❌ Error deleting orders:", orderErr.message);
      } else {
        console.log("✅ Orders deleted successfully.");
      }
    }

    // 2. Delete imported products
    if (products.length > 0) {
      console.log(`Deleting ${products.length} products...`);
      const { error: prodErr } = await supabase
        .from("products")
        .delete()
        .in("id", products);

      if (prodErr) {
        console.error("❌ Error deleting products:", prodErr.message);
      } else {
        console.log("✅ Products deleted successfully.");
      }
    }

    // Remove log file
    fs.unlinkSync(logPath);
    console.log("🧹 Cleaned up imported_ids.json batch file. Rollback complete!");

  } catch (err) {
    console.error("❌ Rollback failed:", err);
  }
}

runRollback();
