// ============================================================
//  API ROUTE: GET /api/topology
//  Returns topology config as JSON.
//
//  Query params (for demo/testing):
//    /api/topology?rows=5&cols=5
//
//  Replace the mock generator with your real data source:
//
//  Example — Prisma:
//    const [routers, bridges, connections] = await Promise.all([
//      prisma.router.findMany(),
//      prisma.bridge.findMany(),
//      prisma.connection.findMany(),
//    ]);
//    return NextResponse.json({ routers, bridges, connections });
//
//  Example — upstream REST API:
//    const config = await fetch(process.env.UPSTREAM_URL).then(r => r.json());
//    return NextResponse.json(config);
// ============================================================

import { NextResponse } from "next/server";
import { generateMockConfig } from "@/lib/topology/mock.js";

export async function GET(request) {
  const { searchParams } = request.nextUrl;

  const rows = Math.min(parseInt(searchParams.get("rows") ?? "3", 10), 100);
  const cols = Math.min(parseInt(searchParams.get("cols") ?? "3", 10), 100);

  // ── TODO: replace with real data source ───────────────────
  const config = generateMockConfig({ rows, cols });

  return NextResponse.json(config, {
    headers: {
      // Clients cache 10 s, CDN/edge 60 s, stale-while-revalidate
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=10",
    },
  });
}
