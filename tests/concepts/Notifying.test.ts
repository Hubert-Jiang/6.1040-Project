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
});
