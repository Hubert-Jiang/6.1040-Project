import { describe, expect, test } from "bun:test";
import {
  InvalidProfile,
  ProfilingConcept,
} from "../../src/concepts/Profiling.ts";

/**
 * Testing strategy for ProfilingConcept:
 *
 * update(user, name, contact):
 *   - user: valid user ID
 *   - name: empty string or whitespace (refuses INVALID_PROFILE) vs non-empty string
 *   - contact: empty string or whitespace (refuses INVALID_PROFILE) vs non-empty string
 *   - prior profile state:
 *     - user has no profile -> creates new profile record
 *     - user has existing profile -> updates name and contact in place
 *
 * _get(user):
 *   - profile present for user -> returns 1 row { name, contact }
 *   - profile absent for user -> returns 0 rows []
 */
describe("ProfilingConcept", () => {
  test("principle & state transition: initialize, query, and update profile", async () => {
    const profiling = new ProfilingConcept();

    // Partition: _get(user) before any profile is created -> returns []
    expect(await profiling._get({ user: "alice" })).toEqual([]);

    // Partition: update(user, name, contact) where user has no prior profile -> creates record
    const { profile } = await profiling.update({
      user: "alice",
      name: "Alice Smith",
      contact: "(617) 555-0142",
    });
    expect(profile).toBeDefined();

    // Partition: _get(user) after initial creation -> returns { name, contact }
    expect(await profiling._get({ user: "alice" })).toEqual([
      { name: "Alice Smith", contact: "(617) 555-0142" },
    ]);

    // Partition: update(user, name, contact) where user already has a profile -> updates in place
    await profiling.update({
      user: "alice",
      name: "Alice S.",
      contact: "(617) 555-9999",
    });

    // Partition: _get(user) after update -> reflects new values
    expect(await profiling._get({ user: "alice" })).toEqual([
      { name: "Alice S.", contact: "(617) 555-9999" },
    ]);
  });

  test("input validation partitions: refuses blank name or blank contact", async () => {
    const profiling = new ProfilingConcept();

    // Partition: name is empty string -> refuses INVALID_PROFILE
    expect(
      profiling.update({ user: "alice", name: "", contact: "123" }),
    ).rejects.toThrow(InvalidProfile);

    // Partition: name is whitespace only -> refuses INVALID_PROFILE
    expect(
      profiling.update({ user: "alice", name: "   ", contact: "123" }),
    ).rejects.toThrow(InvalidProfile);

    // Partition: contact is empty string -> refuses INVALID_PROFILE
    expect(
      profiling.update({ user: "alice", name: "Alice", contact: "" }),
    ).rejects.toThrow(InvalidProfile);

    // Partition: contact is whitespace only -> refuses INVALID_PROFILE
    expect(
      profiling.update({ user: "alice", name: "Alice", contact: "   " }),
    ).rejects.toThrow(InvalidProfile);
  });
});
