import { describe, expect, test } from "bun:test";
import {
  AlreadyInactive,
  ListingConcept,
  ListingInactive,
  ListingNotFound,
  NotOwner,
} from "../../src/concepts/Listing.ts";

/**
 * Testing strategy for ListingConcept:
 *
 * create(owner, item):
 *   - owner: valid string
 *   - item: structured payload (title, metadata)
 *   - postcondition: listing created with active = true, assigned unique ID
 *
 * update(owner, listing, item):
 *   - listing: exists vs not found (refuses LISTING_NOT_FOUND)
 *   - owner: matches owner vs non-owner (refuses NOT_OWNER)
 *   - active: active = true vs active = false (refuses LISTING_INACTIVE)
 *   - postcondition: item field updated in place
 *
 * deactivate(owner, listing):
 *   - listing: exists vs not found (refuses LISTING_NOT_FOUND)
 *   - owner: matches owner vs non-owner (refuses NOT_OWNER)
 *   - active: active = true vs active = false (refuses ALREADY_INACTIVE)
 *   - postcondition: active flag set to false
 *
 * delete(owner, listing):
 *   - listing: exists vs not found (refuses LISTING_NOT_FOUND)
 *   - owner: matches owner vs non-owner (refuses NOT_OWNER)
 *   - postcondition: listing removed from collection
 *
 * _get(listing):
 *   - listing: present in state (returns 1 row) vs absent (returns 0 rows)
 *
 * _all():
 *   - catalog: empty vs multiple listings
 *
 * _active():
 *   - listings: mix of active and deactivated (filters exclusively active listings)
 */
describe("ListingConcept", () => {
  test("principle & lifecycle: create, update, deactivate, delete", async () => {
    // Partition: create(owner, item) with valid owner and item
    const listingConcept = new ListingConcept();
    const item = { title: "Bicycle", price: 60 };

    const { listing } = await listingConcept.create({ owner: "alice", item });
    expect(listing).toBeDefined();

    // Partition: _get(listing) when listing exists -> returns 1 row
    const got = await listingConcept._get({ listing });
    expect(got).toEqual([{ listing, owner: "alice", item, active: true }]);

    // Partition: _active() with active = true -> includes listing
    const activeListings = await listingConcept._active({});
    expect(activeListings).toEqual([{ listing, owner: "alice", item }]);

    // Partition: update(owner, listing, item) where owner matches and active = true
    const newItem = { title: "Bicycle (tuned)", price: 65 };
    await listingConcept.update({ owner: "alice", listing, item: newItem });
    const afterUpdate = await listingConcept._get({ listing });
    expect(afterUpdate[0].item).toEqual(newItem);

    // Partition: deactivate(owner, listing) where owner matches and active = true
    await listingConcept.deactivate({ owner: "alice", listing });
    const afterDeactivate = await listingConcept._get({ listing });
    expect(afterDeactivate[0].active).toBe(false);

    // Partition: _active() after deactivation -> excludes inactive listing
    expect(await listingConcept._active({})).toEqual([]);

    // Partition: delete(owner, listing) where owner matches
    await listingConcept.delete({ owner: "alice", listing });

    // Partition: _get(listing) when listing deleted -> returns []
    expect(await listingConcept._get({ listing })).toEqual([]);
  });

  test("ownership partition: refuses operations by non-owner", async () => {
    const listingConcept = new ListingConcept();
    const { listing } = await listingConcept.create({ owner: "alice", item: "bike" });

    // Partition: update with owner != listing.owner -> refuses NOT_OWNER
    expect(
      listingConcept.update({ owner: "bob", listing, item: "stolen bike" }),
    ).rejects.toThrow(NotOwner);

    // Partition: deactivate with owner != listing.owner -> refuses NOT_OWNER
    expect(listingConcept.deactivate({ owner: "bob", listing })).rejects.toThrow(NotOwner);

    // Partition: delete with owner != listing.owner -> refuses NOT_OWNER
    expect(listingConcept.delete({ owner: "bob", listing })).rejects.toThrow(NotOwner);
  });

  test("existence partition: refuses operations on non-existent listing", async () => {
    const listingConcept = new ListingConcept();

    // Partition: update with unknown listing -> refuses LISTING_NOT_FOUND
    expect(
      listingConcept.update({ owner: "alice", listing: "missing", item: "bike" }),
    ).rejects.toThrow(ListingNotFound);

    // Partition: deactivate with unknown listing -> refuses LISTING_NOT_FOUND
    expect(listingConcept.deactivate({ owner: "alice", listing: "missing" })).rejects.toThrow(
      ListingNotFound,
    );

    // Partition: delete with unknown listing -> refuses LISTING_NOT_FOUND
    expect(listingConcept.delete({ owner: "alice", listing: "missing" })).rejects.toThrow(
      ListingNotFound,
    );
  });

  test("active status partition: update requires active, deactivate requires active", async () => {
    const listingConcept = new ListingConcept();
    const { listing } = await listingConcept.create({ owner: "alice", item: "bike" });
    await listingConcept.deactivate({ owner: "alice", listing });

    // Partition: update on listing where active == false -> refuses LISTING_INACTIVE
    expect(
      listingConcept.update({ owner: "alice", listing, item: "new item" }),
    ).rejects.toThrow(ListingInactive);

    // Partition: deactivate on listing where active == false -> refuses ALREADY_INACTIVE
    expect(listingConcept.deactivate({ owner: "alice", listing })).rejects.toThrow(
      AlreadyInactive,
    );
  });
});
