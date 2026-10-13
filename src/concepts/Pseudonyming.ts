import type { Collection, Db } from "mongodb";

export class NoSuchPseudonym extends Error {}

export interface PseudonymDoc {
  _id: string;
  context: string;
  user: string;
  alias: string;
}

const ADJECTIVES = [
  "Swift", "Eager", "Clever", "Quiet", "Brave", "Calm", "Gentle", "Bright",
  "Merry", "Witty", "Keen", "Noble", "Nimble", "Jolly", "Sunny", "Lucky",
];

const ANIMALS = [
  "Sparrow", "Beaver", "Otter", "Falcon", "Badger", "Panda", "Fox", "Koala",
  "Robin", "Hawk", "Dolphin", "Turtle", "Lynx", "Owl", "Finch", "Hedgehog",
];

export class PseudonymingConcept {
  private readonly collection?: Collection<PseudonymDoc>;
  private readonly memory = new Map<string, PseudonymDoc>();

  constructor(
    db?: Db,
    private readonly aliasGenerator: (existingAliases: Set<string>) => string = (existing) => {
      for (let attempt = 0; attempt < 100; attempt++) {
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        const candidate = `${adj}${animal}`;
        if (!existing.has(candidate)) {
          return candidate;
        }
      }
      return `User${crypto.randomUUID().slice(0, 8)}`;
    },
  ) {
    if (db) {
      this.collection = db.collection<PseudonymDoc>("pseudonyming.pseudonyms");
    }
  }

  async getAlias({
    context,
    user,
  }: {
    context: string;
    user: string;
  }): Promise<{ alias: string }> {
    if (this.collection) {
      const existing = await this.collection.findOne({ context, user });
      if (existing) {
        return { alias: existing.alias };
      }

      // Collect existing aliases in this context to avoid collisions
      const docsInContext = await this.collection.find({ context }).toArray();
      const existingAliases = new Set(docsInContext.map((d) => d.alias));
      const alias = this.aliasGenerator(existingAliases);

      const doc: PseudonymDoc = {
        _id: crypto.randomUUID(),
        context,
        user,
        alias,
      };
      await this.collection.insertOne(doc);
      return { alias };
    }

    // In-memory implementation
    const existing = [...this.memory.values()].find(
      (d) => d.context === context && d.user === user,
    );
    if (existing) {
      return { alias: existing.alias };
    }

    const existingAliases = new Set(
      [...this.memory.values()]
        .filter((d) => d.context === context)
        .map((d) => d.alias),
    );
    const alias = this.aliasGenerator(existingAliases);
    const id = crypto.randomUUID();
    const doc: PseudonymDoc = { _id: id, context, user, alias };
    this.memory.set(id, doc);
    return { alias };
  }

  async getUser({
    context,
    alias,
  }: {
    context: string;
    alias: string;
  }): Promise<{ user: string }> {
    const doc = await this.#findByContextAndAlias(context, alias);
    if (!doc) {
      throw new NoSuchPseudonym("No pseudonym matches the given alias in this context.");
    }
    return { user: doc.user };
  }

  async _getUser({
    context,
    alias,
  }: {
    context: string;
    alias: string;
  }): Promise<Array<{ user: string }>> {
    const doc = await this.#findByContextAndAlias(context, alias);
    if (!doc) return [];
    return [{ user: doc.user }];
  }

  async _getAlias({
    context,
    user,
  }: {
    context: string;
    user: string;
  }): Promise<Array<{ alias: string }>> {
    if (this.collection) {
      const doc = await this.collection.findOne({ context, user });
      if (!doc) return [];
      return [{ alias: doc.alias }];
    }
    const doc = [...this.memory.values()].find(
      (d) => d.context === context && d.user === user,
    );
    if (!doc) return [];
    return [{ alias: doc.alias }];
  }

  async #findByContextAndAlias(context: string, alias: string): Promise<PseudonymDoc | null> {
    if (this.collection) {
      return (await this.collection.findOne({ context, alias })) ?? null;
    }
    return (
      [...this.memory.values()].find((d) => d.context === context && d.alias === alias) ?? null
    );
  }
}
