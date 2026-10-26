import type { Collection, Db } from "mongodb";

export class UnknownSession extends Error {}

export interface SessionDoc {
  _id: string;
  subject: string;
  expiresAt: Date;
}

const SESSION_LIFETIME_MS = 30 * 60 * 1000;

export class SessioningConcept {
  private readonly collection?: Collection<SessionDoc>;
  private readonly memory = new Map<string, SessionDoc>();

  constructor(
    db?: Db,
    private readonly clock: () => Date = () => new Date(),
    private readonly freshId: () => string = () => crypto.randomUUID(),
  ) {
    if (db) {
      this.collection = db.collection<SessionDoc>("sessioning.sessions");
    }
  }

  async start({
    subject,
  }: {
    subject: string;
  }): Promise<{ session: string; expiresAt: Date }> {
    if (typeof subject !== "string" || !subject || subject.length > 256) {
      throw new Error("Invalid subject identifier.");
    }
    const now = this.clock();
    await this.#discardExpired(now);

    const session = this.freshId();
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
    const doc: SessionDoc = { _id: session, subject, expiresAt };

    if (this.collection) {
      await this.collection.insertOne(doc);
    } else {
      this.memory.set(session, doc);
    }

    return { session, expiresAt };
  }

  async current({
    session,
  }: {
    session: string;
  }): Promise<{ subject: string }> {
    const doc = await this.#getActive(session);
    return { subject: doc.subject };
  }

  async end({
    session,
  }: {
    session: string;
  }): Promise<{ ended: boolean }> {
    await this.#getActive(session);
    if (this.collection) {
      await this.collection.deleteOne({ _id: session });
    } else {
      this.memory.delete(session);
    }
    return { ended: true };
  }

  async _active({
    session,
  }: {
    session: string;
  }): Promise<Array<{ subject: string; expiresAt: Date }>> {
    if (typeof session !== "string" || !session) return [];
    const now = this.clock();
    if (this.collection) {
      const doc = await this.collection.findOne({ _id: session, expiresAt: { $gt: now } });
      if (!doc) return [];
      return [{ subject: doc.subject, expiresAt: doc.expiresAt }];
    }
    const doc = this.memory.get(session);
    if (!doc || doc.expiresAt <= now) return [];
    return [{ subject: doc.subject, expiresAt: doc.expiresAt }];
  }

  async #getActive(session: string): Promise<SessionDoc> {
    if (typeof session !== "string" || !session) {
      throw new UnknownSession("This session is not active.");
    }
    const now = this.clock();
    if (this.collection) {
      const doc = await this.collection.findOne({ _id: session });
      if (!doc) {
        throw new UnknownSession("This session is not active.");
      }
      if (doc.expiresAt <= now) {
        await this.collection.deleteOne({ _id: session });
        throw new UnknownSession("This session is not active.");
      }
      return doc;
    }

    const doc = this.memory.get(session);
    if (!doc) {
      throw new UnknownSession("This session is not active.");
    }
    if (doc.expiresAt <= now) {
      this.memory.delete(session);
      throw new UnknownSession("This session is not active.");
    }
    return doc;
  }

  async #discardExpired(now: Date): Promise<void> {
    if (this.collection) {
      await this.collection.deleteMany({ expiresAt: { $lte: now } });
    } else {
      for (const [id, doc] of this.memory) {
        if (doc.expiresAt <= now) {
          this.memory.delete(id);
        }
      }
    }
  }
}
