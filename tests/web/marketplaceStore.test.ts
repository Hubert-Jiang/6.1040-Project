import { describe, expect, test } from "bun:test";
import {
  createListing,
  filterListings,
  marketplaceState,
  setSearchQuery,
  setSearchScope,
  setRoleFilter,
  resetFilters,
  getFilteredListings,
} from "../../web/stores/marketplace.ts";
import { uiState } from "../../web/stores/ui.ts";
import type { ListingItem } from "../../web/api.ts";

const sampleListings: ListingItem[] = [
  {
    listing: "l1",
    auction: "a1",
    sellerAlias: "SwiftOtter",
    title: "Vintage Fuji Road Bike",
    description: "Classic 10-speed bicycle with chrome frame and drop bars.",
    images: ["bike.jpg"],
    price: 60,
    increment: 5,
    buyout: 75,
    highestBidder: "BraveFalcon",
    isSeller: true,
    isHighestBidder: false,
  },
  {
    listing: "l2",
    auction: "a2",
    sellerAlias: "CleverPanda",
    title: "Ergonomic Desk Chair",
    description: "Mesh back chair with lumbar support. Perfect for studying.",
    images: [],
    price: 40,
    increment: 2,
    buyout: null,
    highestBidder: "SwiftOtter",
    isSeller: false,
    isHighestBidder: true,
  },
  {
    listing: "l3",
    auction: "a3",
    sellerAlias: "QuietBadger",
    title: "TI-84 Plus CE Calculator",
    description: "Includes charging cable. Used for 18.01 calculus.",
    images: [],
    price: 25,
    increment: 1,
    buyout: 35,
    highestBidder: null,
    isSeller: false,
    isHighestBidder: false,
  },
];

describe("Marketplace Store validation & filtering", () => {
  describe("Listing creation validation", () => {
    test("enforces reasonable description restrictions: length <= 1000 and lines <= 12", async () => {
      // Description > 1000 characters
      const longDesc = "a".repeat(1001);
      const resLong = await createListing("fake-session", "Title", longDesc, [], 10, 1, null);
      expect(resLong).toBe(false);
      expect(uiState.statusMessage).toContain("1,000 character maximum limit");

      // Description with > 12 newlines
      const manyLinesDesc = Array(15).fill("line").join("\n");
      const resLines = await createListing("fake-session", "Title", manyLinesDesc, [], 10, 1, null);
      expect(resLines).toBe(false);
      expect(uiState.statusMessage).toContain("cannot have more than 12 lines");

      // Valid description with reasonable line count
      const validDesc = "Excellent condition road bike.\nPickup near Stata Center.\nIncludes helmet.";
      // Will fail only at network/fake session call, proving validation passed
      await createListing("fake-session", "Title", validDesc, [], 10, 1, null);
      expect(uiState.statusMessage).not.toContain("1,000 character maximum limit");
      expect(uiState.statusMessage).not.toContain("cannot have more than 12 lines");
    });

    test("caps the number of images at 5", async () => {
      const sixImages = ["img1", "img2", "img3", "img4", "img5", "img6"];
      const res = await createListing("fake-session", "Title", "Desc", sixImages, 10, 1, null);
      expect(res).toBe(false);
      expect(uiState.statusMessage).toContain("Maximum of 5 photos allowed");

      const fiveImages = ["img1", "img2", "img3", "img4", "img5"];
      await createListing("fake-session", "Title", "Desc", fiveImages, 10, 1, null);
      expect(uiState.statusMessage).not.toContain("Maximum of 5 photos allowed");
    });
  });

  describe("Marketplace search & scope filtering", () => {
    test("filters by keyword across both title and description (default scope)", () => {
      // Query matching title
      const resBike = filterListings(sampleListings, { query: "fuji", scope: "both" });
      expect(resBike.map((l) => l.listing)).toEqual(["l1"]);

      // Query matching description
      const resMesh = filterListings(sampleListings, { query: "lumbar", scope: "both" });
      expect(resMesh.map((l) => l.listing)).toEqual(["l2"]);

      // Query matching multiple
      const resChromeOrCable = filterListings(sampleListings, { query: "includes", scope: "both" });
      expect(resChromeOrCable.map((l) => l.listing)).toEqual(["l3"]);

      // Query not matching anything
      const resNone = filterListings(sampleListings, { query: "microwave", scope: "both" });
      expect(resNone).toEqual([]);
    });

    test("filters strictly by title when scope is 'title'", () => {
      // "calculator" is in l3's title
      const resCalc = filterListings(sampleListings, { query: "calculator", scope: "title" });
      expect(resCalc.map((l) => l.listing)).toEqual(["l3"]);

      // "calculus" is in l3's description, but NOT title -> should not match in 'title' scope
      const resCalculus = filterListings(sampleListings, { query: "calculus", scope: "title" });
      expect(resCalculus).toEqual([]);
    });

    test("filters strictly by description when scope is 'desc'", () => {
      // "calculus" is in l3's description
      const resCalculus = filterListings(sampleListings, { query: "calculus", scope: "desc" });
      expect(resCalculus.map((l) => l.listing)).toEqual(["l3"]);

      // "calculator" is in l3's title, but NOT description -> should not match in 'desc' scope
      const resCalc = filterListings(sampleListings, { query: "calculator", scope: "desc" });
      expect(resCalc).toEqual([]);
    });

    test("handles case-insensitivity and extra whitespace in search query", () => {
      const res = filterListings(sampleListings, { query: "   FUJI   ", scope: "both" });
      expect(res.map((l) => l.listing)).toEqual(["l1"]);
    });
  });

  describe("Marketplace role & status filters", () => {
    test("filters by 'mine' (listings where viewer is the seller)", () => {
      const mine = filterListings(sampleListings, { filter: "mine" });
      expect(mine.map((l) => l.listing)).toEqual(["l1"]);
      expect(mine.every((l) => l.isSeller)).toBe(true);
    });

    test("filters by 'winning' (listings where viewer is the highest bidder)", () => {
      const winning = filterListings(sampleListings, { filter: "winning" });
      expect(winning.map((l) => l.listing)).toEqual(["l2"]);
      expect(winning.every((l) => l.isHighestBidder)).toBe(true);
    });

    test("filters by 'has_bids' and 'unbid'", () => {
      const withBids = filterListings(sampleListings, { filter: "has_bids" });
      expect(withBids.map((l) => l.listing)).toEqual(["l1", "l2"]);

      const unbid = filterListings(sampleListings, { filter: "unbid" });
      expect(unbid.map((l) => l.listing)).toEqual(["l3"]);
    });

    test("filters by 'buyout' (listings with instant buyout option)", () => {
      const buyout = filterListings(sampleListings, { filter: "buyout" });
      expect(buyout.map((l) => l.listing)).toEqual(["l1", "l3"]);
    });

    test("combines text search with role/status filters", () => {
      // Bike has buyout (l1 matches)
      const bikeWithBuyout = filterListings(sampleListings, { query: "bike", filter: "buyout" });
      expect(bikeWithBuyout.map((l) => l.listing)).toEqual(["l1"]);

      // Chair does NOT have buyout (returns empty)
      const chairWithBuyout = filterListings(sampleListings, { query: "chair", filter: "buyout" });
      expect(chairWithBuyout).toEqual([]);
    });
  });

  describe("Marketplace store filter state management", () => {
    test("updates search query, scope, filter, and resets cleanly", () => {
      marketplaceState.listings = [...sampleListings];

      setSearchQuery("desk");
      setSearchScope("title");
      setRoleFilter("winning");

      expect(marketplaceState.searchQuery).toBe("desk");
      expect(marketplaceState.searchScope).toBe("title");
      expect(marketplaceState.roleFilter).toBe("winning");

      const filtered = getFilteredListings();
      expect(filtered.map((l) => l.listing)).toEqual(["l2"]);

      resetFilters();
      expect(marketplaceState.searchQuery).toBe("");
      expect(marketplaceState.searchScope).toBe("both");
      expect(marketplaceState.roleFilter).toBe("all");
      expect(getFilteredListings().length).toBe(3);
    });
  });
});
