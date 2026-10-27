import type { Collection, Db } from "mongodb";

export interface SettlementDoc {
  _id: string;
  settlement: string;
  buyer: string;
  seller: string;
  item: string;
  title: string;
  price: number;
  buyerAlias: string;
  sellerAlias: string;
  buyerName?: string;
  buyerContact?: string;
  sellerName?: string;
  sellerContact?: string;
  settledAt: number;
}

export class SettlingConcept {
  private readonly collection?: Collection<SettlementDoc>;
  private readonly memory = new Map<string, SettlementDoc>();
  private counter = 0;

  constructor(
    db?: Db,
    private readonly freshId: () => string = () => crypto.randomUUID(),
  ) {
    if (db) {
      this.collection = db.collection<SettlementDoc>("settling.settlements");
    }
  }

  async record({
    buyer,
    seller,
    item,
    title,
    price,
    buyerAlias,
    sellerAlias,
    buyerName,
    buyerContact,
    sellerName,
    sellerContact,
  }: {
    buyer: string;
    seller: string;
    item: string;
    title: string;
    price: number;
    buyerAlias: string;
    sellerAlias: string;
    buyerName?: string;
    buyerContact?: string;
    sellerName?: string;
    sellerContact?: string;
  }): Promise<{ settlement: string }> {
    if (typeof buyer !== "string" || !buyer.trim()) {
      throw new Error("Invalid buyer identifier.");
    }
    if (typeof seller !== "string" || !seller.trim()) {
      throw new Error("Invalid seller identifier.");
    }
    if (typeof item !== "string" || !item.trim()) {
      throw new Error("Invalid item identifier.");
    }
    if (typeof price !== "number" || isNaN(price) || price < 0 || !isFinite(price)) {
      throw new Error("Invalid settlement price.");
    }

    const settlement = this.freshId();
    const settledAt = Date.now() * 1000 + (this.counter++ % 1000);
    const doc: SettlementDoc = {
      _id: settlement,
      settlement,
      buyer: buyer.trim(),
      seller: seller.trim(),
      item: item.trim(),
      title: (title || "").trim().slice(0, 150),
      price,
      buyerAlias: (buyerAlias || "").trim().slice(0, 80),
      sellerAlias: (sellerAlias || "").trim().slice(0, 80),
      buyerName: buyerName ? buyerName.trim().slice(0, 80) : undefined,
      buyerContact: buyerContact ? buyerContact.trim().slice(0, 100) : undefined,
      sellerName: sellerName ? sellerName.trim().slice(0, 80) : undefined,
      sellerContact: sellerContact ? sellerContact.trim().slice(0, 100) : undefined,
      settledAt,
    };

    if (this.collection) {
      await this.collection.insertOne(doc);
    } else {
      this.memory.set(settlement, doc);
    }

    return { settlement };
  }

  async _forUser({
    user,
  }: {
    user: string;
  }): Promise<
    Array<{
      settlement: string;
      buyer: string;
      seller: string;
      item: string;
      title: string;
      price: number;
      buyerAlias: string;
      sellerAlias: string;
      buyerName: string;
      buyerContact: string;
      sellerName: string;
      sellerContact: string;
    }>
  > {
    if (typeof user !== "string" || !user.trim()) {
      return [];
    }
    const cleanUser = user.trim();
    let docs: SettlementDoc[];

    if (this.collection) {
      docs = await this.collection
        .find({
          $or: [{ buyer: cleanUser }, { seller: cleanUser }],
        })
        .sort({ settledAt: -1, _id: -1 })
        .toArray();
    } else {
      docs = Array.from(this.memory.values())
        .filter((d) => d.buyer === cleanUser || d.seller === cleanUser)
        .sort((a, b) => (b.settledAt ?? 0) - (a.settledAt ?? 0) || b._id.localeCompare(a._id));
    }

    return docs.map((d) => ({
      settlement: d.settlement,
      buyer: d.buyer,
      seller: d.seller,
      item: d.item,
      title: d.title,
      price: d.price,
      buyerAlias: d.buyerAlias,
      sellerAlias: d.sellerAlias,
      buyerName: d.buyerName ?? "",
      buyerContact: d.buyerContact ?? "",
      sellerName: d.sellerName ?? "",
      sellerContact: d.sellerContact ?? "",
    }));
  }
}
