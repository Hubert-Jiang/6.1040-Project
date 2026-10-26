# Listing

## Purpose

Display items for public viewing by publishing listings with title, description, and images, so interested buyers can browse available goods and inspect item details.

## Principle

Alice publishes a listing for a bicycle with a title, description, and photos. While the listing is active, Alice updates the bicycle's details. Later, when the bicycle is sold or withdrawn, Alice deactivates the listing so it is no longer open. Finally, Alice deletes the listing from the catalog.

## Types

```types
external User
  The owner who creates and manages a listing.

external Image
  An image representation of the listed item.
```

## State

```state
a set of Listings with
  an owner User
  a title String
  a description String
  an images seq of Image
  an active Flag
```

## Actions

```actions
create (owner: User, title: String, description: String, images: Image) : returns (listing: Listing)
  where true
  then
    add a new listing with owner, title, description, images, and active true
    returns listing

update (owner: User, listing: Listing, title: String, description: String, images: Image) : returns (listing: Listing)
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
    set listing.title to title
    set listing.description to description
    set listing.images to images
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
_get (listing: Listing) : optional (listing: Listing, owner: User, title: String, description: String, images: Image, active: Flag)
  answers the listing's details
  answers no row for an unknown listing

_all () : many (listing: Listing, owner: User, title: String, description: String, images: Image, active: Flag)
  answers all listings
  orders rows by listing

_active () : many (listing: Listing, owner: User, title: String, description: String, images: Image)
  answers all currently active listings
  orders rows by listing
```
