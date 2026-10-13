import type { Collection, Db } from "mongodb";

export class NoSuchNotification extends Error {}

export interface NotificationDoc {
  _id: string;
  user: string;
  message: string;
}

export class NotifyingConcept {
  private readonly collection?: Collection<NotificationDoc>;
  private readonly memory = new Map<string, NotificationDoc>();

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
    const notification = this.freshId();
    const doc: NotificationDoc = { _id: notification, user, message };
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
    if (this.collection) {
      const docs = await this.collection.find({ user }).sort({ _id: 1 }).toArray();
      return docs.map((d) => ({ notification: d._id, message: d.message }));
    }
    return [...this.memory.values()]
      .filter((d) => d.user === user)
      .sort((a, b) => a._id.localeCompare(b._id))
      .map((d) => ({ notification: d._id, message: d.message }));
  }
}
