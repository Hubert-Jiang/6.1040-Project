import { describe, expect, test } from "bun:test";
import {
  SessioningConcept,
  UnknownSession,
} from "../../src/concepts/Sessioning.ts";

/**
 * Testing strategy for SessioningConcept:
 *
 * start(subject):
 *   - subject: valid subject identity string
 *   - postcondition: generates unique session token, sets expiresAt to now + 30m, discards prior expired sessions
 *
 * current(session):
 *   - session token:
 *     - active and unexpired -> returns { subject }
 *     - expired -> removes expired session, refuses UNKNOWN_SESSION
 *     - non-existent / invented -> refuses UNKNOWN_SESSION
 *
 * end(session):
 *   - session token:
 *     - active and unexpired -> removes session, returns { ended: true }
 *     - expired -> refuses UNKNOWN_SESSION
 *     - non-existent -> refuses UNKNOWN_SESSION
 *
 * _active(session):
 *   - session token:
 *     - active and unexpired -> returns 1 row { subject, expiresAt }
 *     - expired -> returns 0 rows []
 *     - non-existent -> returns 0 rows []
 */
describe("SessioningConcept", () => {
  test("principle & active lifecycle: start, resolve current, query active, and end", async () => {
    const fixedNow = new Date("2026-10-13T12:00:00.000Z");
    const sessioning = new SessioningConcept(
      undefined,
      () => fixedNow,
      () => "session-1",
    );

    // Partition: start with valid subject -> creates session expiring in 30 minutes
    const { session, expiresAt } = await sessioning.start({ subject: "alice@mit.edu" });
    expect(session).toBe("session-1");
    expect(expiresAt).toEqual(new Date("2026-10-13T12:30:00.000Z"));

    // Partition: current(session) when active -> resolves subject
    expect(await sessioning.current({ session })).toEqual({ subject: "alice@mit.edu" });

    // Partition: _active(session) when active -> returns 1 row
    expect(await sessioning._active({ session })).toEqual([
      { subject: "alice@mit.edu", expiresAt: new Date("2026-10-13T12:30:00.000Z") },
    ]);

    // Partition: end(session) when active -> ends session
    const { ended } = await sessioning.end({ session });
    expect(ended).toBe(true);

    // Partition: _active and current after ended -> returns [] and refuses UNKNOWN_SESSION
    expect(await sessioning._active({ session })).toEqual([]);
    expect(sessioning.current({ session })).rejects.toThrow(UnknownSession);
  });

  test("expiry partitions: expired session is omitted from queries and refused by actions", async () => {
    let now = new Date("2026-10-13T12:00:00.000Z");
    const sessioning = new SessioningConcept(
      undefined,
      () => now,
      () => "session-1",
    );

    await sessioning.start({ subject: "alice@mit.edu" });

    // Advance clock past 30-minute expiration threshold
    now = new Date("2026-10-13T12:31:00.000Z");

    // Partition: _active on expired session -> returns []
    expect(await sessioning._active({ session: "session-1" })).toEqual([]);

    // Partition: current on expired session -> refuses UNKNOWN_SESSION
    expect(sessioning.current({ session: "session-1" })).rejects.toThrow(UnknownSession);

    // Partition: end on expired session -> refuses UNKNOWN_SESSION
    expect(sessioning.end({ session: "session-1" })).rejects.toThrow(UnknownSession);
  });

  test("non-existent session partition: invented token refused by current and end", async () => {
    const sessioning = new SessioningConcept();

    // Partition: current on invented session ID -> refuses UNKNOWN_SESSION
    expect(sessioning.current({ session: "invented-id" })).rejects.toThrow(UnknownSession);

    // Partition: end on invented session ID -> refuses UNKNOWN_SESSION
    expect(sessioning.end({ session: "invented-id" })).rejects.toThrow(UnknownSession);

    // Partition: _active on invented session ID -> returns []
    expect(await sessioning._active({ session: "invented-id" })).toEqual([]);
  });
});
