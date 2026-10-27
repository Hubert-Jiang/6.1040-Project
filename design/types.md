# Application types

BeaverBazaar connects MIT community members to buy and sell second-hand goods
through pseudo-anonymous auctions tied to public listings.

```types
concrete User
  An MIT student authenticated via Kerberos and Touchstone.

concrete Alias
  A trackable, anonymous pseudonym string scoped to a listing context.

concrete Image
  An image URL or base64 data string representing a listing photo.

concrete Message
  A notification message text delivered to a user.
```

```instances
instantiate Sessioning as Session with
  Subject is User

instantiate Profiling as Profile with
  User is User

instantiate Listing with
  User is User
  Image is Image

instantiate Pseudonyming as Pseudonym with
  Context is Listing.Listing
  User is User

instantiate Auctioning as Auction with
  Owner is Alias
  Item is Listing.Listing
  Bidder is Alias

instantiate Notifying as Notify with
  User is User
  Message is Message

instantiate Settling as Settlement with
  User is User
  Item is Listing.Listing
```
