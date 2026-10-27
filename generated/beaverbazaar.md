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
- `bid(bidder: Bidder, auction: Auction, amount: Number) : returns (auction: Auction, outbid?: Bidder)`
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

- `create(owner: User, title: String, description: String, images: Image) : returns (listing: Listing)`
- `update(owner: User, listing: Listing, title: String, description: String, images: Image) : returns (listing: Listing)`
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

- `_get(listing: Listing) : optional (listing: Listing, owner: User, title: String, description: String, images: Image, active: Flag)`
- `_all() : many (listing: Listing, owner: User, title: String, description: String, images: Image, active: Flag)`
- `_active() : many (listing: Listing, owner: User, title: String, description: String, images: Image)`

#### Instances

- `Listing` — instance of `Listing` — [Application types](../design/types.md), line 27.
  - `Image` is `Image` — [Application types](../design/types.md), line 29.
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

### Settling

Defined in [Settling](../design/concepts/Settling.md), line 1.

#### Actions

- `record(buyer: User, seller: User, item: Item, title: String, price: Number, buyerAlias: String, sellerAlias: String, buyerName?: String, buyerContact?: String, sellerName?: String, sellerContact?: String) : returns (settlement: Settlement)`

#### Queries

- `_forUser(user: User) : many (settlement: Settlement, buyer: User, seller: User, item: Item, title: String, price: Number, buyerAlias: String, sellerAlias: String, buyerName: String, buyerContact: String, sellerName: String, sellerContact: String)`

#### Instances

- `Settlement` — instance of `Settling` — [Application types](../design/types.md), line 44.
  - `Item` is `Listing.Listing` — [Application types](../design/types.md), line 46.
  - `User` is `User` — [Application types](../design/types.md), line 45.

## Application types

Concrete types:

- `Alias` — [Application types](../design/types.md), line 10.
- `Image` — [Application types](../design/types.md), line 13.
- `Message` — [Application types](../design/types.md), line 16.
- `User` — [Application types](../design/types.md), line 7.

## Computations

- `formatBuyerNotification(title: String, price?: Number) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 108.
- `formatOutbidNotification(title: String, amount: Number, listing: String) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 105.
- `formatSellerNotification(title: String, price?: Number) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 111.
- `isBuyerPresent(highestBidder?: String) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 99.
- `isBuyoutMet(amount: Number, buyout?: Number) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 96.
- `isDifferentBidder(newBidder: String, outbid?: String) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 102.
- `isUserHighestBidder(bidderUser?: User, viewer?: User) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 117.
- `isUserSeller(seller: User, viewer?: User) : Record` — [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 114.

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### listing detail

Authored path: `BeaverBazaar.Marketplace.ListingDetail`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 43.

```former
Former "listing detail" — inputs (listing, viewer); bindings (title, description, images, active, auction, sellerAlias, seller, highestBidder, bidderUser, price, increment, buyout, auctionActive, isSeller, isHighestBidder); promises at most one record — forms:
  a record of
    where Listing._get (listing) has (active, description, images, owner: seller, title)
    where Auction._byItem (item: listing) has (active: auctionActive, auction, buyout, highestBidder, increment, owner: sellerAlias, price)
    where (isSeller) is isUserSeller (seller, viewer)
    where whether Pseudonym._getUser (alias: highestBidder, context: listing) has (user: bidderUser)
    where (isHighestBidder) is isUserHighestBidder (bidderUser, viewer)
    active
    auction
    auctionActive
    buyout
    description
    highestBidder
    images
    increment
    isHighestBidder
    isSeller
    listing
    price
    sellerAlias
    title
```

### marketplace feed

Authored path: `BeaverBazaar.Marketplace.MarketplaceFeed`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 39.

```former
Former "marketplace feed" — inputs (viewer); bindings (auction, listing, sellerAlias, seller, title, description, images, price, increment, buyout, highestBidder, bidderUser, isSeller, isHighestBidder); promises exactly one record — forms:
  a record of
    listings: each Auction._active () has (auction, buyout, highestBidder, increment, item: listing, owner: sellerAlias, price)
      where Listing._get (listing) has (description, images, owner: seller, title)
      where (isSeller) is isUserSeller (seller, viewer)
      where whether Pseudonym._getUser (alias: highestBidder, context: listing) has (user: bidderUser)
      where (isHighestBidder) is isUserHighestBidder (bidderUser, viewer)
      form a record of
        auction
        buyout
        description
        highestBidder
        images
        increment
        isHighestBidder
        isSeller
        listing
        price
        sellerAlias
        title
```

### user notifications

Authored path: `BeaverBazaar.Notifications.UserNotifications`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 85.

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

### user settlements

Authored path: `BeaverBazaar.Settlement.UserSettlements`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 81.

```former
Former "user settlements" — inputs (user); bindings (settlement, buyer, seller, item, title, price, buyerAlias, sellerAlias, buyerName, buyerContact, sellerName, sellerContact); promises exactly one record — forms:
  a record of
    settlements: each Settlement._forUser (user) has (buyer, buyerAlias, buyerContact, buyerName, item, price, seller, sellerAlias, sellerContact, sellerName, settlement, title)
      form a record of
        buyer
        buyerAlias
        buyerContact
        buyerName
        item
        price
        seller
        sellerAlias
        sellerContact
        sellerName
        settlement
        title
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
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 61.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 67.

```reaction
when RequestBoundary.request (auction, item, path: "/auctions/close", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Marketplace.CloseAuction#2

Authored path: `BeaverBazaar.Marketplace.CloseAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 61.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 67.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Marketplace.CloseAuction
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/close", requestId, session)
then
  Pseudonym.getAlias (context: item, user)
```

### BeaverBazaar.Marketplace.CloseAuction#3

Authored path: `BeaverBazaar.Marketplace.CloseAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 61.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 67.

```reaction
when Pseudonym.getAlias (context: item, user, alias), asked by BeaverBazaar.Marketplace.CloseAuction#2
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/close", requestId, session)
then
  Auction.close (auction, owner: alias)
```

### BeaverBazaar.Marketplace.CloseAuction#4

Authored path: `BeaverBazaar.Marketplace.CloseAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 61.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 67.

```reaction
when Auction.close (auction, owner: alias), asked by BeaverBazaar.Marketplace.CloseAuction#3
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/close", requestId, session)
then
  RequestBoundary.respond (auction, requestId)
```

### BeaverBazaar.Marketplace.CloseOnBuyout

Authored path: `BeaverBazaar.Marketplace.CloseOnBuyout`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 60.

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
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 35.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 47.

```reaction
when RequestBoundary.request (buyout, description, images, increment, path: "/listings/create", requestId, session, startPrice, title)
then
  Session.current (session)
```

### BeaverBazaar.Marketplace.CreateAuctionListing#2

Authored path: `BeaverBazaar.Marketplace.CreateAuctionListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 35.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 47.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Marketplace.CreateAuctionListing
where
  earlier, RequestBoundary.request (buyout, description, images, increment, path: "/listings/create", requestId, session, startPrice, title)
then
  Listing.create (description, images, owner: user, title)
```

### BeaverBazaar.Marketplace.CreateAuctionListing#3

Authored path: `BeaverBazaar.Marketplace.CreateAuctionListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 35.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 47.

```reaction
when Listing.create (description, images, owner: user, title, listing), asked by BeaverBazaar.Marketplace.CreateAuctionListing#2
then
  Pseudonym.getAlias (context: listing, user)
```

### BeaverBazaar.Marketplace.CreateAuctionListing#4

Authored path: `BeaverBazaar.Marketplace.CreateAuctionListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 35.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 47.

```reaction
when Pseudonym.getAlias (context: listing, user, alias), asked by BeaverBazaar.Marketplace.CreateAuctionListing#3
where
  earlier, RequestBoundary.request (buyout, description, images, increment, path: "/listings/create", requestId, session, startPrice, title)
then
  Auction.create (buyout, increment, item: listing, owner: alias, startPrice)
```

### BeaverBazaar.Marketplace.CreateAuctionListing#5

Authored path: `BeaverBazaar.Marketplace.CreateAuctionListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 35.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 47.

```reaction
when Auction.create (buyout, increment, item: listing, owner: alias, startPrice, auction), asked by BeaverBazaar.Marketplace.CreateAuctionListing#4
where
  earlier, RequestBoundary.request (buyout, description, images, increment, path: "/listings/create", requestId, session, startPrice, title)
then
  RequestBoundary.respond (auction, listing, requestId)
```

### BeaverBazaar.Marketplace.DeleteAuction

Authored path: `BeaverBazaar.Marketplace.DeleteAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 62.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 68.

```reaction
when RequestBoundary.request (auction, item, path: "/auctions/delete", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Marketplace.DeleteAuction#2

Authored path: `BeaverBazaar.Marketplace.DeleteAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 62.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 68.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Marketplace.DeleteAuction
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/delete", requestId, session)
then
  Pseudonym.getAlias (context: item, user)
```

### BeaverBazaar.Marketplace.DeleteAuction#3

Authored path: `BeaverBazaar.Marketplace.DeleteAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 62.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 68.

```reaction
when Pseudonym.getAlias (context: item, user, alias), asked by BeaverBazaar.Marketplace.DeleteAuction#2
where
  earlier, RequestBoundary.request (auction, item, path: "/auctions/delete", requestId, session)
then
  Auction.delete (auction, owner: alias)
```

### BeaverBazaar.Marketplace.DeleteAuction#4

Authored path: `BeaverBazaar.Marketplace.DeleteAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 62.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 68.

```reaction
when Auction.delete (auction, owner: alias), asked by BeaverBazaar.Marketplace.DeleteAuction#3
where
  earlier, Session.current (session, subject: user), asked by BeaverBazaar.Marketplace.DeleteAuction
  earlier, Pseudonym.getAlias (context: item, user, alias), asked by BeaverBazaar.Marketplace.DeleteAuction#2
then
  Listing.delete (listing: item, owner: user)
```

### BeaverBazaar.Marketplace.DeleteAuction#5

Authored path: `BeaverBazaar.Marketplace.DeleteAuction`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 62.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 68.

```reaction
when Listing.delete (listing: item, owner: user), asked by BeaverBazaar.Marketplace.DeleteAuction#4
where
  earlier, Auction.delete (auction, owner: alias), asked by BeaverBazaar.Marketplace.DeleteAuction#3
  earlier, RequestBoundary.request (auction, item, path: "/auctions/delete", requestId, session)
then
  RequestBoundary.respond (auction, requestId)
```

### BeaverBazaar.Marketplace.GetFeed

Authored path: `BeaverBazaar.Marketplace.GetFeed`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 42.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 48.

```reaction
when RequestBoundary.request (path: "/marketplace/feed", requestId, session)
where
  whether Session._active (session) has (subject: viewer)
then
  RequestBoundary.respond (feed: former "marketplace feed" with (viewer), requestId)
```

### BeaverBazaar.Marketplace.GetListing

Authored path: `BeaverBazaar.Marketplace.GetListing`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 44.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 49.

```reaction
when RequestBoundary.request (listing, path: "/listings/get", requestId, session)
where
  whether Session._active (session) has (subject: viewer)
then
  RequestBoundary.respond (detail: former "listing detail" with (listing, viewer), requestId)
```

### BeaverBazaar.Marketplace.SubmitBid

Authored path: `BeaverBazaar.Marketplace.SubmitBid`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 54.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 66.

```reaction
when RequestBoundary.request (amount, auction, item, path: "/auctions/bid", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Marketplace.SubmitBid#2

Authored path: `BeaverBazaar.Marketplace.SubmitBid`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 54.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 66.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Marketplace.SubmitBid
where
  earlier, RequestBoundary.request (amount, auction, item, path: "/auctions/bid", requestId, session)
then
  Pseudonym.getAlias (context: item, user)
```

### BeaverBazaar.Marketplace.SubmitBid#3

Authored path: `BeaverBazaar.Marketplace.SubmitBid`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 54.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 66.

```reaction
when Pseudonym.getAlias (context: item, user, alias), asked by BeaverBazaar.Marketplace.SubmitBid#2
where
  earlier, RequestBoundary.request (amount, auction, item, path: "/auctions/bid", requestId, session)
then
  Auction.bid (amount, auction, bidder: alias)
```

### BeaverBazaar.Marketplace.SubmitBid#4

Authored path: `BeaverBazaar.Marketplace.SubmitBid`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 54.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 66.

```reaction
when Auction.bid (amount, auction, bidder: alias), asked by BeaverBazaar.Marketplace.SubmitBid#3
where
  earlier, RequestBoundary.request (amount, auction, item, path: "/auctions/bid", requestId, session)
then
  RequestBoundary.respond (auction, requestId)
```

### BeaverBazaar.Marketplace.SyncAuctionListingStatus

Authored path: `BeaverBazaar.Marketplace.SyncAuctionListingStatus`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 73.

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
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 87.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 92.

```reaction
when RequestBoundary.request (notification, path: "/notifications/dismiss", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Notifications.DismissNotification#2

Authored path: `BeaverBazaar.Notifications.DismissNotification`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 87.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 92.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Notifications.DismissNotification
where
  earlier, RequestBoundary.request (notification, path: "/notifications/dismiss", requestId, session)
then
  Notify.dismiss (notification)
```

### BeaverBazaar.Notifications.DismissNotification#3

Authored path: `BeaverBazaar.Notifications.DismissNotification`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 87.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 92.

```reaction
when Notify.dismiss (notification), asked by BeaverBazaar.Notifications.DismissNotification#2
where
  earlier, RequestBoundary.request (notification, path: "/notifications/dismiss", requestId, session)
then
  RequestBoundary.respond (notification, requestId)
```

### BeaverBazaar.Notifications.ListNotifications

Authored path: `BeaverBazaar.Notifications.ListNotifications`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 86.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 91.

```reaction
when RequestBoundary.request (path: "/notifications/list", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Notifications.ListNotifications#2

Authored path: `BeaverBazaar.Notifications.ListNotifications`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 86.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 91.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Notifications.ListNotifications
where
  earlier, RequestBoundary.request (path: "/notifications/list", requestId, session)
then
  RequestBoundary.respond (notifications: former "user notifications" with (user), requestId)
```

### BeaverBazaar.Notifications.NotifyBuyerOnClose

Authored path: `BeaverBazaar.Notifications.NotifyBuyerOnClose`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 79.

```reaction
when Auction.close (auction)
where
  Auction._get (auction) has (highestBidder: buyerAlias, item: listing, price)
  (hasWinner: true) is isBuyerPresent (highestBidder: buyerAlias)
  Pseudonym._getUser (alias: buyerAlias, context: listing) has (user: buyerUser)
  Listing._get (listing) has (title)
  (message: buyerMessage) is formatBuyerNotification (price, title)
then
  Notify.notify (message: buyerMessage, user: buyerUser)
```

### BeaverBazaar.Notifications.NotifyOutbidOnBid

Authored path: `BeaverBazaar.Notifications.NotifyOutbidOnBid`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 58.

```reaction
when Auction.bid (amount, auction, bidder, outbid)
where
  (different: true) is isDifferentBidder (newBidder: bidder, outbid)
  Auction._get (auction) has (item: listing)
  Pseudonym._getUser (alias: outbid, context: listing) has (user: outbidUser)
  Listing._get (listing) has (title)
  (message: outbidMessage) is formatOutbidNotification (amount, listing, title)
then
  Notify.notify (message: outbidMessage, user: outbidUser)
```

### BeaverBazaar.Notifications.NotifySellerOnClose

Authored path: `BeaverBazaar.Notifications.NotifySellerOnClose`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 78.

```reaction
when Auction.close (auction)
where
  Auction._get (auction) has (highestBidder: buyerAlias, item: listing, owner: sellerAlias, price)
  (hasWinner: true) is isBuyerPresent (highestBidder: buyerAlias)
  Pseudonym._getUser (alias: sellerAlias, context: listing) has (user: sellerUser)
  Listing._get (listing) has (title)
  (message: sellerMessage) is formatSellerNotification (price, title)
then
  Notify.notify (message: sellerMessage, user: sellerUser)
```

### BeaverBazaar.Profile.GetProfile

Authored path: `BeaverBazaar.Profile.GetProfile`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 26.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 30.

```reaction
when RequestBoundary.request (path: "/profile/get", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Profile.GetProfile#2

Authored path: `BeaverBazaar.Profile.GetProfile`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 26.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 30.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Profile.GetProfile
where
  earlier, RequestBoundary.request (path: "/profile/get", requestId, session)
then
  RequestBoundary.respond (profile: former "user profile" with (user), requestId)
```

### BeaverBazaar.Profile.UpdateProfile

Authored path: `BeaverBazaar.Profile.UpdateProfile`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 24.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 29.

```reaction
when RequestBoundary.request (contact, name, path: "/profile/update", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Profile.UpdateProfile#2

Authored path: `BeaverBazaar.Profile.UpdateProfile`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 24.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 29.

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
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 29.

```reaction
when Profile.update (contact, name, user, profile), asked by BeaverBazaar.Profile.UpdateProfile#2
where
  earlier, RequestBoundary.request (contact, name, path: "/profile/update", requestId, session)
then
  RequestBoundary.respond (profile, requestId)
```

### BeaverBazaar.Settlement.ListSettlements

Authored path: `BeaverBazaar.Settlement.ListSettlements`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 82.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 90.

```reaction
when RequestBoundary.request (path: "/settlements/list", requestId, session)
then
  Session.current (session)
```

### BeaverBazaar.Settlement.ListSettlements#2

Authored path: `BeaverBazaar.Settlement.ListSettlements`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 82.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 90.

```reaction
when Session.current (session, subject: user), asked by BeaverBazaar.Settlement.ListSettlements
where
  earlier, RequestBoundary.request (path: "/settlements/list", requestId, session)
then
  RequestBoundary.respond (requestId, settlements: former "user settlements" with (user))
```

### BeaverBazaar.Settlement.RecordSettlementOnClose

Authored path: `BeaverBazaar.Settlement.RecordSettlementOnClose`.
- Covered by [BeaverBazaar](../design/compositions/BeaverBazaar.md), line 77.

```reaction
when Auction.close (auction)
where
  Auction._get (auction) has (highestBidder: buyerAlias, item: listing, owner: sellerAlias, price)
  (hasWinner: true) is isBuyerPresent (highestBidder: buyerAlias)
  Pseudonym._getUser (alias: sellerAlias, context: listing) has (user: sellerUser)
  Pseudonym._getUser (alias: buyerAlias, context: listing) has (user: buyerUser)
  Listing._get (listing) has (title)
  whether Profile._get (user: buyerUser) has (contact: buyerContact, name: buyerName)
  whether Profile._get (user: sellerUser) has (contact: sellerContact, name: sellerName)
then
  Settlement.record (buyer: buyerUser, buyerAlias, buyerContact, buyerName, item: listing, price, seller: sellerUser, sellerAlias, sellerContact, sellerName, title)
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
- `/listings/create` — requires `session`, `title`, `startPrice`, `increment`; fills `buyout` with null when absent; fills `description` with "" when absent; fills `images` with [] when absent
- `/listings/get` — requires `listing`; fills `session` with null when absent
- `/marketplace/feed` — fills `session` with null when absent
- `/notifications/dismiss` — requires `notification`, `session`
- `/notifications/list` — requires `session`
- `/profile/get` — requires `session`
- `/profile/update` — requires `contact`, `name`, `session`
- `/settlements/list` — requires `session`
