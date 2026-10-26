import type { Collection, Db } from "mongodb";

export class ListingNotFound extends Error {}
export class NotOwner extends Error {}
export class ListingInactive extends Error {}
export class AlreadyInactive extends Error {}

export interface ListingDoc {
  _id: string;
  owner: string;
  title: string;
  description: string;
  images: string[];
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

  async create({
    owner,
    title,
    description,
    images,
  }: {
    owner: string;
    title: string;
    description: string;
    images: string[] | string;
  }): Promise<{ listing: string }> {
    if (typeof owner !== "string" || !owner.trim()) {
      throw new Error("Invalid owner identifier.");
    }
    const cleanTitle = typeof title === "string" ? title.trim().slice(0, 150) : "";
    if (cleanTitle.length === 0) {
      throw new Error("Item title cannot be empty.");
    }
    const cleanDescription = typeof description === "string" ? description.trim().slice(0, 2000) : "";

    const rawImages = Array.isArray(images)
      ? images
      : typeof images === "string" && images.length > 0
        ? [images]
        : [];
    const normalizedImages = rawImages
      .filter((img): img is string => typeof img === "string" && img.length > 0 && img.length <= 6 * 1024 * 1024)
      .slice(0, 5);

    const listing = this.freshId();
    const doc: ListingDoc = {
      _id: listing,
      owner,
      title: cleanTitle,
      description: cleanDescription,
      images: normalizedImages,
      active: true,
    };
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
    title,
    description,
    images,
  }: {
    owner: string;
    listing: string;
    title: string;
    description: string;
    images: string[] | string;
  }): Promise<{ listing: string }> {
    if (typeof listing !== "string" || !listing) {
      throw new ListingNotFound("There is no such listing.");
    }
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
    const cleanTitle = typeof title === "string" ? title.trim().slice(0, 150) : doc.title;
    const cleanDescription = typeof description === "string" ? description.trim().slice(0, 2000) : doc.description;
    const rawImages = Array.isArray(images)
      ? images
      : typeof images === "string" && images.length > 0
        ? [images]
        : [];
    const normalizedImages = rawImages
      .filter((img): img is string => typeof img === "string" && img.length > 0 && img.length <= 6 * 1024 * 1024)
      .slice(0, 5);

    if (this.collection) {
      await this.collection.updateOne(
        { _id: listing },
        { $set: { title: cleanTitle, description: cleanDescription, images: normalizedImages } },
      );
    } else {
      doc.title = cleanTitle;
      doc.description = cleanDescription;
      doc.images = normalizedImages;
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
    if (typeof listing !== "string" || !listing) {
      throw new ListingNotFound("There is no such listing.");
    }
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
    if (typeof listing !== "string" || !listing) {
      throw new ListingNotFound("There is no such listing.");
    }
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
  }): Promise<
    Array<{
      listing: string;
      owner: string;
      title: string;
      description: string;
      images: string[];
      active: boolean;
    }>
  > {
    if (typeof listing !== "string" || !listing) return [];
    const doc = await this.#get(listing);
    if (!doc) return [];
    return [
      {
        listing: doc._id,
        owner: doc.owner,
        title: doc.title,
        description: doc.description,
        images: doc.images,
        active: doc.active,
      },
    ];
  }

  async _all(_input: Record<string, never>): Promise<
    Array<{
      listing: string;
      owner: string;
      title: string;
      description: string;
      images: string[];
      active: boolean;
    }>
  > {
    if (this.collection) {
      const docs = await this.collection.find().sort({ _id: 1 }).toArray();
      return docs.map((d) => ({
        listing: d._id,
        owner: d.owner,
        title: d.title,
        description: d.description,
        images: d.images,
        active: d.active,
      }));
    }
    const docs = [...this.memory.values()].sort((a, b) => a._id.localeCompare(b._id));
    return docs.map((d) => ({
      listing: d._id,
      owner: d.owner,
      title: d.title,
      description: d.description,
      images: d.images,
      active: d.active,
    }));
  }

  async _active(_input: Record<string, never>): Promise<
    Array<{
      listing: string;
      owner: string;
      title: string;
      description: string;
      images: string[];
    }>
  > {
    if (this.collection) {
      const docs = await this.collection.find({ active: true }).sort({ _id: 1 }).toArray();
      return docs.map((d) => ({
        listing: d._id,
        owner: d.owner,
        title: d.title,
        description: d.description,
        images: d.images,
      }));
    }
    const docs = [...this.memory.values()]
      .filter((d) => d.active)
      .sort((a, b) => a._id.localeCompare(b._id));
    return docs.map((d) => ({
      listing: d._id,
      owner: d.owner,
      title: d.title,
      description: d.description,
      images: d.images,
    }));
  }

  async #get(id: string): Promise<ListingDoc | null> {
    if (typeof id !== "string" || !id) return null;
    if (this.collection) {
      return (await this.collection.findOne({ _id: id })) ?? null;
    }
    return this.memory.get(id) ?? null;
  }
}
