import type { Collection, Db } from "mongodb";

export class InvalidPrice extends Error {}
export class InvalidBuyout extends Error {}
export class AuctionNotFound extends Error {}
export class AuctionInactive extends Error {}
export class OwnerCannotBid extends Error {}
export class BidTooLow extends Error {}
export class NotOwner extends Error {}
export class AlreadyClosed extends Error {}
export class CannotDeleteActiveBids extends Error {}

export interface AuctionDoc {
  _id: string;
  owner: string;
  item: string;
  highestBidder: string | null;
  price: number;
  increment: number;
  active: boolean;
  buyout: number | null;
}

export class AuctioningConcept {
  private readonly collection?: Collection<AuctionDoc>;
  private readonly memory = new Map<string, AuctionDoc>();

  constructor(
    db?: Db,
    private readonly freshId: () => string = () => crypto.randomUUID(),
  ) {
    if (db) {
      this.collection = db.collection<AuctionDoc>("auctioning.auctions");
    }
  }

  async create({
    owner,
    item,
    startPrice,
    increment,
    buyout,
  }: {
    owner: string;
    item: string;
    startPrice: number;
    increment: number;
    buyout?: number | null;
  }): Promise<{ auction: string }> {
    if (typeof owner !== "string" || !owner || typeof item !== "string" || !item) {
      throw new Error("Invalid owner or item.");
    }
    if (
      typeof startPrice !== "number" ||
      Number.isNaN(startPrice) ||
      !Number.isFinite(startPrice) ||
      startPrice < 0 ||
      typeof increment !== "number" ||
      Number.isNaN(increment) ||
      !Number.isFinite(increment) ||
      increment <= 0
    ) {
      throw new InvalidPrice("Start price must be non-negative and increment must be positive.");
    }
    if (
      buyout !== undefined &&
      buyout !== null &&
      (typeof buyout !== "number" ||
        Number.isNaN(buyout) ||
        !Number.isFinite(buyout) ||
        buyout < startPrice)
    ) {
      throw new InvalidBuyout("Buyout price must be greater than or equal to start price.");
    }

    const auction = this.freshId();
    const doc: AuctionDoc = {
      _id: auction,
      owner,
      item,
      highestBidder: null,
      price: startPrice,
      increment,
      active: true,
      buyout: buyout ?? null,
    };

    if (this.collection) {
      await this.collection.insertOne(doc);
    } else {
      this.memory.set(auction, doc);
    }

    return { auction };
  }

  async bid({
    bidder,
    auction,
    amount,
  }: {
    bidder: string;
    auction: string;
    amount: number;
  }): Promise<{ auction: string; outbid?: string }> {
    if (
      typeof bidder !== "string" ||
      !bidder ||
      typeof auction !== "string" ||
      !auction ||
      typeof amount !== "number" ||
      Number.isNaN(amount) ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 100_000_000
    ) {
      throw new BidTooLow("Invalid bid amount or parameters.");
    }
    const doc = await this.#get(auction);
    if (!doc) {
      throw new AuctionNotFound("There is no such auction.");
    }
    if (!doc.active) {
      throw new AuctionInactive("Cannot bid on an inactive auction.");
    }
    if (doc.owner === bidder) {
      throw new OwnerCannotBid("The auction owner cannot place bids.");
    }

    const minRequired =
      doc.highestBidder !== null ? doc.price + doc.increment : doc.price;
    if (amount < minRequired) {
      throw new BidTooLow(
        "Bid amount must meet the starting price or exceed the current price by at least the minimum increment.",
      );
    }

    const outbid = doc.highestBidder ?? undefined;

    if (this.collection) {
      await this.collection.updateOne(
        { _id: auction },
        { $set: { price: amount, highestBidder: bidder } },
      );
    } else {
      doc.price = amount;
      doc.highestBidder = bidder;
    }

    return { auction, ...(outbid ? { outbid } : {}) };
  }

  async close({
    owner,
    auction,
  }: {
    owner: string;
    auction: string;
  }): Promise<{ auction: string }> {
    if (typeof owner !== "string" || !owner || typeof auction !== "string" || !auction) {
      throw new AuctionNotFound("There is no such auction.");
    }
    const doc = await this.#get(auction);
    if (!doc) {
      throw new AuctionNotFound("There is no such auction.");
    }
    if (doc.owner !== owner) {
      throw new NotOwner("Only the auction owner can close this auction.");
    }
    if (!doc.active) {
      throw new AlreadyClosed("The auction is already closed.");
    }

    if (this.collection) {
      await this.collection.updateOne({ _id: auction }, { $set: { active: false } });
    } else {
      doc.active = false;
    }

    return { auction };
  }

  async delete({
    owner,
    auction,
  }: {
    owner: string;
    auction: string;
  }): Promise<{ auction: string }> {
    if (typeof owner !== "string" || !owner || typeof auction !== "string" || !auction) {
      throw new AuctionNotFound("There is no such auction.");
    }
    const doc = await this.#get(auction);
    if (!doc) {
      throw new AuctionNotFound("There is no such auction.");
    }
    if (doc.owner !== owner) {
      throw new NotOwner("Only the auction owner can delete this auction.");
    }
    if (doc.highestBidder !== null) {
      throw new CannotDeleteActiveBids("Cannot delete an auction that has bids.");
    }

    if (this.collection) {
      await this.collection.deleteOne({ _id: auction });
    } else {
      this.memory.delete(auction);
    }

    return { auction };
  }

  async _get({ auction }: { auction: string }): Promise<
    Array<{
      auction: string;
      owner: string;
      item: string;
      highestBidder: string | null;
      price: number;
      increment: number;
      active: boolean;
      buyout: number | null;
    }>
  > {
    if (typeof auction !== "string" || !auction) return [];
    const doc = await this.#get(auction);
    if (!doc) return [];
    return [
      {
        auction: doc._id,
        owner: doc.owner,
        item: doc.item,
        highestBidder: doc.highestBidder,
        price: doc.price,
        increment: doc.increment,
        active: doc.active,
        buyout: doc.buyout,
      },
    ];
  }

  async _byItem({ item }: { item: string }): Promise<
    Array<{
      auction: string;
      owner: string;
      item: string;
      highestBidder: string | null;
      price: number;
      increment: number;
      active: boolean;
      buyout: number | null;
    }>
  > {
    if (typeof item !== "string" || !item) return [];
    if (this.collection) {
      const doc = await this.collection.findOne({ item });
      if (!doc) return [];
      return [
        {
          auction: doc._id,
          owner: doc.owner,
          item: doc.item,
          highestBidder: doc.highestBidder,
          price: doc.price,
          increment: doc.increment,
          active: doc.active,
          buyout: doc.buyout,
        },
      ];
    }
    const doc = [...this.memory.values()].find((d) => d.item === item);
    if (!doc) return [];
    return [
      {
        auction: doc._id,
        owner: doc.owner,
        item: doc.item,
        highestBidder: doc.highestBidder,
        price: doc.price,
        increment: doc.increment,
        active: doc.active,
        buyout: doc.buyout,
      },
    ];
  }

  async _active(_input: Record<string, never>): Promise<
    Array<{
      auction: string;
      owner: string;
      item: string;
      highestBidder: string | null;
      price: number;
      increment: number;
      buyout: number | null;
    }>
  > {
    if (this.collection) {
      const docs = await this.collection.find({ active: true }).sort({ _id: 1 }).toArray();
      return docs.map((d) => ({
        auction: d._id,
        owner: d.owner,
        item: d.item,
        highestBidder: d.highestBidder,
        price: d.price,
        increment: d.increment,
        buyout: d.buyout,
      }));
    }
    const docs = [...this.memory.values()]
      .filter((d) => d.active)
      .sort((a, b) => a._id.localeCompare(b._id));
    return docs.map((d) => ({
      auction: d._id,
      owner: d.owner,
      item: d.item,
      highestBidder: d.highestBidder,
      price: d.price,
      increment: d.increment,
      buyout: d.buyout,
    }));
  }

  async #get(id: string): Promise<AuctionDoc | null> {
    if (typeof id !== "string" || !id) return null;
    if (this.collection) {
      return (await this.collection.findOne({ _id: id })) ?? null;
    }
    return this.memory.get(id) ?? null;
  }
}
