import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { BeaverBazaarWireHttp } from "../generated/wire.ts";

export const client = createHttpClient<BeaverBazaarWireHttp>({ baseUrl: "/api" });

export interface ListingItem {
  listing: string;
  auction: string;
  sellerAlias: string;
  item: string;
  price: number;
  increment: number;
  buyout: number | null;
  highestBidder: string | null;
  isSeller: boolean;
  isHighestBidder: boolean;
}

export interface NotificationItem {
  notification: string;
  message: string;
}

export interface PresetUser {
  label: string;
  username: string;
  defaultName: string;
  defaultContact: string;
}

export const PRESETS: PresetUser[] = [
  { label: "Alice (Test Account)", username: "alice@mit.edu", defaultName: "Alice Doe", defaultContact: "617-555-0101" },
  { label: "Bob (Test Account)", username: "bob@mit.edu", defaultName: "Bob Smith", defaultContact: "bob@mit.edu" },
];
