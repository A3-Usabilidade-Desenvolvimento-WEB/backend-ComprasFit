import { NextResponse } from "next/server";

function configuredOrigins(): string[] {
  const defaults = ["https://comprasfit-swart.vercel.app", "http://localhost:8081", "http://localhost:19006"];
  return [...defaults, ...(process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)];
}

function headersFor(request: Request): Headers {
  const headers = new Headers({ Vary: "Origin" });
  const origin = request.headers.get("origin");
  if (origin && configuredOrigins().includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}

export function applyCors(response: NextResponse, request: Request): NextResponse {
  for (const [key, value] of headersFor(request)) response.headers.set(key, value);
  return response;
}

export function corsPreflight(request: Request): NextResponse {
  return new NextResponse(null, { status: 204, headers: headersFor(request) });
}
