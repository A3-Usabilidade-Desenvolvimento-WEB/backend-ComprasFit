import { afterEach, describe, expect, it } from "vitest";
import { corsPreflight } from "@/lib/cors";

afterEach(() => delete process.env.CORS_ORIGIN);

describe("corsPreflight", () => {
  it("libera somente a origem configurada e o header Authorization", () => {
    process.env.CORS_ORIGIN = "https://app.comprasfit.example";
    const response = corsPreflight(new Request("https://api.comprasfit.example/api/planejamento", {
      method: "OPTIONS",
      headers: { origin: "https://app.comprasfit.example" },
    }));
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://app.comprasfit.example");
    expect(response.headers.get("access-control-allow-headers")).toContain("Authorization");
  });

  it("não emite cabeçalho permissivo para origem não autorizada", () => {
    process.env.CORS_ORIGIN = "https://app.comprasfit.example";
    const response = corsPreflight(new Request("https://api.comprasfit.example/api/planejamento", {
      method: "OPTIONS",
      headers: { origin: "https://other.example" },
    }));
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});
