import { describe, expect, test } from "bun:test";
import { SettlingConcept } from "../../src/concepts/Settling.ts";

/**
 * Testing strategy for SettlingConcept:
 *
 * record(buyer, seller, item, title, price, buyerAlias, sellerAlias, buyerName?, buyerContact?, sellerName?, sellerContact?):
 *   - buyer/seller: valid user identifiers
 *   - price: valid non-negative number vs invalid (negative, NaN, Infinity)
 *   - item: valid listing ID
 *   - postcondition: settlement record added, returns settlement ID
 *
 * _forUser(user):
 *   - user is the buyer: returns settlement
 *   - user is the seller: returns settlement
 *   - user is an unrelated third party: returns empty array
 *   - user with multiple settlements: returns all matching records
 *   - ordering: orders rows by settlement ID
 */
describe("SettlingConcept", () => {
  test("principle & immutability: record and query bilateral settlements", async () => {
    const settling = new SettlingConcept();

    // Record settlement 1: Alice is seller, Bob is buyer
    const { settlement: s1 } = await settling.record({
      buyer: "bob",
      seller: "alice",
      item: "listing-1",
      title: "Vintage Road Bike",
      price: 150,
      buyerAlias: "buyer-alias-1",
      sellerAlias: "seller-alias-1",
      buyerName: "Bob Smith",
      buyerContact: "bob@mit.edu",
      sellerName: "Alice Doe",
      sellerContact: "(617) 555-0101",
    });

    expect(s1).toBeDefined();

    // Record settlement 2: Alice is buyer, Charlie is seller
    const { settlement: s2 } = await settling.record({
      buyer: "alice",
      seller: "charlie",
      item: "listing-2",
      title: "Textbook",
      price: 45,
      buyerAlias: "buyer-alias-2",
      sellerAlias: "seller-alias-2",
      buyerName: "Alice Doe",
      buyerContact: "alice@mit.edu",
      sellerName: "Charlie Brown",
      sellerContact: "charlie@mit.edu",
    });

    expect(s2).toBeDefined();

    // Partition: _forUser where user is both buyer (in s2) and seller (in s1)
    const aliceSettlements = await settling._forUser({ user: "alice" });
    expect(aliceSettlements).toHaveLength(2);
    // Reverse chronological order: s2 (recorded second) must appear before s1 (recorded first)
    expect(aliceSettlements[0].settlement).toBe(s2);
    expect(aliceSettlements[1].settlement).toBe(s1);
    expect(aliceSettlements.map((s) => s.settlement)).toEqual(expect.arrayContaining([s1, s2]));
    const titles = aliceSettlements.map((s) => s.title);
    expect(titles).toContain("Vintage Road Bike");
    expect(titles).toContain("Textbook");

    // Partition: _forUser where user is only buyer
    const bobSettlements = await settling._forUser({ user: "bob" });
    expect(bobSettlements).toHaveLength(1);
    expect(bobSettlements[0].settlement).toBe(s1);
    expect(bobSettlements[0].sellerAlias).toBe("seller-alias-1");

    // Partition: _forUser where user is unrelated third party
    const eveSettlements = await settling._forUser({ user: "eve" });
    expect(eveSettlements).toEqual([]);
  });

  test("input validation partitions: rejects invalid participants and prices", async () => {
    const settling = new SettlingConcept();

    // Blank buyer
    await expect(
      settling.record({
        buyer: "",
        seller: "alice",
        item: "listing-1",
        title: "Bike",
        price: 50,
        buyerAlias: "b",
        sellerAlias: "a",
      }),
    ).rejects.toThrow("Invalid buyer identifier.");

    // Blank seller
    await expect(
      settling.record({
        buyer: "bob",
        seller: "   ",
        item: "listing-1",
        title: "Bike",
        price: 50,
        buyerAlias: "b",
        sellerAlias: "a",
      }),
    ).rejects.toThrow("Invalid seller identifier.");

    // Invalid negative or NaN price
    await expect(
      settling.record({
        buyer: "bob",
        seller: "alice",
        item: "listing-1",
        title: "Bike",
        price: -10,
        buyerAlias: "b",
        sellerAlias: "a",
      }),
    ).rejects.toThrow("Invalid settlement price.");

    await expect(
      settling.record({
        buyer: "bob",
        seller: "alice",
        item: "listing-1",
        title: "Bike",
        price: NaN,
        buyerAlias: "b",
        sellerAlias: "a",
      }),
    ).rejects.toThrow("Invalid settlement price.");
  });

  test("reverse chronological ordering: latest settlements appear at the top", async () => {
    const settling = new SettlingConcept();
    const user = "david";

    const { settlement: id1 } = await settling.record({
      buyer: user,
      seller: "seller-1",
      item: "item-1",
      title: "First Item",
      price: 10,
      buyerAlias: "david-1",
      sellerAlias: "seller-1",
    });
    const { settlement: id2 } = await settling.record({
      buyer: user,
      seller: "seller-2",
      item: "item-2",
      title: "Second Item",
      price: 20,
      buyerAlias: "david-2",
      sellerAlias: "seller-2",
    });
    const { settlement: id3 } = await settling.record({
      buyer: user,
      seller: "seller-3",
      item: "item-3",
      title: "Third Item",
      price: 30,
      buyerAlias: "david-3",
      sellerAlias: "seller-3",
    });

    const results = await settling._forUser({ user });
    expect(results).toHaveLength(3);
    expect(results.map((s) => s.settlement)).toEqual([id3, id2, id1]);
    expect(results.map((s) => s.title)).toEqual([
      "Third Item",
      "Second Item",
      "First Item",
    ]);
  });
});
