import { describe, expect, it } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createLocalClient } from "@mit-sdg/sync-engine/client";
import type { BeaverBazaarWire } from "../../generated/wire.ts";
import { assembleApplication } from "../../src/assembly.ts";
import { AuctioningConcept, BidTooLow, InvalidPrice, InvalidBuyout } from "../../src/concepts/Auctioning.ts";
import { ListingConcept, ListingNotFound } from "../../src/concepts/Listing.ts";
import { NotifyingConcept, NoSuchNotification } from "../../src/concepts/Notifying.ts";
import { ProfilingConcept, InvalidProfile } from "../../src/concepts/Profiling.ts";
import { PseudonymingConcept, NoSuchPseudonym } from "../../src/concepts/Pseudonyming.ts";
import { SessioningConcept, UnknownSession } from "../../src/concepts/Sessioning.ts";
import { SettlingConcept } from "../../src/concepts/Settling.ts";
import { isSafeImageUri, filterSafeImages } from "../../web/api.ts";

function createTestApp() {
  const application = assembleApplication({
    Session: new SessioningConcept(),
    Profile: new ProfilingConcept(),
    Listing: new ListingConcept(),
    Pseudonym: new PseudonymingConcept(),
    Auction: new AuctioningConcept(),
    Notify: new NotifyingConcept(),
    Settlement: new SettlingConcept(),
  });
  const gateway = createGateway<BeaverBazaarWire>({ application });
  const client = createLocalClient<BeaverBazaarWire>({ invoker: gateway });
  return { application, gateway, client };
}

describe("Security & Vulnerability Hardening Tests", () => {
  describe("1. NoSQL Operator & Object Injection Protection", () => {
    it("protects Sessioning against NoSQL injection payloads", async () => {
      const sessioning = new SessioningConcept();
      const maliciousPayload = { $gt: "" } as unknown as string;

      // Invalid start subject
      expect(sessioning.start({ subject: maliciousPayload })).rejects.toThrow("Invalid subject identifier.");

      // Invalid current session lookup
      expect(sessioning.current({ session: maliciousPayload })).rejects.toBeInstanceOf(UnknownSession);

      // Invalid end session
      expect(sessioning.end({ session: maliciousPayload })).rejects.toBeInstanceOf(UnknownSession);

      // Query active returns empty list instead of matching documents
      const active = await sessioning._active({ session: maliciousPayload });
      expect(active).toEqual([]);
    });

    it("protects Profiling against NoSQL injection payloads", async () => {
      const profiling = new ProfilingConcept();
      const maliciousUser = { $ne: null } as unknown as string;

      // Updating with non-string user
      expect(profiling.update({ user: maliciousUser, name: "Attacker", contact: "test" }))
        .rejects.toBeInstanceOf(InvalidProfile);

      // Querying with non-string user
      const result = await profiling._get({ user: maliciousUser });
      expect(result).toEqual([]);
    });

    it("protects Listing against NoSQL injection payloads", async () => {
      const listingConcept = new ListingConcept();
      const maliciousId = { $gt: "" } as unknown as string;

      // Creating with invalid owner
      expect(listingConcept.create({ owner: maliciousId, title: "Test", description: "Desc", images: [] }))
        .rejects.toThrow("Invalid owner identifier.");

      // Updating with invalid listing ID
      expect(listingConcept.update({ owner: "alice", listing: maliciousId, title: "T", description: "D", images: [] }))
        .rejects.toBeInstanceOf(ListingNotFound);

      // Deactivating with invalid listing ID
      expect(listingConcept.deactivate({ owner: "alice", listing: maliciousId }))
        .rejects.toBeInstanceOf(ListingNotFound);

      // Deleting with invalid listing ID
      expect(listingConcept.delete({ owner: "alice", listing: maliciousId }))
        .rejects.toBeInstanceOf(ListingNotFound);

      // Querying with invalid listing ID returns empty array
      const result = await listingConcept._get({ listing: maliciousId });
      expect(result).toEqual([]);
    });

    it("protects Auctioning against NoSQL injection payloads", async () => {
      const auctioning = new AuctioningConcept();
      const maliciousAuction = { $gt: "" } as unknown as string;

      // Bidding with invalid auction id
      expect(auctioning.bid({ bidder: "bidder1", auction: maliciousAuction, amount: 50 }))
        .rejects.toBeInstanceOf(BidTooLow);

      // Querying with invalid auction id returns empty array
      const resAuction = await auctioning._get({ auction: maliciousAuction });
      expect(resAuction).toEqual([]);

      const resItem = await auctioning._byItem({ item: maliciousAuction });
      expect(resItem).toEqual([]);
    });

    it("protects Pseudonyming against NoSQL injection payloads", async () => {
      const pseudonyming = new PseudonymingConcept();
      const maliciousContext = { $gt: "" } as unknown as string;

      expect(pseudonyming.getAlias({ context: maliciousContext, user: "alice" }))
        .rejects.toThrow("Invalid context or user.");

      expect(pseudonyming.getUser({ context: maliciousContext, alias: "SwiftOtter" }))
        .rejects.toBeInstanceOf(NoSuchPseudonym);

      const userRes = await pseudonyming._getUser({ context: maliciousContext, alias: "SwiftOtter" });
      expect(userRes).toEqual([]);

      const aliasRes = await pseudonyming._getAlias({ context: maliciousContext, user: "alice" });
      expect(aliasRes).toEqual([]);
    });

    it("protects Notifying against NoSQL injection payloads", async () => {
      const notifying = new NotifyingConcept();
      const maliciousId = { $ne: null } as unknown as string;

      expect(notifying.notify({ user: maliciousId, message: "Hello" }))
        .rejects.toThrow("Invalid user identifier.");

      expect(notifying.dismiss({ notification: maliciousId }))
        .rejects.toBeInstanceOf(NoSuchNotification);

      const all = await notifying._all({ user: maliciousId });
      expect(all).toEqual([]);
    });

    it("protects Settling against NoSQL injection payloads", async () => {
      const settling = new SettlingConcept();
      const maliciousId = { $ne: null } as unknown as string;

      expect(
        settling.record({
          buyer: maliciousId,
          seller: "alice",
          item: "item1",
          title: "Title",
          price: 50,
          buyerAlias: "b",
          sellerAlias: "a",
        }),
      ).rejects.toThrow("Invalid buyer identifier.");

      const all = await settling._forUser({ user: maliciousId });
      expect(all).toEqual([]);
    });
  });

  describe("2. Numerical Bounds & Exploitation Prevention", () => {
    it("rejects invalid, negative, NaN, or infinite auction prices", async () => {
      const auctioning = new AuctioningConcept();

      // Negative startPrice
      expect(auctioning.create({ owner: "alice", item: "item1", startPrice: -10, increment: 1 }))
        .rejects.toBeInstanceOf(InvalidPrice);

      // NaN startPrice
      expect(auctioning.create({ owner: "alice", item: "item1", startPrice: NaN, increment: 1 }))
        .rejects.toBeInstanceOf(InvalidPrice);

      // Infinite startPrice
      expect(auctioning.create({ owner: "alice", item: "item1", startPrice: Infinity, increment: 1 }))
        .rejects.toBeInstanceOf(InvalidPrice);

      // Zero or negative increment
      expect(auctioning.create({ owner: "alice", item: "item1", startPrice: 10, increment: 0 }))
        .rejects.toBeInstanceOf(InvalidPrice);
      expect(auctioning.create({ owner: "alice", item: "item1", startPrice: 10, increment: -5 }))
        .rejects.toBeInstanceOf(InvalidPrice);

      // Buyout lower than startPrice
      expect(auctioning.create({ owner: "alice", item: "item1", startPrice: 100, increment: 5, buyout: 50 }))
        .rejects.toBeInstanceOf(InvalidBuyout);
    });

    it("rejects invalid, negative, or astronomical bid amounts", async () => {
      const auctioning = new AuctioningConcept();
      const { auction } = await auctioning.create({ owner: "seller", item: "item1", startPrice: 20, increment: 5 });

      // Negative bid
      expect(auctioning.bid({ bidder: "bidder", auction, amount: -1 }))
        .rejects.toBeInstanceOf(BidTooLow);

      // NaN bid
      expect(auctioning.bid({ bidder: "bidder", auction, amount: NaN }))
        .rejects.toBeInstanceOf(BidTooLow);

      // Excessive bid exceeding ceiling (> 100M)
      expect(auctioning.bid({ bidder: "bidder", auction, amount: 200_000_000 }))
        .rejects.toBeInstanceOf(BidTooLow);
    });
  });

  describe("3. String Bounds & Length Sanitization", () => {
    it("enforces title, description, and photo bounds on listings", async () => {
      const listingConcept = new ListingConcept();

      // Title must not be empty
      expect(listingConcept.create({ owner: "alice", title: "   ", description: "desc", images: [] }))
        .rejects.toThrow("Item title cannot be empty.");

      // Excessively long title is truncated to safe limit (150 chars)
      const hugeTitle = "A".repeat(300);
      const hugeDesc = "B".repeat(5000);
      const sixPhotos = ["img1", "img2", "img3", "img4", "img5", "img6"];

      const { listing } = await listingConcept.create({
        owner: "alice",
        title: hugeTitle,
        description: hugeDesc,
        images: sixPhotos,
      });

      const [stored] = await listingConcept._get({ listing });
      expect(stored.title.length).toBe(150);
      expect(stored.description.length).toBe(2000);
      expect(stored.images.length).toBe(5); // Capped at max 5 images
    });

    it("enforces length bounds on user profile name and contact", async () => {
      const profiling = new ProfilingConcept();
      const hugeName = "X".repeat(200);
      const hugeContact = "Y".repeat(200);

      const { profile } = await profiling.update({
        user: "alice@mit.edu",
        name: hugeName,
        contact: hugeContact,
      });
      expect(typeof profile).toBe("string");

      const [stored] = await profiling._get({ user: "alice@mit.edu" });
      expect(stored.name.length).toBe(100); // Bounded to 100
      expect(stored.contact.length).toBe(100);
    });
  });

  describe("4. Malicious Image URI & XSS Sanitization", () => {
    it("rejects malicious script schemes in image URIs", () => {
      expect(isSafeImageUri("javascript:alert('XSS')")).toBe(false);
      expect(isSafeImageUri("vbscript:msgbox('XSS')")).toBe(false);
      expect(isSafeImageUri("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe(false);
      expect(isSafeImageUri("data:image/svg+xml;utf8,<svg onload=alert(1)>")).toBe(false);
      expect(isSafeImageUri("")).toBe(false);
      expect(isSafeImageUri(null)).toBe(false);
      expect(isSafeImageUri(undefined)).toBe(false);
    });

    it("accepts safe base64 raster image data URIs and safe HTTP/HTTPS URLs", () => {
      // Safe base64 png
      const validPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
      expect(isSafeImageUri(validPng)).toBe(true);

      // Safe base64 jpeg
      const validJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
      expect(isSafeImageUri(validJpeg)).toBe(true);

      // Safe https url
      expect(isSafeImageUri("https://images.unsplash.com/photo-1542291026-7eec264c27ff")).toBe(true);
      expect(isSafeImageUri("http://127.0.0.1:8080/sample.png")).toBe(true);
    });

    it("filters image lists to exclude malicious entries", () => {
      const rawImages = [
        "https://example.com/bike.jpg",
        "javascript:alert(document.cookie)",
        "data:text/html,<script>alert(1)</script>",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      ];
      const safe = filterSafeImages(rawImages);
      expect(safe.length).toBe(2);
      expect(safe[0]).toBe("https://example.com/bike.jpg");
      expect(safe[1]).toContain("data:image/png;base64");
    });
  });

  describe("5. End-to-End Authorization & Pseudonymity Guarantees", () => {
    it("rejects unauthorized actions when session is invalid or expired", async () => {
      const { client } = createTestApp();

      // Bidding with invalid session
      const bidRes = await client["/auctions/bid"]({
        session: "nonexistent-session",
        auction: "auction-1",
        item: "item-1",
        amount: 50,
      });
      expect("error" in bidRes).toBe(true);
      expect(String(bidRes.error)).toContain("UNKNOWN_SESSION");

      // Creating listing with invalid session
      const createRes = await client["/listings/create"]({
        session: "fake-session",
        title: "Unauthorized Item",
        description: "Test",
        images: [],
        startPrice: 10,
        increment: 1,
        buyout: null,
      });
      expect("error" in createRes).toBe(true);
      expect(String(createRes.error)).toContain("UNKNOWN_SESSION");

      // Updating profile with invalid session
      const profileRes = await client["/profile/update"]({
        session: "fake-session",
        name: "Hacker",
        contact: "hacker@evil.com",
      });
      expect("error" in profileRes).toBe(true);
      expect(String(profileRes.error)).toContain("UNKNOWN_SESSION");
    });

    it("prevents auction owners from placing bids on their own listings", async () => {
      const { client } = createTestApp();

      const sellerAuth = await client["/auth/login"]({ username: "seller@mit.edu" });
      if ("error" in sellerAuth) throw new Error(String(sellerAuth.error));

      const listingRes = await client["/listings/create"]({
        session: sellerAuth.session,
        title: "Seller's Item",
        description: "Testing self bid",
        images: [],
        startPrice: 25,
        increment: 5,
        buyout: null,
      });
      if ("error" in listingRes) throw new Error(String(listingRes.error));

      // Attempting to bid on own listing
      const selfBidRes = await client["/auctions/bid"]({
        session: sellerAuth.session,
        auction: listingRes.auction,
        item: listingRes.listing,
        amount: 30,
      });
      expect("error" in selfBidRes).toBe(true);
      expect(String(selfBidRes.error)).toContain("OWNER_CANNOT_BID");
    });

    it("prevents non-owners from closing or deleting an auction", async () => {
      const { client } = createTestApp();

      const sellerAuth = await client["/auth/login"]({ username: "seller@mit.edu" });
      if ("error" in sellerAuth) throw new Error(String(sellerAuth.error));

      const listingRes = await client["/listings/create"]({
        session: sellerAuth.session,
        title: "Secret Item",
        description: "Desc",
        images: [],
        startPrice: 20,
        increment: 5,
        buyout: null,
      });
      if ("error" in listingRes) throw new Error(String(listingRes.error));

      const buyerAuth = await client["/auth/login"]({ username: "buyer@mit.edu" });
      if ("error" in buyerAuth) throw new Error(String(buyerAuth.error));

      // Buyer attempts to close seller's auction
      const closeRes = await client["/auctions/close"]({
        session: buyerAuth.session,
        auction: listingRes.auction,
        item: listingRes.listing,
      });
      expect("error" in closeRes).toBe(true);
      expect(String(closeRes.error)).toContain("NOT_OWNER");

      // Buyer attempts to delete seller's auction
      const deleteRes = await client["/auctions/delete"]({
        session: buyerAuth.session,
        auction: listingRes.auction,
        item: listingRes.listing,
      });
      expect("error" in deleteRes).toBe(true);
      expect(String(deleteRes.error)).toContain("NOT_OWNER");
    });

    it("ensures public marketplace feed strictly masks identity and contact info behind pseudonyms", async () => {
      const { client } = createTestApp();

      const sellerAuth = await client["/auth/login"]({ username: "private_seller@mit.edu" });
      if ("error" in sellerAuth) throw new Error(String(sellerAuth.error));

      await client["/profile/update"]({
        session: sellerAuth.session,
        name: "Private Seller Name",
        contact: "private-phone-555-1234",
      });

      const listingRes = await client["/listings/create"]({
        session: sellerAuth.session,
        title: "Confidential Listing",
        description: "Public Description",
        images: ["https://example.com/item.jpg"],
        startPrice: 50,
        increment: 5,
        buyout: null,
      });
      if ("error" in listingRes) throw new Error(String(listingRes.error));

      // Public / unauthenticated user queries feed
      const feedRes = await client["/marketplace/feed"]({});
      if ("error" in feedRes) throw new Error(String(feedRes.error));

      const item = feedRes.feed.listings.find((l) => l.listing === listingRes.listing);
      expect(item).toBeDefined();

      // Verify that NO real user identifier or contact is returned
      const feedJson = JSON.stringify(feedRes);
      expect(feedJson.includes("private_seller@mit.edu")).toBe(false);
      expect(feedJson.includes("Private Seller Name")).toBe(false);
      expect(feedJson.includes("private-phone-555-1234")).toBe(false);

      // Verify pseudonym is used
      expect(item?.sellerAlias).toBeDefined();
      expect(typeof item?.sellerAlias).toBe("string");
      expect(item?.isSeller).toBe(false);
      expect(item?.isHighestBidder).toBe(false);
    });
  });
});
