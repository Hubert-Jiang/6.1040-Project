import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { BeaverBazaarWireHttp } from "../generated/wire.ts";

const client = createHttpClient<BeaverBazaarWireHttp>({ baseUrl: "/api" });

async function init() {
  const result = await client["/marketplace/feed"]({});
  console.log("Marketplace feed:", result);
}

init();
