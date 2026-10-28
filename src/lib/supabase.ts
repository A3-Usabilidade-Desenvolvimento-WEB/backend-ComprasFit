import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function usesSupabase(): boolean {
  return process.env.DATA_STORE === "supabase";
}

export function getSupabase(): SupabaseClient {
  if (!usesSupabase()) {
    throw new Error("A persistência Supabase não está habilitada. Defina DATA_STORE=supabase após aplicar as migrations.");
  }

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórias no servidor quando DATA_STORE=supabase.");
  }

  client ??= createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return client;
}
