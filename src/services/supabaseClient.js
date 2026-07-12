import { createClient } from "@supabase/supabase-js";

// Resilient fallbacks to prevent uncaught exceptions if environment keys are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error(
    "CRITICAL: Supabase environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing!\n" +
    "Please create a '.env' file in the root directory and add your Supabase credentials."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
