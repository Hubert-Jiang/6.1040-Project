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

export interface ParsedSettlement {
  type: "won" | "sold" | "general";
  item: string;
  alias: string;
  identity: string;
  contact: string | null;
  price: number | null;
  instruction: string;
  raw: string;
}

export function parseSettlementNotification(msg: string): ParsedSettlement {
  const isWon = msg.startsWith("You won the auction for \"");
  const isSold = msg.startsWith("Your auction for \"");

  if (!isWon && !isSold) {
    return {
      type: "general",
      item: "Settlement Notice",
      alias: "",
      identity: "",
      contact: null,
      price: null,
      instruction: msg,
      raw: msg,
    };
  }

  const type = isWon ? "won" : "sold";
  const itemMatch = msg.match(/auction for "([^"]+)"/);
  const item = itemMatch ? itemMatch[1] : "Auction Item";

  const priceMatch = msg.match(/(?:for|\bat)\s*\$([0-9]+(?:\.[0-9]+)?)/);
  const price = priceMatch ? Number(priceMatch[1]) : null;

  const aliasMatch = msg.match(/alias "([^"]+)"/);
  const alias = aliasMatch ? aliasMatch[1] : "";

  let identity = "";
  let contact = "";

  const afterIdentity = msg.split("actual identity: ")[1];
  if (afterIdentity) {
    if (afterIdentity.includes(" | Contact: ")) {
      const parts = afterIdentity.split(" | Contact: ");
      identity = parts[0].trim();
      contact = parts[1].split(". Reach out")[0].trim();
    } else {
      identity = afterIdentity.split(". Reach out")[0].trim();
    }
  }

  const priceText = price !== null ? ` of $${price}` : "";

  return {
    type,
    item,
    alias,
    identity,
    contact: contact || null,
    price,
    instruction: `Reach out to coordinate physical pickup and payment${priceText}.`,
    raw: msg,
  };
}

export interface PresetUser {
  label: string;
  username: string;
  defaultName: string;
  defaultContact: string;
}

export const PRESETS: PresetUser[] = [
  { label: "Alice", username: "alice@mit.edu", defaultName: "Alice Doe", defaultContact: "617-555-0101" },
  { label: "Bob", username: "bob@mit.edu", defaultName: "Bob Smith", defaultContact: "bob@mit.edu" },
];
