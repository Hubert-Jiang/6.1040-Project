# Listing

## Purpose

Display items for public viewing by publishing listings, so interested buyers can browse available goods and inspect item details.

## Principle

Alice publishes a listing for a bicycle. While the listing is active, Alice updates the bicycle's description. Later, when the bicycle is sold or withdrawn, Alice deactivates the listing so it is no longer open. Finally, Alice deletes the listing from the catalog.

## Types

```types
external User
  The owner who creates and manages a listing.

external Item
  The item data or payload associated with a listing.
```

## State

```state
a set of Listings with
  an owner User
  an item Item
  an active Flag
```

## Actions

```actions
create (owner: User, item: Item) : returns (listing: Listing)
  where true
  then
    add a new listing with owner, item, and active true
    returns listing

update (owner: User, listing: Listing, item: Item) : returns (listing: Listing)
  where listing not in listings
  then
    refuses LISTING_NOT_FOUND "There is no such listing."
  where listing in listings and listing.owner != owner
  then
    refuses NOT_OWNER "Only the listing owner can update this listing."
  where listing in listings and listing.owner == owner and not listing.active
  then
    refuses LISTING_INACTIVE "Cannot update an inactive listing."
  where listing in listings and listing.owner == owner and listing.active
  then
    set listing.item to item
    returns listing

deactivate (owner: User, listing: Listing) : returns (listing: Listing)
  where listing not in listings
  then
    refuses LISTING_NOT_FOUND "There is no such listing."
  where listing in listings and listing.owner != owner
  then
    refuses NOT_OWNER "Only the listing owner can deactivate this listing."
  where listing in listings and listing.owner == owner and not listing.active
  then
    refuses ALREADY_INACTIVE "The listing is already inactive."
  where listing in listings and listing.owner == owner and listing.active
  then
    set listing.active to false
    returns listing

delete (owner: User, listing: Listing) : returns (listing: Listing)
  where listing not in listings
  then
    refuses LISTING_NOT_FOUND "There is no such listing."
  where listing in listings and listing.owner != owner
  then
    refuses NOT_OWNER "Only the listing owner can delete this listing."
  where listing in listings and listing.owner == owner
  then
    remove listing
    returns listing
```

## Queries

```queries
_get (listing: Listing) : optional (listing: Listing, owner: User, item: Item, active: Flag)
  answers the listing's details
  answers no row for an unknown listing

_all () : many (listing: Listing, owner: User, item: Item, active: Flag)
  answers all listings
  orders rows by listing

_active () : many (listing: Listing, owner: User, item: Item)
  answers all currently active listings
  orders rows by listing
```
