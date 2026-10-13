<!-- Generated from the BeaverBazaar assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# BeaverBazaar — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Auctioning

Defined in [Auctioning](../design/concepts/Auctioning.md), line 1.

#### Actions

- `create(owner: Owner, item: Item, startPrice: Number, increment: Number, buyout?: Number) : returns (auction: Auction)`
  - Refuses `INVALID_PRICE`: Start price must be non-negative and increment must be positive.
  - Refuses `INVALID_BUYOUT`: Buyout price must be greater than or equal to start price.
- `bid(bidder: Bidder, auction: Auction, amount: Number) : returns (auction: Auction)`
  - Refuses `AUCTION_NOT_FOUND`: There is no such auction.
  - Refuses `AUCTION_INACTIVE`: Cannot bid on an inactive auction.
  - Refuses `OWNER_CANNOT_BID`: The auction owner cannot place bids.
  - Refuses `BID_TOO_LOW`: Bid amount must meet the starting price or exceed the current price by at least the minimum increment.
- `close(owner: Owner, auction: Auction) : returns (auction: Auction)`
  - Refuses `AUCTION_NOT_FOUND`: There is no such auction.
  - Refuses `NOT_OWNER`: Only the auction owner can close this auction.
  - Refuses `ALREADY_CLOSED`: The auction is already closed.
- `delete(owner: Owner, auction: Auction) : returns (auction: Auction)`
  - Refuses `AUCTION_NOT_FOUND`: There is no such auction.
  - Refuses `NOT_OWNER`: Only the auction owner can delete this auction.
  - Refuses `CANNOT_DELETE_ACTIVE_BIDS`: Cannot delete an auction that has bids.

#### Queries

- `_get(auction: Auction) : optional (auction: Auction, owner: Owner, item: Item, highestBidder: Bidder, price: Number, increment: Number, active: Flag, buyout: Number)`
- `_byItem(item: Item) : optional (auction: Auction, owner: Owner, item: Item, highestBidder: Bidder, price: Number, increment: Number, active: Flag, buyout: Number)`
- `_active() : many (auction: Auction, owner: Owner, item: Item, highestBidder: Bidder, price: Number, increment: Number, buyout: Number)`

#### Instances

- `Auction` — instance of `Auctioning` — [Application types](../design/types.md), line 35.
  - `Bidder` is `Alias` — [Application types](../design/types.md), line 38.
  - `Item` is `Listing.Listing` — [Application types](../design/types.md), line 37.
  - `Owner` is `Alias` — [Application types](../design/types.md), line 36.

### Listing

Defined in [Listing](../design/concepts/Listing.md), line 1.

#### Actions

- `create(owner: User, item: Item) : returns (listing: Listing)`
- `update(owner: User, listing: Listing, item: Item) : returns (listing: Listing)`
  - Refuses `LISTING_NOT_FOUND`: There is no such listing.
  - Refuses `NOT_OWNER`: Only the listing owner can update this listing.
  - Refuses `LISTING_INACTIVE`: Cannot update an inactive listing.
- `deactivate(owner: User, listing: Listing) : returns (listing: Listing)`
  - Refuses `LISTING_NOT_FOUND`: There is no such listing.
  - Refuses `NOT_OWNER`: Only the listing owner can deactivate this listing.
  - Refuses `ALREADY_INACTIVE`: The listing is already inactive.
- `delete(owner: User, listing: Listing) : returns (listing: Listing)`
  - Refuses `LISTING_NOT_FOUND`: There is no such listing.
  - Refuses `NOT_OWNER`: Only the listing owner can delete this listing.

#### Queries

- `_get(listing: Listing) : optional (listing: Listing, owner: User, item: Item, active: Flag)`
- `_all() : many (listing: Listing, owner: User, item: Item, active: Flag)`
- `_active() : many (listing: Listing, owner: User, item: Item)`

#### Instances

- `Listing` — instance of `Listing` — [Application types](../design/types.md), line 27.
  - `Item` is `Item` — [Application types](../design/types.md), line 29.
  - `User` is `User` — [Application types](../design/types.md), line 28.

### Notifying

Defined in [Notifying](../design/concepts/Notifying.md), line 1.

#### Actions

- `notify(user: User, message: Message) : returns (notification: Notification)`
- `dismiss(notification: Notification) : returns (notification: Notification)`
  - Refuses `NO_SUCH_NOTIFICATION`: There is no such notification.

#### Queries

- `_all(user: User) : many (notification: Notification, message: Message)`

#### Instances

- `Notify` — instance of `Notifying` — [Application types](../design/types.md), line 40.
  - `Message` is `Message` — [Application types](../design/types.md), line 42.
  - `User` is `User` — [Application types](../design/types.md), line 41.

### Profiling

Defined in [Profiling](../design/concepts/Profiling.md), line 1.

#### Actions

- `update(user: User, name: String, contact: String) : returns (profile: Profile)`
  - Refuses `INVALID_PROFILE`: Name and contact method cannot be empty.

#### Queries

- `_get(user: User) : optional (name: String, contact: String)`

#### Instances

- `Profile` — instance of `Profiling` — [Application types](../design/types.md), line 24.
  - `User` is `User` — [Application types](../design/types.md), line 25.

### Pseudonyming

Defined in [Pseudonyming](../design/concepts/Pseudonyming.md), line 1.

#### Actions

- `getAlias(context: Context, user: User) : returns (alias: String)`
- `getUser(context: Context, alias: String) : returns (user: User)`
  - Refuses `NO_SUCH_PSEUDONYM`: No pseudonym matches the given alias in this context.

#### Queries

- `_getUser(context: Context, alias: String) : optional (user: User)`
- `_getAlias(context: Context, user: User) : optional (alias: String)`

#### Instances

- `Pseudonym` — instance of `Pseudonyming` — [Application types](../design/types.md), line 31.
  - `Context` is `Listing.Listing` — [Application types](../design/types.md), line 32.
  - `User` is `User` — [Application types](../design/types.md), line 33.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `current(session: Session) : returns (subject: Subject)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.
- `end(session: Session) : returns (ended: Flag)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.

#### Queries

- `_active(session: Session) : optional (subject: Subject, expiresAt: DateTime)`

#### Instances

- `Session` — instance of `Sessioning` — [Application types](../design/types.md), line 21.
  - `Subject` is `User` — [Application types](../design/types.md), line 22.

## Application types

Concrete types:

- `Alias` — [Application types](../design/types.md), line 10.
- `Item` — [Application types](../design/types.md), line 13.
- `Message` — [Application types](../design/types.md), line 16.
- `User` — [Application types](../design/types.md), line 7.

## Computations

- `formatBuyerNotification(item: String, sellerName?: String, sellerContact?: String) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 91.
- `formatSellerNotification(item: String, buyerName?: String, buyerContact?: String) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 94.
- `isBuyerPresent(highestBidder?: String) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 88.
- `isBuyoutMet(amount: Number, buyout?: Number) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 85.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### listing detail

Authored path: `BeaverBazaar.Marketplace.ListingDetail`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 39.

```former
Former "listing detail" — inputs (listing); bindings (item, active, auction, sellerAlias, highestBidder, price, increment, buyout, auctionActive); promises at most one record — forms:
  a record of
    where Listing._get (listing) has (active, item)
    where Auction._byItem (item: listing) has (active: auctionActive, auction, buyout, highestBidder, increment, owner: sellerAlias, price)
    active
    auction
    auctionActive
    buyout
    highestBidder
    increment
    item
    listing
    price
    sellerAlias
```

### marketplace feed

Authored path: `BeaverBazaar.Marketplace.MarketplaceFeed`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 37.

```former
Former "marketplace feed" — inputs (); bindings (auction, listing, sellerAlias, item, price, increment, buyout, highestBidder); promises exactly one record — forms:
  a record of
    listings: each Auction._active () has (auction, buyout, highestBidder, increment, item: listing, owner: sellerAlias, price)
      where Listing._get (listing) has (item)
      form a record of
        auction
        buyout
        highestBidder
        increment
        item
        listing
        price
        sellerAlias
```

### user notifications

Authored path: `BeaverBazaar.Notifications.UserNotifications`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 75.

```former
Former "user notifications" — inputs (user); bindings (notification, message); promises exactly one record — forms:
  a record of
    notifications: each Notify._all (user) has (message, notification)
      form a record of
        message
        notification
```

### user profile

Authored path: `BeaverBazaar.Profile.UserProfile`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 25.

```former
Former "user profile" — inputs (user); bindings (name, contact); promises at most one record — forms:
  a record of
    where Profile._get (user) has (contact, name)
    contact
    name
```

## Reactions

### BeaverBazaar.Auth.CurrentUser

Authored path: `BeaverBazaar.Auth.CurrentUser`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 11.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 17.

```reaction
when RequestBoundary.request (path: "/auth/me", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Auth.CurrentUser#2

Authored path: `BeaverBazaar.Auth.CurrentUser`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 11.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 17.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Auth.CurrentUser
where
  earlier, RequestBoundary.request (path: "/auth/me", requestId, session)
then
  RequestBoundary.respond (requestId, user)
```

### BeaverBazaar.Auth.SignIn

Authored path: `BeaverBazaar.Auth.SignIn`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 10.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 16.

```reaction
when RequestBoundary.request (path: "/auth/login", requestId, username)
then
  Session.start (subject: username)
```

### BeaverBazaar.Auth.SignIn#2

Authored path: `BeaverBazaar.Auth.SignIn`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 10.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 16.

```reaction
when Session.start (subject: username, expiresAt, session), asked by BeaverBazaar.Auth.SignIn
where
  earlier, RequestBoundary.request (path: "/auth/login", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session)
```

### BeaverBazaar.Auth.SignOut

Authored path: `BeaverBazaar.Auth.SignOut`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 13.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 18.

```reaction
when RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  Session.end (session)
```

### BeaverBazaar.Auth.SignOut#2

Authored path: `BeaverBazaar.Auth.SignOut`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 13.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 18.

```reaction
when Session.end (session, ended), asked by BeaverBazaar.Auth.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  RequestBoundary.respond (ended, requestId)
```

### BeaverBazaar.Marketplace.CloseAuction

Authored path: `BeaverBazaar.Marketplace.CloseAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 55.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 61.

```reaction
when RequestBoundary.request (auction, item, path: "/auctions/close", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Marketplace.CloseAuction#2

Authored path: `BeaverBazaar.Marketplace.CloseAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 55.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 61.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Marketplace.CloseAuction
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/close", requestId, session)
then
  Pseudonym.getAlias (context: item, user)
```

### BeaverBazaar.Marketplace.CloseAuction#3

Authored path: `BeaverBazaar.Marketplace.CloseAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 55.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 61.

```reaction
when Pseudonym.getAlias (context: item, user, alias), asked by BeaverBazaar.Marketplace.CloseAuction#2
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/close", requestId, session)
then
  Auction.close (auction, owner: alias)
```

### BeaverBazaar.Marketplace.CloseAuction#4

Authored path: `BeaverBazaar.Marketplace.CloseAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 55.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 61.

```reaction
when Auction.close (auction, owner: alias), asked by BeaverBazaar.Marketplace.CloseAuction#3
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/close", requestId, session)
then
  RequestBoundary.respond (auction, requestId)
```

### BeaverBazaar.Marketplace.CloseOnBuyout

Authored path: `BeaverBazaar.Marketplace.CloseOnBuyout`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 54.

```reaction
when Auction.bid (amount, auction)
where
  Auction._get (auction) has (buyout, owner)
  (met: true) is isBuyoutMet (amount, buyout)
then
  Auction.close (auction, owner)
```

### BeaverBazaar.Marketplace.CreateAuctionListing

Authored path: `BeaverBazaar.Marketplace.CreateAuctionListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 33.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 43.

```reaction
when RequestBoundary.request (buyout, increment, item, path: "/listings/create", requestId, session, startPrice)
then
  Session.current (session)
```

### BeaverBazaar.Marketplace.CreateAuctionListing#2

Authored path: `BeaverBazaar.Marketplace.CreateAuctionListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 33.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 43.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Marketplace.CreateAuctionListing
where
  earlier, RequestBoundary.request (buyout, increment, item, path: "/listings/create", requestId, session, startPrice)
then
  Listing.create (item, owner: user)
```

### BeaverBazaar.Marketplace.CreateAuctionListing#3

Authored path: `BeaverBazaar.Marketplace.CreateAuctionListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 33.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 43.

```reaction
when Listing.create (item, owner: user, listing), asked by BeaverBazaar.Marketplace.CreateAuctionListing#2
then
  Pseudonym.getAlias (context: listing, user)
```

### BeaverBazaar.Marketplace.CreateAuctionListing#4

Authored path: `BeaverBazaar.Marketplace.CreateAuctionListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 33.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 43.

```reaction
when Pseudonym.getAlias (context: listing, user, alias), asked by BeaverBazaar.Marketplace.CreateAuctionListing#3
where
  earlier, RequestBoundary.request (buyout, increment, item, path: "/listings/create", requestId, session, startPrice)
then
  Auction.create (buyout, increment, item: listing, owner: alias, startPrice)
```

### BeaverBazaar.Marketplace.CreateAuctionListing#5

Authored path: `BeaverBazaar.Marketplace.CreateAuctionListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 33.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 43.

```reaction
when Auction.create (buyout, increment, item: listing, owner: alias, startPrice, auction), asked by BeaverBazaar.Marketplace.CreateAuctionListing#4
where
  earlier, RequestBoundary.request (buyout, increment, item, path: "/listings/create", requestId, session, startPrice)
then
  RequestBoundary.respond (auction, listing, requestId)
```

### BeaverBazaar.Marketplace.DeleteAuction

Authored path: `BeaverBazaar.Marketplace.DeleteAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 56.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 62.

```reaction
when RequestBoundary.request (auction, item, path: "/auctions/delete", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Marketplace.DeleteAuction#2

Authored path: `BeaverBazaar.Marketplace.DeleteAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 56.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 62.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Marketplace.DeleteAuction
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/delete", requestId, session)
then
  Pseudonym.getAlias (context: item, user)
```

### BeaverBazaar.Marketplace.DeleteAuction#3

Authored path: `BeaverBazaar.Marketplace.DeleteAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 56.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 62.

```reaction
when Pseudonym.getAlias (context: item, user, alias), asked by BeaverBazaar.Marketplace.DeleteAuction#2
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/delete", requestId, session)
then
  Auction.delete (auction, owner: alias)
```

### BeaverBazaar.Marketplace.DeleteAuction#4

Authored path: `BeaverBazaar.Marketplace.DeleteAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 56.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 62.

```reaction
when Auction.delete (auction, owner: alias), asked by BeaverBazaar.Marketplace.DeleteAuction#3
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/delete", requestId, session)
then
  RequestBoundary.respond (auction, requestId)
```

### BeaverBazaar.Marketplace.GetFeed

Authored path: `BeaverBazaar.Marketplace.GetFeed`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 38.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 44.

```reaction
when RequestBoundary.request (path: "/marketplace/feed", requestId)
then
  RequestBoundary.respond (feed: former "marketplace feed", requestId)
```

### BeaverBazaar.Marketplace.GetListing

Authored path: `BeaverBazaar.Marketplace.GetListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 40.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 45.

```reaction
when RequestBoundary.request (listing, path: "/listings/get", requestId)
then
  RequestBoundary.respond (detail: former "listing detail" with (listing), requestId)
```

### BeaverBazaar.Marketplace.SubmitBid

Authored path: `BeaverBazaar.Marketplace.SubmitBid`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 50.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 60.

```reaction
when RequestBoundary.request (amount, auction, item, path: "/auctions/bid", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Marketplace.SubmitBid#2

Authored path: `BeaverBazaar.Marketplace.SubmitBid`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 50.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 60.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Marketplace.SubmitBid
where
  earlier, RequestBoundary.request (amount, auction, item, path: "/auctions/bid", requestId, session)
then
  Pseudonym.getAlias (context: item, user)
```

### BeaverBazaar.Marketplace.SubmitBid#3

Authored path: `BeaverBazaar.Marketplace.SubmitBid`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 50.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 60.

```reaction
when Pseudonym.getAlias (context: item, user, alias), asked by BeaverBazaar.Marketplace.SubmitBid#2
where
  earlier, RequestBoundary.request (amount, auction, item, path: "/auctions/bid", requestId, session)
then
  Auction.bid (amount, auction, bidder: alias)
```

### BeaverBazaar.Marketplace.SubmitBid#4

Authored path: `BeaverBazaar.Marketplace.SubmitBid`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 50.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 60.

```reaction
when Auction.bid (amount, auction, bidder: alias), asked by BeaverBazaar.Marketplace.SubmitBid#3
where
  earlier, RequestBoundary.request (amount, auction, item, path: "/auctions/bid", requestId, session)
then
  RequestBoundary.respond (auction, requestId)
```

### BeaverBazaar.Marketplace.SyncAuctionListingStatus

Authored path: `BeaverBazaar.Marketplace.SyncAuctionListingStatus`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 67.

```reaction
when Auction.close (auction)
where
  Auction._get (auction) has (item: listing, owner: sellerAlias)
  Pseudonym._getUser (alias: sellerAlias, context: listing) has (user: sellerUser)
then
  Listing.deactivate (listing, owner: sellerUser)
```

### BeaverBazaar.Notifications.DismissNotification

Authored path: `BeaverBazaar.Notifications.DismissNotification`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 77.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 81.

```reaction
when RequestBoundary.request (notification, path: "/notifications/dismiss", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Notifications.DismissNotification#2

Authored path: `BeaverBazaar.Notifications.DismissNotification`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 77.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 81.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Notifications.DismissNotification
where
  earlier, RequestBoundary.request (notification, path: "/notifications/dismiss", requestId, session)
then
  Notify.dismiss (notification)
```

### BeaverBazaar.Notifications.DismissNotification#3

Authored path: `BeaverBazaar.Notifications.DismissNotification`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 77.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 81.

```reaction
when Notify.dismiss (notification), asked by BeaverBazaar.Notifications.DismissNotification#2
where
  earlier, RequestBoundary.request (notification, path: "/notifications/dismiss", requestId, session)
then
  RequestBoundary.respond (notification, requestId)
```

### BeaverBazaar.Notifications.ListNotifications

Authored path: `BeaverBazaar.Notifications.ListNotifications`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 76.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 80.

```reaction
when RequestBoundary.request (path: "/notifications/list", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Notifications.ListNotifications#2

Authored path: `BeaverBazaar.Notifications.ListNotifications`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 76.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 80.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Notifications.ListNotifications
where
  earlier, RequestBoundary.request (path: "/notifications/list", requestId, session)
then
  RequestBoundary.respond (notifications: former "user notifications" with (user), requestId)
```

### BeaverBazaar.Notifications.NotifyBuyerOnClose

Authored path: `BeaverBazaar.Notifications.NotifyBuyerOnClose`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 72.

```reaction
when Auction.close (auction)
where
  Auction._get (auction) has (highestBidder: buyerAlias, item: listing, owner: sellerAlias)
  (hasWinner: true) is isBuyerPresent (highestBidder: buyerAlias)
  Pseudonym._getUser (alias: sellerAlias, context: listing) has (user: sellerUser)
  Pseudonym._getUser (alias: buyerAlias, context: listing) has (user: buyerUser)
  Listing._get (listing) has (item)
  whether Profile._get (user: sellerUser) has (contact: sellerContact, name: sellerName)
  (message: buyerMessage) is formatBuyerNotification (item, sellerContact, sellerName)
then
  Notify.notify (message: buyerMessage, user: buyerUser)
```

### BeaverBazaar.Notifications.NotifySellerOnClose

Authored path: `BeaverBazaar.Notifications.NotifySellerOnClose`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 70.

```reaction
when Auction.close (auction)
where
  Auction._get (auction) has (highestBidder: buyerAlias, item: listing, owner: sellerAlias)
  (hasWinner: true) is isBuyerPresent (highestBidder: buyerAlias)
  Pseudonym._getUser (alias: sellerAlias, context: listing) has (user: sellerUser)
  Pseudonym._getUser (alias: buyerAlias, context: listing) has (user: buyerUser)
  Listing._get (listing) has (item)
  whether Profile._get (user: buyerUser) has (contact: buyerContact, name: buyerName)
  (message: sellerMessage) is formatSellerNotification (buyerContact, buyerName, item)
then
  Notify.notify (message: sellerMessage, user: sellerUser)
```

### BeaverBazaar.Profile.UpdateProfile

Authored path: `BeaverBazaar.Profile.UpdateProfile`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 24.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 28.

```reaction
when RequestBoundary.request (contact, name, path: "/profile/update", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Profile.UpdateProfile#2

Authored path: `BeaverBazaar.Profile.UpdateProfile`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 24.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 28.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Profile.UpdateProfile
where
  earlier, RequestBoundary.request (contact, name, path: "/profile/update", requestId, session)
then
  Profile.update (contact, name, user)
```

### BeaverBazaar.Profile.UpdateProfile#3

Authored path: `BeaverBazaar.Profile.UpdateProfile`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 24.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 28.

```reaction
when Profile.update (contact, name, user, profile), asked by BeaverBazaar.Profile.UpdateProfile#2
where
  earlier, RequestBoundary.request (contact, name, path: "/profile/update", requestId, session)
then
  RequestBoundary.respond (profile, requestId)
```

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auctions/bid` — requires `amount`, `auction`, `item`, `session`
- `/auctions/close` — requires `auction`, `item`, `session`
- `/auctions/delete` — requires `auction`, `item`, `session`
- `/auth/login` — requires `username`
- `/auth/logout` — requires `session`
- `/auth/me` — requires `session`
- `/listings/create` — requires `session`, `item`, `startPrice`, `increment`; fills `buyout` with null when absent
- `/listings/get` — requires `listing`
- `/notifications/dismiss` — requires `notification`, `session`
- `/notifications/list` — requires `session`
- `/profile/update` — requires `contact`, `name`, `session`
