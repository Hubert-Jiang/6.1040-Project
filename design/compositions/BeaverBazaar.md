# BeaverBazaar

BeaverBazaar transforms campus dormspam sales into an organized, fair marketplace
featuring incremental bidding, instant buyouts, and contextual pseudonyms that protect
student privacy until a transaction resolves.

## Authentication and Sessions

MIT community members access the application via Touchstone authentication.
[Signing in](reaction:BeaverBazaar.Auth.SignIn) starts an opaque session for the verified
Kerberos username. An [active session resolves to its current subject](reaction:BeaverBazaar.Auth.CurrentUser),
ensuring that callers cannot act on behalf of another student.
[Signing out](reaction:BeaverBazaar.Auth.SignOut) ends the active session.

```endpoints
BeaverBazaar.Auth.SignIn at /auth/login
BeaverBazaar.Auth.CurrentUser at /auth/me
BeaverBazaar.Auth.SignOut at /auth/logout
```

## User Profiles and Contact Management

Students configure their preferred contact methods (such as a phone number) for post-auction coordination.
A student [updates their contact profile](reaction:BeaverBazaar.Profile.UpdateProfile) with their name and
phone number. The [user profile](former:BeaverBazaar.Profile.UserProfile) presents the student's saved contact details,
accessed via the [profile query endpoint](reaction:BeaverBazaar.Profile.GetProfile).

```endpoints
BeaverBazaar.Profile.UpdateProfile at /profile/update
BeaverBazaar.Profile.GetProfile at /profile/get
```

## Marketplace Feed and Listing Management

A seller [creates an auction listing](reaction:BeaverBazaar.Marketplace.CreateAuctionListing), which creates
a public listing with item details, assigns a unique pseudonym for the seller scoped to that listing, and
initializes the auction under that anonymous alias with the starting price, increment, and optional buyout price.

The [marketplace feed](former:BeaverBazaar.Marketplace.MarketplaceFeed) gathers all active listings alongside
their current pricing and buyout terms. Buyers inspect active goods via the [feed endpoint](reaction:BeaverBazaar.Marketplace.GetFeed).
Callers inspect an item's auction status and their own contextual alias via [listing details](former:BeaverBazaar.Marketplace.ListingDetail)
served by the [listing query endpoint](reaction:BeaverBazaar.Marketplace.GetListing).

```endpoints
BeaverBazaar.Marketplace.CreateAuctionListing at /listings/create
BeaverBazaar.Marketplace.GetFeed at /marketplace/feed
BeaverBazaar.Marketplace.GetListing at /listings/get
```

## Bidding and Auction Lifecycle

A buyer [submits a bid on an active auction](reaction:BeaverBazaar.Marketplace.SubmitBid). The application
assigns the buyer a unique pseudonym within the listing's context and submits the bid under that alias, concealing
the buyer's identity from public feeds.

If a submitted bid meets or exceeds the buyout price, the system automatically [closes the auction on buyout](reaction:BeaverBazaar.Marketplace.CloseOnBuyout).
A seller may also manually [close an active auction](reaction:BeaverBazaar.Marketplace.CloseAuction) once satisfied, or
[delete an auction before any bids have been placed](reaction:BeaverBazaar.Marketplace.DeleteAuction). Deleting an auction
removes the associated listing.

```endpoints
BeaverBazaar.Marketplace.SubmitBid at /auctions/bid
BeaverBazaar.Marketplace.CloseAuction at /auctions/close
BeaverBazaar.Marketplace.DeleteAuction at /auctions/delete
```

## Status Synchronization and Private Settlement

Closing an auction synchronizes the listing status to [deactivate it](reaction:BeaverBazaar.Marketplace.SyncAuctionListingStatus),
withdrawing the listing from the public active feed to prevent further bidding.

When an auction closes with a winning bidder, the system dispatches [private closing notifications to the seller](reaction:BeaverBazaar.Notifications.NotifySellerOnClose).
This resolves the seller's and buyer's aliases back to their real student identities, retrieves their registered
contact methods from their profiles, and [delivers private closing notifications to the buyer](reaction:BeaverBazaar.Notifications.NotifyBuyerOnClose) containing each other's contact details
so they can coordinate physical pickup and payment offline.

A student reads their incoming messages through the [user notifications read](former:BeaverBazaar.Notifications.UserNotifications)
accessed via the [notifications endpoint](reaction:BeaverBazaar.Notifications.ListNotifications).
A student [dismisses a handled notification](reaction:BeaverBazaar.Notifications.DismissNotification) once addressed.

```endpoints
BeaverBazaar.Notifications.ListNotifications at /notifications/list
BeaverBazaar.Notifications.DismissNotification at /notifications/dismiss
```

```computations
isBuyoutMet(amount: Number, buyout?: Number) : Record
  Checks whether the placed bid amount meets or exceeds the auction buyout price.

isBuyerPresent(highestBidder?: String) : Record
  Checks whether an auction has a recorded winning bidder upon closing.

formatBuyerNotification(item: String, sellerAlias: String, sellerUser: String, sellerName?: String, sellerContact?: String) : Record
  Formats the private notification message sent to the winning buyer with seller alias, actual identity, and contact details.

formatSellerNotification(item: String, buyerAlias: String, buyerUser: String, buyerName?: String, buyerContact?: String) : Record
  Formats the private notification message sent to the seller with winning buyer alias, actual identity, and contact details.
```

