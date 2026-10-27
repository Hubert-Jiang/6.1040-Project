import { describe, expect, test } from "bun:test";
import {
  NoSuchNotification,
  NotifyingConcept,
} from "../../src/concepts/Notifying.ts";

/**
 * Testing strategy for NotifyingConcept:
 *
 * notify(user, message):
 *   - user: valid recipient ID
 *   - message: arbitrary notification text
 *   - postcondition: notification record added to collection, returns notification ID
 *
 * dismiss(notification):
 *   - notification: present in collection (removed) vs absent (refuses NO_SUCH_NOTIFICATION)
 *
 * _all(user):
 *   - user: recipient with multiple messages vs recipient with 0 messages
 *   - recipient isolation: filters strictly by the requested user
 */
describe("NotifyingConcept", () => {
  test("principle & lifecycle: deliver, query, and dismiss notifications", async () => {
    const notifying = new NotifyingConcept();

    // Partition: notify(user, message) for user with 0 notifications -> adds first
    const { notification: n1 } = await notifying.notify({
      user: "alice",
      message: "Your auction has closed.",
    });
    // Partition: notify(user, message) for user with existing notifications -> appends second
    const { notification: n2 } = await notifying.notify({
      user: "alice",
      message: "Buyer contact: (617) 555-0188",
    });

    // Partition: _all(user) when recipient has multiple notifications
    const notifications = await notifying._all({ user: "alice" });
    expect(notifications).toHaveLength(2);
    // Reverse chronological order: n2 (created second) must appear before n1 (created first)
    expect(notifications[0].notification).toBe(n2);
    expect(notifications[1].notification).toBe(n1);
    expect(notifications).toContainEqual({
      notification: n1,
      message: "Your auction has closed.",
    });
    expect(notifications).toContainEqual({
      notification: n2,
      message: "Buyer contact: (617) 555-0188",
    });

    // Partition: _all(user) when recipient has 0 notifications
    expect(await notifying._all({ user: "bob" })).toEqual([]);

    // Partition: dismiss(notification) on existing notification -> removes it
    await notifying.dismiss({ notification: n1 });
    const remaining = await notifying._all({ user: "alice" });
    expect(remaining).toEqual([
      { notification: n2, message: "Buyer contact: (617) 555-0188" },
    ]);
  });

  test("dismissal partition: refuses non-existent notification ID", async () => {
    const notifying = new NotifyingConcept();

    // Partition: dismiss on absent notification ID -> refuses NO_SUCH_NOTIFICATION
    expect(notifying.dismiss({ notification: "missing" })).rejects.toThrow(
      NoSuchNotification,
    );
  });

  test("reverse chronological ordering: latest notifications appear at the top", async () => {
    const notifying = new NotifyingConcept();
    const user = "carol";

    const { notification: id1 } = await notifying.notify({ user, message: "First message" });
    const { notification: id2 } = await notifying.notify({ user, message: "Second message" });
    const { notification: id3 } = await notifying.notify({ user, message: "Third message" });
    const { notification: id4 } = await notifying.notify({ user, message: "Fourth message" });

    const all = await notifying._all({ user });
    expect(all).toHaveLength(4);
    expect(all.map((n) => n.notification)).toEqual([id4, id3, id2, id1]);
    expect(all.map((n) => n.message)).toEqual([
      "Fourth message",
      "Third message",
      "Second message",
      "First message",
    ]);
  });
});
