import { describe, expect, it } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createLocalClient } from "@mit-sdg/sync-engine/client";
import type { BeaverBazaarWire } from "../../generated/wire.ts";
import { assembleApplication } from "../../src/assembly.ts";
import { AuctioningConcept } from "../../src/concepts/Auctioning.ts";
import { ListingConcept } from "../../src/concepts/Listing.ts";
import { NotifyingConcept } from "../../src/concepts/Notifying.ts";
import { ProfilingConcept } from "../../src/concepts/Profiling.ts";
import { PseudonymingConcept } from "../../src/concepts/Pseudonyming.ts";
import { SessioningConcept } from "../../src/concepts/Sessioning.ts";

/**
 * Builds an isolated in-memory instance of BeaverBazaar with its gateway and typed local client.
 */
function createTestApp() {
  const application = assembleApplication({
    Session: new SessioningConcept(),
    Profile: new ProfilingConcept(),
    Listing: new ListingConcept(),
    Pseudonym: new PseudonymingConcept(),
    Auction: new AuctioningConcept(),
    Notify: new NotifyingConcept(),
  });
  const gateway = createGateway<BeaverBazaarWire>({ application });
  const client = createLocalClient<BeaverBazaarWire>({ invoker: gateway });
  return { application, gateway, client };
}

describe("BeaverBazaar composition & end-to-end user scenario", () => {
  /**
   * Complete Alice & Bob journey:
   * Partitions 1-5 test the core milestone lifecycle through Touchstone auth, profile setup,
   * auction listing, masked incremental bidding, automated buyout reaction closure,
   * feed deactivation, and bilateral contact settlement notifications.
   */
  it("executes the complete marketplace lifecycle with instant buyout and private settlement", async () => {
    const { client } = createTestApp();

    // =========================================================================
    // Domain Partition 1: Touchstone login & profile management for Alice and Bob
    // =========================================================================
    // Testing authentication sessions, subject resolution, profile persistence,
    // and unauthorized session rejection.

    // 1a. Alice authenticates and configures contact info
    const aliceLogin = await client["/auth/login"]({ username: "alice@mit.edu" });
    if ("error" in aliceLogin) throw new Error(String(aliceLogin.error));
    const aliceSession = aliceLogin.session;
    expect(typeof aliceSession).toBe("string");

    const aliceMe = await client["/auth/me"]({ session: aliceSession });
    if ("error" in aliceMe) throw new Error(String(aliceMe.error));
    expect(aliceMe.user).toBe("alice@mit.edu");

    const aliceProfile = await client["/profile/update"]({
      session: aliceSession,
      name: "Alice Doe",
      contact: "617-555-0101",
    });
    if ("error" in aliceProfile) throw new Error(String(aliceProfile.error));
    expect(aliceProfile.profile).toBeDefined();

    // 1b. Bob authenticates and configures contact info
    const bobLogin = await client["/auth/login"]({ username: "bob@mit.edu" });
    if ("error" in bobLogin) throw new Error(String(bobLogin.error));
    const bobSession = bobLogin.session;
    expect(typeof bobSession).toBe("string");

    const bobMe = await client["/auth/me"]({ session: bobSession });
    if ("error" in bobMe) throw new Error(String(bobMe.error));
    expect(bobMe.user).toBe("bob@mit.edu");

    const bobProfile = await client["/profile/update"]({
      session: bobSession,
      name: "Bob Smith",
      contact: "bob@mit.edu",
    });
    if ("error" in bobProfile) throw new Error(String(bobProfile.error));
    expect(bobProfile.profile).toBeDefined();

    // 1c. Unauthorized session partition: unknown session token refused
    const unauthProfile = await client["/profile/update"]({
      session: "invalid-token",
      name: "Hacker",
      contact: "hacker@evil.com",
    });
    expect(unauthProfile).toEqual({ error: "UNKNOWN_SESSION" });

    // =========================================================================
    // Domain Partition 2: Listing creation, pricing terms, and pseudonym masking
    // =========================================================================
    // Testing item publication, initial pricing invariants, feed projection,
    // and privacy preservation via contextual pseudonyms.

    // 2a. Input validation partitions: invalid startPrice or buyout
    const invalidPrice = await client["/listings/create"]({
      session: aliceSession,
      item: "Broken Bike",
      startPrice: -10,
      increment: 5,
    });
    expect(invalidPrice).toEqual({ error: "INVALID_PRICE" });

    const invalidBuyout = await client["/listings/create"]({
      session: aliceSession,
      item: "Broken Bike",
      startPrice: 60,
      increment: 5,
      buyout: 40,
    });
    expect(invalidBuyout).toEqual({ error: "INVALID_BUYOUT" });

    // 2b. Alice publishes bicycle listing with $60 start, $5 increment, $75 buyout
    const createdListing = await client["/listings/create"]({
      session: aliceSession,
      item: "Vintage Fuji Bicycle",
      startPrice: 60,
      increment: 5,
      buyout: 75,
    });
    if ("error" in createdListing) throw new Error(String(createdListing.error));
    const { listing, auction } = createdListing;
    expect(typeof listing).toBe("string");
    expect(typeof auction).toBe("string");

    // 2c. Marketplace feed verification: active listing is visible with masked pseudonym
    const initialFeed = await client["/marketplace/feed"]({});
    if ("error" in initialFeed) throw new Error(String(initialFeed.error));
    expect(initialFeed.feed.listings).toHaveLength(1);
    const feedItem = initialFeed.feed.listings[0];
    expect(feedItem.listing).toBe(listing);
    expect(feedItem.auction).toBe(auction);
    expect(feedItem.item).toBe("Vintage Fuji Bicycle");
    expect(feedItem.price).toBe(60);
    expect(feedItem.increment).toBe(5);
    expect(feedItem.buyout).toBe(75);
    expect(feedItem.highestBidder).toBeNull();
    // Privacy invariant: seller's identity is masked behind a pseudonym, not Alice's real User
    expect(typeof feedItem.sellerAlias).toBe("string");
    expect(feedItem.sellerAlias).not.toBe("alice@mit.edu");

    // 2d. Listing detail verification
    const listingDetail = await client["/listings/get"]({ listing });
    if ("error" in listingDetail) throw new Error(String(listingDetail.error));
    expect(listingDetail.detail).toMatchObject({
      listing,
      auction,
      item: "Vintage Fuji Bicycle",
      price: 60,
      increment: 5,
      buyout: 75,
      active: true,
      auctionActive: true,
      highestBidder: null,
    });

    // =========================================================================
    // Domain Partition 3: Bidding constraints & incremental bid without closure
    // =========================================================================
    // Testing owner bidding restriction, minimum increment enforcement,
    // and bidder pseudonym attribution.

    // 3a. Owner cannot bid partition
    const ownerBid = await client["/auctions/bid"]({
      session: aliceSession,
      auction,
      item: listing,
      amount: 65,
    });
    expect(ownerBid).toEqual({ error: "OWNER_CANNOT_BID" });

    // 3b. Bid too low partitions:
    // Partition 3b(i): Opening bid below starting price ($55 < $60)
    const belowStartBid = await client["/auctions/bid"]({
      session: bobSession,
      auction,
      item: listing,
      amount: 55,
    });
    expect(belowStartBid).toEqual({ error: "BID_TOO_LOW" });

    // Bob places valid opening bid of $60
    const openingBid = await client["/auctions/bid"]({
      session: bobSession,
      auction,
      item: listing,
      amount: 60,
    });
    if ("error" in openingBid) throw new Error(String(openingBid.error));
    expect(openingBid.auction).toBe(auction);

    // Partition 3b(ii): Subsequent bid below minimum increment ($62 < $60 + $5)
    const belowIncrementBid = await client["/auctions/bid"]({
      session: bobSession,
      auction,
      item: listing,
      amount: 62,
    });
    expect(belowIncrementBid).toEqual({ error: "BID_TOO_LOW" });

    // 3c. Valid incremental bid of $65 by Bob
    const validBid = await client["/auctions/bid"]({
      session: bobSession,
      auction,
      item: listing,
      amount: 65,
    });
    if ("error" in validBid) throw new Error(String(validBid.error));
    expect(validBid.auction).toBe(auction);

    // 3d. Verify feed updates price & highest bidder without closing auction
    const midFeed = await client["/marketplace/feed"]({});
    if ("error" in midFeed) throw new Error(String(midFeed.error));
    expect(midFeed.feed.listings).toHaveLength(1);
    expect(midFeed.feed.listings[0].price).toBe(65);
    expect(typeof midFeed.feed.listings[0].highestBidder).toBe("string");
    // Bidder pseudonym is masked and distinct from seller pseudonym
    expect(midFeed.feed.listings[0].highestBidder).not.toBe("bob@mit.edu");
    expect(midFeed.feed.listings[0].highestBidder).not.toBe(feedItem.sellerAlias);

    // 3e. Verify no settlement notifications triggered yet
    const alicePreNotifications = await client["/notifications/list"]({ session: aliceSession });
    if ("error" in alicePreNotifications) throw new Error(String(alicePreNotifications.error));
    expect(alicePreNotifications.notifications.notifications).toHaveLength(0);

    // =========================================================================
    // Domain Partition 4: Buyout bid, automated reaction closure & feed deactivation
    // =========================================================================
    // Testing CloseOnBuyout reaction, SyncAuctionListingStatus reaction,
    // and catalog deactivation.

    // 4a. Bob submits instant buyout bid ($75)
    const buyoutBid = await client["/auctions/bid"]({
      session: bobSession,
      auction,
      item: listing,
      amount: 75,
    });
    if ("error" in buyoutBid) throw new Error(String(buyoutBid.error));
    expect(buyoutBid.auction).toBe(auction);

    // 4b. Verify listing deactivation: item drops completely from active marketplace feed!
    const closedFeed = await client["/marketplace/feed"]({});
    if ("error" in closedFeed) throw new Error(String(closedFeed.error));
    expect(closedFeed.feed.listings).toHaveLength(0);

    // 4c. Verify listing detail shows inactive status
    const closedDetail = await client["/listings/get"]({ listing });
    if ("error" in closedDetail) throw new Error(String(closedDetail.error));
    expect(closedDetail.detail).toMatchObject({
      listing,
      active: false,
      auctionActive: false,
      price: 75,
    });

    // 4d. Post-close bid restriction: bidding on closed auction is refused
    const lateBid = await client["/auctions/bid"]({
      session: bobSession,
      auction,
      item: listing,
      amount: 80,
    });
    expect(lateBid).toEqual({ error: "AUCTION_INACTIVE" });

    // 4e. Redundant close restriction: manual close on already closed auction is refused
    const doubleClose = await client["/auctions/close"]({
      session: aliceSession,
      auction,
      item: listing,
    });
    expect(doubleClose).toEqual({ error: "ALREADY_CLOSED" });

    // =========================================================================
    // Domain Partition 5: Bilateral closing notifications & counterpart contact info
    // =========================================================================
    // Testing NotifySellerOnClose and NotifyBuyerOnClose reactions,
    // out-of-band profile contact resolution, and notification dismissal.

    // 5a. Alice's notification contains Bob's name and contact information
    const aliceNotifications = await client["/notifications/list"]({ session: aliceSession });
    if ("error" in aliceNotifications) throw new Error(String(aliceNotifications.error));
    expect(aliceNotifications.notifications.notifications).toHaveLength(1);
    const aliceNotif = aliceNotifications.notifications.notifications[0];
    expect(aliceNotif.message).toContain("Vintage Fuji Bicycle");
    expect(aliceNotif.message).toContain("Bob Smith");
    expect(aliceNotif.message).toContain("bob@mit.edu");

    // 5b. Bob's notification contains Alice's name and contact information
    const bobNotifications = await client["/notifications/list"]({ session: bobSession });
    if ("error" in bobNotifications) throw new Error(String(bobNotifications.error));
    expect(bobNotifications.notifications.notifications).toHaveLength(1);
    const bobNotif = bobNotifications.notifications.notifications[0];
    expect(bobNotif.message).toContain("Vintage Fuji Bicycle");
    expect(bobNotif.message).toContain("Alice Doe");
    expect(bobNotif.message).toContain("617-555-0101");

    // 5c. Notification dismissal partition
    const dismissRes = await client["/notifications/dismiss"]({
      session: aliceSession,
      notification: aliceNotif.notification,
    });
    if ("error" in dismissRes) throw new Error(String(dismissRes.error));
    expect(dismissRes.notification).toBe(aliceNotif.notification);

    const aliceCleared = await client["/notifications/list"]({ session: aliceSession });
    if ("error" in aliceCleared) throw new Error(String(aliceCleared.error));
    expect(aliceCleared.notifications.notifications).toHaveLength(0);

    // Bob's inbox remains unaffected
    const bobRetained = await client["/notifications/list"]({ session: bobSession });
    if ("error" in bobRetained) throw new Error(String(bobRetained.error));
    expect(bobRetained.notifications.notifications).toHaveLength(1);
  });

  /**
   * Domain Partition 6: Manual auction management and deletion
   */
  it("enforces deletion rules and removes unbid auctions along with their listings", async () => {
    const { client } = createTestApp();

    // 6a. Authenticate Alice and Bob
    const aliceLogin = await client["/auth/login"]({ username: "alice@mit.edu" });
    if ("error" in aliceLogin) throw new Error(String(aliceLogin.error));
    const aliceSession = aliceLogin.session;

    const bobLogin = await client["/auth/login"]({ username: "bob@mit.edu" });
    if ("error" in bobLogin) throw new Error(String(bobLogin.error));
    const bobSession = bobLogin.session;

    // 6b. Alice creates an unbid listing
    const created = await client["/listings/create"]({
      session: aliceSession,
      item: "Desk Lamp",
      startPrice: 20,
      increment: 2,
    });
    if ("error" in created) throw new Error(String(created.error));
    const { listing, auction } = created;

    // 6c. Non-owner Bob cannot delete Alice's auction
    const nonOwnerDelete = await client["/auctions/delete"]({
      session: bobSession,
      auction,
      item: listing,
    });
    expect(nonOwnerDelete).toEqual({ error: "NOT_OWNER" });

    // 6d. Alice successfully deletes the unbid auction
    const deleteRes = await client["/auctions/delete"]({
      session: aliceSession,
      auction,
      item: listing,
    });
    if ("error" in deleteRes) throw new Error(String(deleteRes.error));
    expect(deleteRes.auction).toBe(auction);

    // 6e. Verify listing and auction are removed from the feed
    const feed = await client["/marketplace/feed"]({});
    if ("error" in feed) throw new Error(String(feed.error));
    expect(feed.feed.listings).toHaveLength(0);

    // 6f. Detail query returns null for removed listing
    const detail = await client["/listings/get"]({ listing });
    if ("error" in detail) throw new Error(String(detail.error));
    expect(detail.detail).toBeNull();
  });
});
