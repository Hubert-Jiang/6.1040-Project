import type { Collection, Db } from "mongodb";

export class InvalidProfile extends Error {}

export interface ProfileDoc {
  _id: string;
  user: string;
  name: string;
  contact: string;
}

export class ProfilingConcept {
  private readonly collection?: Collection<ProfileDoc>;
  private readonly memory = new Map<string, ProfileDoc>();

  constructor(
    db?: Db,
    private readonly freshId: () => string = () => crypto.randomUUID(),
  ) {
    if (db) {
      this.collection = db.collection<ProfileDoc>("profiling.profiles");
    }
  }

  async update({
    user,
    name,
    contact,
  }: {
    user: string;
    name: string;
    contact: string;
  }): Promise<{ profile: string }> {
    if (typeof user !== "string" || !user.trim()) {
      throw new InvalidProfile("Invalid user identifier.");
    }
    const cleanName = typeof name === "string" ? name.trim().slice(0, 100) : "";
    const cleanContact = typeof contact === "string" ? contact.trim().slice(0, 100) : "";
    if (cleanName.length === 0 || cleanContact.length === 0) {
      throw new InvalidProfile("Name and contact method cannot be empty.");
    }

    if (this.collection) {
      const existing = await this.collection.findOne({ user });
      if (existing) {
        await this.collection.updateOne({ user }, { $set: { name: cleanName, contact: cleanContact } });
        return { profile: existing._id };
      }
      const profile = this.freshId();
      await this.collection.insertOne({ _id: profile, user, name: cleanName, contact: cleanContact });
      return { profile };
    }

    const existing = [...this.memory.values()].find((d) => d.user === user);
    if (existing) {
      existing.name = cleanName;
      existing.contact = cleanContact;
      return { profile: existing._id };
    }

    const profile = this.freshId();
    const doc: ProfileDoc = { _id: profile, user, name: cleanName, contact: cleanContact };
    this.memory.set(profile, doc);
    return { profile };
  }

  async _get({
    user,
  }: {
    user: string;
  }): Promise<Array<{ name: string; contact: string }>> {
    if (typeof user !== "string" || !user) return [];
    if (this.collection) {
      const doc = await this.collection.findOne({ user });
      if (!doc) return [];
      return [{ name: doc.name, contact: doc.contact }];
    }
    const doc = [...this.memory.values()].find((d) => d.user === user);
    if (!doc) return [];
    return [{ name: doc.name, contact: doc.contact }];
  }
}
