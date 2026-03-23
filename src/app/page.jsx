// ============================================================
//  PAGE — Server Component
//  Fetches topology config on the server before rendering.
//  Zero client-side loading flicker for the initial topology.
//
//  To connect a real backend, replace generateMockConfig()
//  with a fetch() call or direct DB query. Example:
//
//    const res = await fetch(`${process.env.API_BASE_URL}/topology`, {
//      next: { revalidate: 30 },  // ISR: refresh every 30 s
//    });
//    const config = await res.json();
// ============================================================

import { TopologyPage } from "@/components/topology/TopologyPage.jsx";
import { generateMockConfig } from "@/lib/topology/mock.js";

async function getTopologyConfig() {
  // ── Replace this with your real data source ────────────────
  return generateMockConfig({ rows: 10, cols: 10 });

  // ── Example: fetch from your internal API route ────────────
  // const res = await fetch('http://localhost:3000/api/topology', {
  //   cache: 'no-store',
  // });
  // if (!res.ok) throw new Error('Failed to fetch topology config');
  // return res.json();
}

export default async function Page() {
  const config = await getTopologyConfig();

  // TopologyPage is 'use client'.
  // Passing serialisable config as a prop is the correct
  // Next.js App Router pattern for Server → Client handoff.
  return <TopologyPage initialConfig={config} />;
}
