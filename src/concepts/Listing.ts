import type { Collection, Db } from "mongodb";

export class ListingNotFound extends Error {}
export class NotOwner extends Error {}
export class ListingInactive extends Error {}
export class AlreadyInactive extends Error {}

export interface ListingDoc {
  _id: string;
  owner: string;
  item: unknown;
  active: boolean;
}

export class ListingConcept {
  private readonly collection?: Collection<ListingDoc>;
  private readonly memory = new Map<string, ListingDoc>();

  constructor(
    db?: Db,
    private readonly freshId: () => string = () => crypto.randomUUID(),
  ) {
    if (db) {
      this.collection = db.collection<ListingDoc>("listing.listings");
    }
  }

  async create({ owner, item }: { owner: string; item: unknown }): Promise<{ listing: string }> {
    const listing = this.freshId();
    const doc: ListingDoc = { _id: listing, owner, item, active: true };
    if (this.collection) {
      await this.collection.insertOne(doc);
    } else {
      this.memory.set(listing, doc);
    }
    return { listing };
  }

  async update({
    owner,
    listing,
    item,
  }: {
    owner: string;
    listing: string;
    item: unknown;
  }): Promise<{ listing: string }> {
    const doc = await this.#get(listing);
    if (!doc) {
      throw new ListingNotFound("There is no such listing.");
    }
    if (doc.owner !== owner) {
      throw new NotOwner("Only the listing owner can update this listing.");
    }
    if (!doc.active) {
      throw new ListingInactive("Cannot update an inactive listing.");
    }
    if (this.collection) {
      await this.collection.updateOne({ _id: listing }, { $set: { item } });
    } else {
      doc.item = item;
    }
    return { listing };
  }

  async deactivate({
    owner,
    listing,
  }: {
    owner: string;
    listing: string;
  }): Promise<{ listing: string }> {
    const doc = await this.#get(listing);
    if (!doc) {
      throw new ListingNotFound("There is no such listing.");
    }
    if (doc.owner !== owner) {
      throw new NotOwner("Only the listing owner can deactivate this listing.");
    }
    if (!doc.active) {
      throw new AlreadyInactive("The listing is already inactive.");
    }
    if (this.collection) {
      await this.collection.updateOne({ _id: listing }, { $set: { active: false } });
    } else {
      doc.active = false;
    }
    return { listing };
  }

  async delete({
    owner,
    listing,
  }: {
    owner: string;
    listing: string;
  }): Promise<{ listing: string }> {
    const doc = await this.#get(listing);
    if (!doc) {
      throw new ListingNotFound("There is no such listing.");
    }
    if (doc.owner !== owner) {
      throw new NotOwner("Only the listing owner can delete this listing.");
    }
    if (this.collection) {
      await this.collection.deleteOne({ _id: listing });
    } else {
      this.memory.delete(listing);
    }
    return { listing };
  }

  async _get({
    listing,
  }: {
    listing: string;
  }): Promise<Array<{ listing: string; owner: string; item: unknown; active: boolean }>> {
    const doc = await this.#get(listing);
    if (!doc) return [];
    return [{ listing: doc._id, owner: doc.owner, item: doc.item, active: doc.active }];
  }

  async _all(_input: Record<string, never>): Promise<
    Array<{ listing: string; owner: string; item: unknown; active: boolean }>
  > {
    if (this.collection) {
      const docs = await this.collection.find().sort({ _id: 1 }).toArray();
      return docs.map((d) => ({ listing: d._id, owner: d.owner, item: d.item, active: d.active }));
    }
    const docs = [...this.memory.values()].sort((a, b) => a._id.localeCompare(b._id));
    return docs.map((d) => ({ listing: d._id, owner: d.owner, item: d.item, active: d.active }));
  }

  async _active(_input: Record<string, never>): Promise<
    Array<{ listing: string; owner: string; item: unknown }>
  > {
    if (this.collection) {
      const docs = await this.collection.find({ active: true }).sort({ _id: 1 }).toArray();
      return docs.map((d) => ({ listing: d._id, owner: d.owner, item: d.item }));
    }
    const docs = [...this.memory.values()]
      .filter((d) => d.active)
      .sort((a, b) => a._id.localeCompare(b._id));
    return docs.map((d) => ({ listing: d._id, owner: d.owner, item: d.item }));
  }

  async #get(id: string): Promise<ListingDoc | null> {
    if (this.collection) {
      return (await this.collection.findOne({ _id: id })) ?? null;
    }
    return this.memory.get(id) ?? null;
  }
}
