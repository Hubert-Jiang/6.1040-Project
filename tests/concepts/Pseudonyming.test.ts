import { describe, expect, test } from "bun:test";
import {
  NoSuchPseudonym,
  PseudonymingConcept,
} from "../../src/concepts/Pseudonyming.ts";

/**
 * Testing strategy for PseudonymingConcept:
 *
 * getAlias(context, user):
 *   - context: valid context ID
 *   - user: valid user ID
 *   - prior existence:
 *     - (context, user) already mapped -> returns existing alias (stable mapping)
 *     - (context, user) unmapped -> generates fresh unique alias in context
 *   - multiplicity:
 *     - multiple users in same context -> receive distinct aliases
 *     - same user across different contexts -> receives distinct context-scoped aliases
 *
 * getUser(context, alias):
 *   - alias: mapped in context (returns user) vs unmapped in context (refuses NO_SUCH_PSEUDONYM)
 *
 * _getUser(context, alias):
 *   - mapped in context (returns 1 row) vs unmapped (returns 0 rows)
 *
 * _getAlias(context, user):
 *   - mapped in context (returns 1 row) vs unmapped (returns 0 rows)
 */
describe("PseudonymingConcept", () => {
  test("principle & stability: generate and retrieve pseudonyms within a context", async () => {
    const pseudonyming = new PseudonymingConcept();

    // Partition: getAlias for unmapped (context, user) -> generates fresh alias
    const { alias: alias1 } = await pseudonyming.getAlias({
      context: "context-1",
      user: "alice",
    });
    expect(alias1).toBeDefined();

    // Partition: getAlias for already mapped (context, user) -> returns identical alias
    const { alias: alias1Again } = await pseudonyming.getAlias({
      context: "context-1",
      user: "alice",
    });
    expect(alias1Again).toBe(alias1);

    // Partition: getUser for mapped (context, alias) -> returns original user
    const { user: resolvedUser } = await pseudonyming.getUser({
      context: "context-1",
      alias: alias1,
    });
    expect(resolvedUser).toBe("alice");

    // Partition: _getUser and _getAlias for mapped records -> 1 row each
    expect(await pseudonyming._getUser({ context: "context-1", alias: alias1 })).toEqual([
      { user: "alice" },
    ]);
    expect(await pseudonyming._getAlias({ context: "context-1", user: "alice" })).toEqual([
      { alias: alias1 },
    ]);
  });

  test("uniqueness & context isolation: distinct users and distinct contexts", async () => {
    const pseudonyming = new PseudonymingConcept();

    // Partition: multiple users in same context receive distinct aliases
    const { alias: aliceCtx1 } = await pseudonyming.getAlias({
      context: "context-1",
      user: "alice",
    });
    const { alias: bobCtx1 } = await pseudonyming.getAlias({
      context: "context-1",
      user: "bob",
    });
    expect(aliceCtx1).not.toBe(bobCtx1);

    // Partition: same user in different contexts receives independent aliases
    const { alias: aliceCtx2 } = await pseudonyming.getAlias({
      context: "context-2",
      user: "alice",
    });
    // Contexts are isolated: querying alias from context-1 in context-2 fails
    expect(
      pseudonyming.getUser({ context: "context-2", alias: aliceCtx1 }),
    ).rejects.toThrow(NoSuchPseudonym);
    expect(await pseudonyming._getUser({ context: "context-2", alias: aliceCtx1 })).toEqual([]);
  });

  test("unknown alias partitions: refuses getUser and returns empty query", async () => {
    const pseudonyming = new PseudonymingConcept();

    // Partition: getUser for unmapped alias -> refuses NO_SUCH_PSEUDONYM
    expect(
      pseudonyming.getUser({ context: "context-1", alias: "NonExistent" }),
    ).rejects.toThrow(NoSuchPseudonym);

    // Partition: _getUser for unmapped alias -> returns []
    expect(
      await pseudonyming._getUser({ context: "context-1", alias: "NonExistent" }),
    ).toEqual([]);

    // Partition: _getAlias for unmapped user -> returns []
    expect(
      await pseudonyming._getAlias({ context: "context-1", user: "unknown-user" }),
    ).toEqual([]);
  });
});
