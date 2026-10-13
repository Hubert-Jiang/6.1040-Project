import { describe, expect, test } from "bun:test";
import {
  AlreadyClosed,
  AuctionInactive,
  AuctionNotFound,
  AuctioningConcept,
  BidTooLow,
  CannotDeleteActiveBids,
  InvalidBuyout,
  InvalidPrice,
  NotOwner,
  OwnerCannotBid,
} from "../../src/concepts/Auctioning.ts";

/**
 * Testing strategy for AuctioningConcept:
 *
 * create(owner, item, startPrice, increment, buyout?):
 *   - startPrice: < 0 (refuses INVALID_PRICE), == 0, > 0
 *   - increment: <= 0 (refuses INVALID_PRICE), > 0
 *   - buyout: undefined (no buyout), < startPrice (refuses INVALID_BUYOUT), >= startPrice
 *   - postcondition: active = true, highestBidder = null, price = startPrice
 *
 * bid(bidder, auction, amount):
 *   - auction: exists vs not found (refuses AUCTION_NOT_FOUND)
 *   - active: active = true vs active = false (refuses AUCTION_INACTIVE)
 *   - bidder: bidder == owner (refuses OWNER_CANNOT_BID) vs bidder != owner
 *   - highestBidder state:
 *     - highestBidder == null (opening bid):
 *       - amount < startPrice (refuses BID_TOO_LOW)
 *       - amount >= startPrice (accepted)
 *     - highestBidder != null (subsequent bid):
 *       - amount < price + increment (refuses BID_TOO_LOW)
 *       - amount >= price + increment (accepted)
 *   - postcondition: price = amount, highestBidder = bidder
 *
 * close(owner, auction):
 *   - auction: exists vs not found (refuses AUCTION_NOT_FOUND)
 *   - owner: matches owner vs non-owner (refuses NOT_OWNER)
 *   - active: active = true vs active = false (refuses ALREADY_CLOSED)
 *   - postcondition: active = false
 *
 * delete(owner, auction):
 *   - auction: exists vs not found (refuses AUCTION_NOT_FOUND)
 *   - owner: matches owner vs non-owner (refuses NOT_OWNER)
 *   - highestBidder: highestBidder != null (refuses CANNOT_DELETE_ACTIVE_BIDS) vs highestBidder == null
 *   - postcondition: auction removed from state
 *
 * _get(auction):
 *   - auction present in state (returns 1 row) vs absent (returns 0 rows)
 *
 * _byItem(item):
 *   - item associated with auction (returns 1 row) vs unknown item (returns 0 rows)
 *
 * _active():
 *   - returns only auctions with active = true
 */
describe("AuctioningConcept", () => {
  test("principle & bidding progression: opening bid, incremental bid, and close", async () => {
    // Partition: create with valid startPrice > 0, increment > 0, buyout >= startPrice
    const auctioning = new AuctioningConcept();
    const { auction } = await auctioning.create({
      owner: "SwiftSparrow",
      item: "listing-1",
      startPrice: 60,
      increment: 5,
      buyout: 75,
    });
    expect(auction).toBeDefined();

    // Partition: _get(auction) when present
    const got = await auctioning._get({ auction });
    expect(got).toEqual([
      {
        auction,
        owner: "SwiftSparrow",
        item: "listing-1",
        highestBidder: null,
        price: 60,
        increment: 5,
        active: true,
        buyout: 75,
      },
    ]);

    // Partition: _byItem(item) when item present
    const byItem = await auctioning._byItem({ item: "listing-1" });
    expect(byItem).toHaveLength(1);
    expect(byItem[0].auction).toBe(auction);

    // Partition: opening bid (highestBidder == null) with amount == startPrice
    await auctioning.bid({ bidder: "EagerBeaver", auction, amount: 60 });
    const afterFirstBid = await auctioning._get({ auction });
    expect(afterFirstBid[0].price).toBe(60);
    expect(afterFirstBid[0].highestBidder).toBe("EagerBeaver");

    // Partition: subsequent bid (highestBidder != null) with amount == price + increment
    await auctioning.bid({ bidder: "CleverFox", auction, amount: 65 });
    const afterSecondBid = await auctioning._get({ auction });
    expect(afterSecondBid[0].price).toBe(65);
    expect(afterSecondBid[0].highestBidder).toBe("CleverFox");

    // Partition: close by owner on active auction
    await auctioning.close({ owner: "SwiftSparrow", auction });
    const afterClose = await auctioning._get({ auction });
    expect(afterClose[0].active).toBe(false);

    // Partition: _active() excludes closed auctions
    expect(await auctioning._active({})).toEqual([]);
  });

  test("price parameter validation partitions: negative price, non-positive increment, buyout < start", async () => {
    const auctioning = new AuctioningConcept();

    // Partition: startPrice < 0 -> refuses INVALID_PRICE
    expect(
      auctioning.create({
        owner: "seller",
        item: "item-1",
        startPrice: -1,
        increment: 5,
      }),
    ).rejects.toThrow(InvalidPrice);

    // Partition: increment <= 0 -> refuses INVALID_PRICE
    expect(
      auctioning.create({
        owner: "seller",
        item: "item-1",
        startPrice: 50,
        increment: 0,
      }),
    ).rejects.toThrow(InvalidPrice);

    // Partition: buyout < startPrice -> refuses INVALID_BUYOUT
    expect(
      auctioning.create({
        owner: "seller",
        item: "item-1",
        startPrice: 50,
        increment: 5,
        buyout: 40,
      }),
    ).rejects.toThrow(InvalidBuyout);
  });

  test("giveaway and zero-price partitions: startPrice = 0, opening bid = 0, buyout = 0", async () => {
    const auctioning = new AuctioningConcept();
    // Partition: startPrice = 0, increment = 5, buyout = 0 (free giveaway with instant buyout option)
    const { auction } = await auctioning.create({
      owner: "seller",
      item: "free-sofa",
      startPrice: 0,
      increment: 5,
      buyout: 0,
    });
    expect(auction).toBeDefined();

    const got = await auctioning._get({ auction });
    expect(got[0].price).toBe(0);
    expect(got[0].buyout).toBe(0);
    expect(got[0].highestBidder).toBeNull();

    // Partition: opening bid with amount == 0 succeeds when startPrice == 0
    await auctioning.bid({ bidder: "luckyBuyer", auction, amount: 0 });
    const afterOpening = await auctioning._get({ auction });
    expect(afterOpening[0].price).toBe(0);
    expect(afterOpening[0].highestBidder).toBe("luckyBuyer");

    // Partition: subsequent bid must be at least price + increment (0 + 5 = 5)
    expect(auctioning.bid({ bidder: "otherBuyer", auction, amount: 2 })).rejects.toThrow(
      BidTooLow,
    );
    await auctioning.bid({ bidder: "otherBuyer", auction, amount: 5 });
    const afterSubsequent = await auctioning._get({ auction });
    expect(afterSubsequent[0].price).toBe(5);
    expect(afterSubsequent[0].highestBidder).toBe("otherBuyer");
  });

  test("bid restriction partitions: owner bidding, below minimum, inactive auction", async () => {
    const auctioning = new AuctioningConcept();
    const { auction } = await auctioning.create({
      owner: "seller",
      item: "item-1",
      startPrice: 60,
      increment: 5,
    });

    // Partition: bidder == owner -> refuses OWNER_CANNOT_BID
    expect(auctioning.bid({ bidder: "seller", auction, amount: 100 })).rejects.toThrow(
      OwnerCannotBid,
    );

    // Partition: opening bid with amount < startPrice -> refuses BID_TOO_LOW
    expect(auctioning.bid({ bidder: "buyer1", auction, amount: 50 })).rejects.toThrow(
      BidTooLow,
    );

    // Advance to highestBidder != null
    await auctioning.bid({ bidder: "buyer1", auction, amount: 60 });

    // Partition: subsequent bid with amount < price + increment -> refuses BID_TOO_LOW
    expect(auctioning.bid({ bidder: "buyer2", auction, amount: 62 })).rejects.toThrow(
      BidTooLow,
    );

    // Partition: bid on inactive auction -> refuses AUCTION_INACTIVE
    await auctioning.close({ owner: "seller", auction });
    expect(auctioning.bid({ bidder: "buyer2", auction, amount: 70 })).rejects.toThrow(
      AuctionInactive,
    );
  });

  test("ownership and deletion partitions: non-owner, auction with bids, double close", async () => {
    const auctioning = new AuctioningConcept();
    const { auction } = await auctioning.create({
      owner: "seller",
      item: "item-1",
      startPrice: 60,
      increment: 5,
    });

    // Partition: close / delete by non-owner -> refuses NOT_OWNER
    expect(auctioning.close({ owner: "stranger", auction })).rejects.toThrow(NotOwner);
    expect(auctioning.delete({ owner: "stranger", auction })).rejects.toThrow(NotOwner);

    // Partition: delete when highestBidder == null -> succeeds
    const { auction: emptyAuction } = await auctioning.create({
      owner: "seller",
      item: "item-2",
      startPrice: 50,
      increment: 5,
    });
    await auctioning.delete({ owner: "seller", auction: emptyAuction });
    expect(await auctioning._get({ auction: emptyAuction })).toEqual([]);

    // Partition: delete when highestBidder != null -> refuses CANNOT_DELETE_ACTIVE_BIDS
    await auctioning.bid({ bidder: "buyer", auction, amount: 60 });
    expect(auctioning.delete({ owner: "seller", auction })).rejects.toThrow(
      CannotDeleteActiveBids,
    );

    // Partition: close when active == false -> refuses ALREADY_CLOSED
    await auctioning.close({ owner: "seller", auction });
    expect(auctioning.close({ owner: "seller", auction })).rejects.toThrow(AlreadyClosed);
  });

  test("query non-existent partitions: _get and _byItem return empty", async () => {
    const auctioning = new AuctioningConcept();

    // Partition: _get with unknown auction id
    expect(await auctioning._get({ auction: "missing-id" })).toEqual([]);

    // Partition: _byItem with unknown item id
    expect(await auctioning._byItem({ item: "missing-item" })).toEqual([]);
  });
});
