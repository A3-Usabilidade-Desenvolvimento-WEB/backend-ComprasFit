import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { applyCors } from "@/lib/cors";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export type AuthenticationResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse };

function errorResponse(request: Request, status: number, message: string): AuthenticationResult {
  return {
    ok: false,
    response: applyCors(NextResponse.json({ error: message }, { status }), request),
  };
}

/** Validates a bearer JWT with Supabase Auth before private API operations. */
export async function requireAuthenticatedUser(request: Request): Promise<AuthenticationResult> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return errorResponse(request, 401, "Token de autenticação ausente");
  }

  const token = authorization.slice("Bearer ".length).trim();
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return errorResponse(request, 500, "Autenticação do servidor não configurada");
  }

  const authClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return errorResponse(request, 401, "Token de autenticação inválido ou expirado");

  return { ok: true, user: { id: data.user.id, email: data.user.email } };
}
