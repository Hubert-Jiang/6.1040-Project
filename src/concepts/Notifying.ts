import type { Collection, Db } from "mongodb";

export class NoSuchNotification extends Error {}

export interface NotificationDoc {
  _id: string;
  user: string;
  message: string;
  createdAt: number;
}

export class NotifyingConcept {
  private readonly collection?: Collection<NotificationDoc>;
  private readonly memory = new Map<string, NotificationDoc>();
  private counter = 0;

  constructor(
    db?: Db,
    private readonly freshId: () => string = () => crypto.randomUUID(),
  ) {
    if (db) {
      this.collection = db.collection<NotificationDoc>("notifying.notifications");
    }
  }

  async notify({
    user,
    message,
  }: {
    user: string;
    message: string;
  }): Promise<{ notification: string }> {
    if (typeof user !== "string" || !user.trim()) {
      throw new Error("Invalid user identifier.");
    }
    const cleanMessage = typeof message === "string" ? message.trim().slice(0, 1000) : "";
    if (cleanMessage.length === 0) {
      throw new Error("Notification message cannot be empty.");
    }
    const notification = this.freshId();
    const createdAt = Date.now() * 1000 + (this.counter++ % 1000);
    const doc: NotificationDoc = { _id: notification, user, message: cleanMessage, createdAt };
    if (this.collection) {
      await this.collection.insertOne(doc);
    } else {
      this.memory.set(notification, doc);
    }
    return { notification };
  }

  async dismiss({
    notification,
  }: {
    notification: string;
  }): Promise<{ notification: string }> {
    if (typeof notification !== "string" || !notification) {
      throw new NoSuchNotification("There is no such notification.");
    }
    if (this.collection) {
      const result = await this.collection.deleteOne({ _id: notification });
      if (result.deletedCount === 0) {
        throw new NoSuchNotification("There is no such notification.");
      }
      return { notification };
    }

    if (!this.memory.has(notification)) {
      throw new NoSuchNotification("There is no such notification.");
    }
    this.memory.delete(notification);
    return { notification };
  }

  async _all({
    user,
  }: {
    user: string;
  }): Promise<Array<{ notification: string; message: string }>> {
    if (typeof user !== "string" || !user) return [];
    if (this.collection) {
      const docs = await this.collection
        .find({ user })
        .sort({ createdAt: -1, _id: -1 })
        .toArray();
      return docs.map((d) => ({ notification: d._id, message: d.message }));
    }
    return [...this.memory.values()]
      .filter((d) => d.user === user)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || b._id.localeCompare(a._id))
      .map((d) => ({ notification: d._id, message: d.message }));
  }
}
