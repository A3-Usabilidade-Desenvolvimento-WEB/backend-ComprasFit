import { afterEach, describe, expect, it } from "vitest";
import { requireAuthenticatedUser } from "@/lib/auth";

afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
});

describe("requireAuthenticatedUser", () => {
  it("rejeita uma requisição sem token Bearer", async () => {
    const result = await requireAuthenticatedUser(new Request("http://localhost/api/planejamento"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("não tenta validar token sem a configuração pública do Supabase", async () => {
    const result = await requireAuthenticatedUser(new Request("http://localhost/api/planejamento", {
      headers: { authorization: "Bearer valid-looking-token" },
    }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(500);
  });
});
