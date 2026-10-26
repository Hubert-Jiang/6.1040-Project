import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { BeaverBazaarWireHttp } from "../generated/wire.ts";

export const client = createHttpClient<BeaverBazaarWireHttp>({ baseUrl: "/api" });

/**
 * Validates whether an image URI is safe to render in an <img> tag.
 * Rejects javascript:, vbscript:, data:text/html, SVG with script vectors, etc.
 * Accepts only safe base64-encoded raster images (PNG, JPEG, WEBP) or http/https URLs.
 */
export function isSafeImageUri(uri: unknown): boolean {
  if (typeof uri !== "string" || !uri.trim()) return false;
  const trimmed = uri.trim();
  // Safe raster image data URLs (JPEG, PNG, WEBP)
  if (/^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return true;
  }
  // Safe HTTP/HTTPS image URLs
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function filterSafeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.filter(isSafeImageUri);
}

export interface ListingItem {
  listing: string;
  auction: string;
  sellerAlias: string;
  title: string;
  description: string;
  images: string[];
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
