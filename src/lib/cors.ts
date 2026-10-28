import { NextResponse } from "next/server";

function configuredOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function headersFor(request: Request): Headers {
  const headers = new Headers({ Vary: "Origin" });
  const origin = request.headers.get("origin");
  if (origin && configuredOrigins().includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
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
