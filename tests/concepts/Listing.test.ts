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
 * create(owner, title, description, images):
 *   - owner: valid string
 *   - title, description, images: structured payload
 *   - postcondition: listing created with active = true, assigned unique ID
 *
 * update(owner, listing, title, description, images):
 *   - listing: exists vs not found (refuses LISTING_NOT_FOUND)
 *   - owner: matches owner vs non-owner (refuses NOT_OWNER)
 *   - active: active = true vs active = false (refuses LISTING_INACTIVE)
 *   - postcondition: fields updated in place
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
    // Partition: create(owner, title, description, images) with valid attributes
    const listingConcept = new ListingConcept();
    const title = "Bicycle";
    const description = "Lightweight road bike";
    const images = ["data:image/png;base64,bike1"];

    const { listing } = await listingConcept.create({ owner: "alice", title, description, images });
    expect(listing).toBeDefined();

    // Partition: _get(listing) when listing exists -> returns 1 row
    const got = await listingConcept._get({ listing });
    expect(got).toEqual([{ listing, owner: "alice", title, description, images, active: true }]);

    // Partition: _active() with active = true -> includes listing
    const activeListings = await listingConcept._active({});
    expect(activeListings).toEqual([{ listing, owner: "alice", title, description, images }]);

    // Partition: update(owner, listing, title, description, images) where owner matches and active = true
    const newTitle = "Bicycle (tuned)";
    const newDescription = "Recently serviced road bike";
    const newImages = ["data:image/png;base64,bike2"];
    await listingConcept.update({
      owner: "alice",
      listing,
      title: newTitle,
      description: newDescription,
      images: newImages,
    });
    const afterUpdate = await listingConcept._get({ listing });
    expect(afterUpdate[0].title).toEqual(newTitle);
    expect(afterUpdate[0].description).toEqual(newDescription);
    expect(afterUpdate[0].images).toEqual(newImages);

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
    const { listing } = await listingConcept.create({
      owner: "alice",
      title: "bike",
      description: "desc",
      images: [],
    });

    // Partition: update with owner != listing.owner -> refuses NOT_OWNER
    expect(
      listingConcept.update({
        owner: "bob",
        listing,
        title: "stolen bike",
        description: "desc",
        images: [],
      }),
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
      listingConcept.update({
        owner: "alice",
        listing: "missing",
        title: "bike",
        description: "desc",
        images: [],
      }),
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
    const { listing } = await listingConcept.create({
      owner: "alice",
      title: "bike",
      description: "desc",
      images: [],
    });
    await listingConcept.deactivate({ owner: "alice", listing });

    // Partition: update on listing where active == false -> refuses LISTING_INACTIVE
    expect(
      listingConcept.update({
        owner: "alice",
        listing,
        title: "new item",
        description: "desc",
        images: [],
      }),
    ).rejects.toThrow(ListingInactive);

    // Partition: deactivate on listing where active == false -> refuses ALREADY_INACTIVE
    expect(listingConcept.deactivate({ owner: "alice", listing })).rejects.toThrow(
      AlreadyInactive,
    );
  });
});
