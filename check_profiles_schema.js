import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fxtljyedamlvmzqgwnxj.supabase.co";
const supabaseAnonKey = "sb_publishable_dpcdtfyUjUOIQwYqxN2eqg_NAZbnqvw";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runCheck() {
  console.log("Checking profiles table schema metadata...");
  
  // Authenticate as admin
  await supabase.auth.signInWithPassword({
    email: "admin@lela.com",
    password: "lela2026"
  });

  // Query PostgreSQL columns information
  const { data, error } = await supabase.rpc("inspect_table_columns", { tbl_name: "profiles" });
  
  if (error) {
    console.warn("⚠️ RPC columns inspect failed (RPC inspect_table_columns may not exist). Attempting direct schema query...");
    
    // Fallback: Query using postgrest sql if allowed, or query profiles directly
    const { data: directData, error: directErr } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    if (directErr) {
      console.error("❌ Direct query failed:", directErr.message);
    } else {
      console.log("✅ Direct select succeeded. Row columns:", Object.keys(directData[0] || {}));
    }
  } else {
    console.log("📊 Profiles Columns:", data);
  }
}

runCheck();
