import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Public client for client-side or anon queries
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin client with service role for trusted server-side operations (bypasses RLS)
 */
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  }
  return createClient(supabaseUrl, serviceRoleKey);
};
