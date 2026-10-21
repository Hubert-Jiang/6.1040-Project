> the concepts listed here and that are actually implemented have slightly diverged; refer to the generated design file for the technical specifications, which should be treated as the source of truth ([here](generated/beaverbazaar.md))

# Problem Framing

## Domain
Every year, students often realize that they have stuff that they have no use for anymore or can't keep. This is due to a myriad of reasons, such as it being too expensive to store/transport belongings in between school years. To either recoup the value of such items, reduce waste, or simply find someone who has more use, students attempt to re-sell to their peers. To this end, it has become a cultural phenomenon for students to engage in garage sale-like listings on Dormspam. These listings often come in the form of images, spreadsheets, or - most commonly - slideshows. They all follow the same format: a list of rules, contact information, what's being sold, and an asking price. Potential buyers interact with listings by leaving comments of either negotiated prices, or "claim \<kerb\>" to signal that they have agreed to purchase the item at the stipulated price. However, this hacky use of slideshows is extremely unorganized, which becomes particularly apparent with auction-like bidding. Additionally, in cases potential buyers already know what they want, they must scan dozens of slideshows to check for the presence of specific items.

*dormspam: MIT's informal mailing list where community members share events, club info, free food, sales, housing, surveys, etc.*

*Kerberos (kerb): Authentication system employed at MIT. "kerb" is used affectionately to refer to one's username*

## Stakeholders

### Sellers
- Manage inventory and update listings as items are claimed
- Answer questions
- Coordinate pickup and payments

### Buyers
- Regularly monitor dormspam for new listings
- Claim items/negotiate the best price
- Coordinate pickup


## Bad Situations

### Uncoordinated Bidding Wars
> Bob is selling a bicycle on dormspam. He pushes an email to dormspam to see if anyone is interested, and gets dozens of private emails back. Bob has to update each potential buyer with the latest/highest offer as they come in. Worst yet, if the highest bidder flakes, the seller must decided to either: (a) fall back to the next highest bidder or (b) restart the bidding process.

In the image below, we can see an exmaple of this bad situation. The seller has received a bunch of private replies to their original listing, each of whom are offering to pay the stipulated price. The issue here is that whether the status of the listing being up-to-date or not depends on the seller manually checking and updating it. Other users have no idea whether or not someone has already offerred to pay the stipulated amount.
![negotiation](assets/negotiation.png)

### Premature Claims
> Alice is selling a mini-fridge on dormspam for $50. Bob comments "claim bob", thinking he got a good deal and has secured the item. Eve knows that buying a new mini-fridge would cost much more retail, so she offers $100, despite Bob having already claimed the item. Alice checks the listing the next day and has two choices: (a) honor the sticker price, or (b) permit Eve's offer.

This bad situation is extremely similar to the one above, but it is subtley different. Specifically, we have fixed the problem of syncing; i.e. people know what offers others have made. However, we are still limited by how often the seller manually updates the listing. Here, if the seller was checking frequently, the bike lock would have gone to Tate. However, during that time, Hilary has offered more money, so it's unclear whether Hilary was even allowed to make that offer, and who the bike lock should go to.
![claim](assets/claim.png)

### Desired Item
> Bob lives at Next House and realized that a scooter would be really nice to have. However, buying a scooter from retail is extremely expensive, so he starts browsing dormspam for any listings. Bob ends up going through a dozen of the latest dormspam listings, but only finds clothes and stickers, no scooter. Bob doesn't want to be late to a listing and miss the opportunity to bid, so he repeats this every day for a week or two before finally finding a listing selling a scooter.

### Information Decay
> Alice is selling a monitor on dormspam but hasn't gotten any satisfactory offers. She suspects this is due to a lack of traffic and bumps her email on dormspam. However, by the end of the day, due to the sheer number of people posting to dormspam, Alice's listing has been pushed back to the bottom. Alice and other sellers continuously bump their listings for the next few weeks until they get sold, or are forced to agree to unsatisfactory offers due to time constraints.

Below, we can see the pattern of bumping dormspam listings as slowly drift to the bototm as there is no activity on the email thread itself.  \
<img src="assets/bump.png" alt="bump" width="50%">

### Social Stigma
> Bob is selling mental health books. Many people are interested in purchasing Bob's books, but don't want the public to know. They email Bob privately, who then has to coordinate these emails. *(see **Uncoordinated Bidding Wars**)*

### Privacy
Clearly the bad situation here is that since neither the buyer nor seller opted to publicly disclosing their contact information, e.g. phone numbers, they have to be okay with publicly coordinating the hand-off. There simply isn't any real option here, as in either way, their privacy is "voluntarily" violated. \
<img src="assets/privacy.png" alt="privacy" width="35%">





## Workaround & Comparables
### Dormspam
- It's become ingrained in MIT's culture that useful information things can be found in dormspam
- As a result, nearly every student is subscribed to dormspam
- All participants are already verified to be MIT community members
- To maximize returns and turnover rate, sellers want to reach as many peers as possible, as fast as possible
- Neither slideshows or emails are suited for inventory management, coordinating auctions, and communication

### eBay & Depop
- Solve bidding mechanics
- Offers in-person pickup
- High fees, even for in-person pickup (>13%, >3%, respectively)
- High volume; extremely competitive and requires large amount of maintenance
- Difficult to limit participation to MIT community members
- Requires an account to participate

### Craisglist & Facebook Marketplace/Groups
- Difficult to limit participation to MIT community members
- Could result in non-MIT community members showing up
- Requires an account to participate


## Soltuion Sketch
A companion webapp for the MIT community to post and participate in listings
- Authenticate users via Kerb & Touchstone
  - MIT community members already have a Kerb
  - Their Touchstone login is cached; no account creation or sign-in needed
  - All users are guaranteed to be MIT community members
- Integrated auction system (addresses "Uncoordinated Bidding Wars" and "Premature Claim" bad situations)
  - Sellers can set a starting price
  - Sellers can set a satisfactory instant-claim buyout price
  - Buyers can set a maximum-price they are willing to bid; service automatically bids in increments for them
  - Deadlines
- Pseudoanonymous listings and bidding
  - Allows for more "sensitive" listings
  - Maximizes participation
  - Privately shares preferred contact method between buyer & seller when listing resolves
  - Resolves "Privacy" bad situation, as users no longer need to choose between publicly disclosing contact information or publicly coordinating handoffs
- Notifications
  - New listings that match keywords in potential buyers' wishlist (addresses "Desired item" bad situation)
  - Updates (bids, description, etc.) on bookmarked listings
- Searching/sorting of listings by name, price, deadline, etc. (addresses "Desired item" bad situation)


# Application Pitch

BeaverBazaar aims to make the process of buying and selling on dormspam more convenient, while retaining dormspam's cultural charm. Currently, emails and slideshows are hacked together to act as an auction platform, resulting in compromises on fairness, privacy, and efficiency. To this end, BeaverBazaar offers a free-to-use companion platform that sellers can link to with their dormspam emails. Users will not need to create a new account; MIT community members authenticated through Touchstone will immediately be able to create, view, and bid on listings within the platform. Listings support automated bid increments, deadlines, and instant-claim prices, replacing messy comment threads and confusing rules. To protect student privacy, BeaverBazaar masks participant identities during active bidding so users can transact without broadcasting their personal interests or finances. Once a listing resolves, BeaverBazaar will automatically and privately share contact information between buyer/seller, keeping personal information off public feeds. Users retain complete control over their transactions by handling payments and pickups peer-to-peer.


# Concept Design

## Concepts

**concept** \
Listing[User, Item]

**purpose** \
users can display an item for public viewing by publishing it

**principle** \
an owner publishes a listing for an item;
the owner modifies aspects of the listing while active; \
the owner deactivates the listing while active; \
finally the owner deletes the listing

**state** \
a set of Listings with
- an owner User
- an item Item
- an active Flag

**actions** \
`create (owner: User, item: Item) : return (listing: Listing)` \
    *then* creates and returns the listing with `active=True`

`update (owner: User, listing: Listing, item: Item)` \
    *where* `owner` is the owner of `listing`, `listing` is active \
    *then* replaces the item in `listing` with `item`

`deactivate (owner: User, listing: Listing)` \
    *where* `owner` is the owner of `listing` and `listing` is active \
    *then* deactivates the listing

`delete (owner: User, listing: Listing)` \
    *where* `owner` is the owner of `listing` \
    *then* removes the listing from the set and deletes it

---

**concept** \
Auction[Owner, Item, Bidder]

**purpose** \
allow bidders to bid incrementally on an item owned by owner, or through an instant-claim buyout \
*(does not handle allocating the resource)*

**principle** \
an owner starts an auction for item with a starting price, increment, and optional buyout price; \
bidders place sequentially higher bids while active, incrementing by a minimum amount; \
bidding at or above the buyout price instantly ends the auction; \
otherwise, the owner can end the auction while active; \
finally, the owner can delete the auction \

**state** \
a set of Auctions with:
- an owner Owner
- an item Item
- [a highestBidder Bidder]
- a price Number
- an increment Number
- an active Flag
- [a buyout Number]

**actions** \
`create (owner: Owner, item: Item, startPrice: Number, increment: Number [, buyout: Number]) : return (auction: Auction)` \
    *where* `startPrice >= 0`, `increment > 0`, and (`buyout == None` or `buyout >= startPrice`)
    *then* creates and returns `auction` with the arguments as its fields (e.g. `price=startPrice`), as well as `active=True` and `highestBidder=None`

`bid (bidder: Bidder, auction: Auction, amount: Number)` \
    *where* `bidder != owner`, `active=True`, and `amount >= price + highestBidder ? increment : 0` \
    *then* updates `price=amount` and `highestBidder=bidder`

`close (owner: Owner, auction: Auction)` \
    *where* `owner` owns `auction` and `active=True` \
    *then* updates `active=False`

`delete (owner: Owner, auction: Auction)` \
    *where* `owner` owns `auction`, `active=True`, and `highestBidder=None` \
    *then* removes the auction from the set and deletes it

---

**concept** \
Pseudonym[Context, User]

**purpose** \
provide a trackable, bijective, and anonymous alias within a context to conceal the identity of a user

**principle** \
a pseudonym for a user is generated within a context; \
the pseudonym for a user can be retrieved within the context; \
the user behind a pseudonym can be retrieved within the context

**state** \
a set of Pseudonyms with:
- a context Context
- a user User
- an alias String

**actions**  \
`getUser (context: Context, alias: String) : return (user: User)` \
    *where* there is a pseudonym within `context` using `alias` \
    *then* returns the corresponding `user` for that pseudonym

`getAlias (context: Context, user: User) : return (alias: String)` \
    *then* if user has a pseudonym within `context`, returns the corresponding `alias` for that pseudonym \
    otherwise, creates and adds to the set a pseudonym for `user` using an alias that is unique within `context`, returning that alias

---

**concept** \
Notify[User, Message]

**purpose** \
add a message to a users log of notifications

**principle** \
there is a message to be conveyed to a specific user by the system; \
the message is sent as a notification

**state** \
a set of Notifications with:
- a user User
- a message Message

**actions** \
`notify (user: User, message: Message)` \
    *then* creates and adds to the set a notification for `user` with `message`


## Reactions
**reaction** createAuctionListing \
**when** Requesting.createAuction (user, item) \
**then** Listing.create (owner: user, item)

**reaction** initAuction \
**when**
    Requesting.createAuction (user, item, startPrice, increment [, buyout]) \
    Listing.create (owner: user, item) : (listing) \
    Pseudonym.getAlias (context: listing, user) : (alias) \
**then** Auction.create (alias, item: listing, startPrice, increment, buyout)

**reaction** syncAuctionListingStatus \
**when** \
    Auction.close (seller, auction) \
    Pseudonym.getUser (context: auction.item, alias: seller) : (user)
**then** Listing.deactivate (owner: user, listing: auction.item)

**reaction** syncAuctionListingDelete \
**when** \
    Auction.delete (seller, auction) \
    Pseudonym.getUser (context: auction.item, alias: seller) : (user)
**then** Listing.delete (owner: user, listing: auction.item)

**reaction** submitBid \
**when** \
    Requesting.bid (user, auction, amount) \
    Pseudonym.getAlias (context: auction.item, user) : (alias) \
**then** Auction.bid (bidder: alias, auction, amount)

**reaction** closeOnBuyout \
**when** Auction.bid (bidder, auction, amount) \
**where** `auction.buyout != None` and `amount >= auction.buyout` \
**then** Auction.close (owner: auction.owner, auction)

**reaction** notifyOnClose \
**when** \
    Auction.close (owner, auction) \
    Pseudonym.getUser (context: auction.item, alias: owner) : (user: userOwner) \
    Pseudonym.getUser (context: auction.item, alias: auction.highestBidder) : (user: userBuyer) \
**where** `action.highestBidder != None` \
**then** \
    Notify.notify (user: userOwner, message: "One of your auctions ended. Buyer: " + userBuyer) \
    Notify.notify (user: userBuyer, message: "You won an auction. Seller: " + userOwner)

### Concept Composition
Listings overall represent the visual listing of an item; e.g. the title, description, images, etc. As an invariant, Auctions are bijective onto Listings, and their status and whether or not they have been deleted are synchronized. This gives various beneficial side effects, but most notably allows us to keep the concepts of Auctioning and Listing independent. Additionally, listings are used as the context within which pseudonyms and generated and kept unique. This allows the buyers and sellers of auctions to be anonymous. Auction closing is also handled via reactions, as the `submitBid` reaction cascades/propogates all the way down to `notifyOnClose` as necessary.


# UI Sketches
*(quickly generated with Figma in a few minutes)*
![listings](assets/listings.png)
![create listing](assets/create_listing.png)
![listing detail](assets/listing_detail.png)


# User Journey

## Motivation & Problem Context

Bob is a freshman living at Next House who needs a reliable way to get to morning classes across campus. Seeking second-hand options on dormspam, he finds the status of items opaque—unclear current bids, confusing email threads, and cumbersome slideshows that bury item details. Sellers like Alice, an MIT senior preparing to graduate, want a fair, convenient way to sell items without uncoordinated bidding wars or publicly exposing their contact info and personal schedules to public email lists.

## Outline

Alice wants to sell her bicycle before moving off-campus and posts an auction listing on BeaverBazaar with a starting bid of $60, a minimum increment of $5, and an instant buyout price of $75. Bob logs in via Touchstone, browses the newly created listing, and decides to secure the bicycle immediately by submitting a $75 instant buyout bid under an automatically generated pseudonym. The bid triggers an automatic auction close and listing deactivation, preventing further bidding. BeaverBazaar then resolves both parties' pseudonyms and privately notifies Alice and Bob with each other's masked alias, actual verified student identity, and registered contact details, allowing them to coordinate physical pickup and payment offline without having broadcast their personal identities, financial bids, or contact info across public dormspam threads.

## Complete Scenario (from an empty database)

### Step 1: Seller Setup & Listing Creation
The database starts empty. Alice navigates to BeaverBazaar and signs in via Touchstone (`alice@mit.edu`). In her profile settings, she registers her display name `Alice Doe` and preferred contact method `(617) 555-0142`. Alice then posts an auction listing for her commuter bicycle: title "Vintage Fuji Bicycle", a starting price of $60, a minimum bid increment of $5, and an instant buyout price of $75. Upon submission:
- BeaverBazaar creates an active `Listing` owned by Alice (`alice@mit.edu`) with the bicycle title.
- BeaverBazaar generates a unique contextual pseudonym for Alice scoped to this listing (e.g., `SwiftSparrow`).
- An `Auction` is initialized with `SwiftSparrow` as the owner, item pointing to the listing ID, starting price of $60, minimum increment of $5, buyout price of $75, active status `true`, and no bids placed yet.

### Step 2: Buyer Discovery & Pseudonymous Bidding
Bob accesses BeaverBazaar and signs in via Touchstone (`bob@mit.edu`). In his profile settings, he registers his display name `Bob Smith` and preferred contact method `(617) 555-0188`. Bob browses the live marketplace feed and spots Alice's newly posted bicycle listing, showing the seller as masked alias `SwiftSparrow`.

Bob observes that the opening bid is $60, minimum increment is $5, and instant buyout price is $75. Wanting to guarantee the purchase immediately and avoid waiting, Bob submits an instant buyout bid of $75. Upon submission:
- BeaverBazaar generates a unique anonymous pseudonym for Bob within the listing context (e.g., `EagerBeaver`).
- The bid is recorded on the auction with bidder `EagerBeaver` and amount $75.

### Step 3: Automated Auction Close & Listing Deactivation
Because Bob's bid meets the $75 buyout threshold:
- The `CloseOnBuyout` reaction automatically invokes `Auction.close`.
- The `SyncAuctionListingStatus` reaction cascades upon auction closure to invoke `Listing.deactivate`. The bicycle listing is marked inactive and instantly withdrawn from the active marketplace feed, preventing any further bidding or confusion.

### Step 4: Private Bilateral Settlement & Contact Exchange
Upon auction closure, the system triggers the private settlement notification reactions (`NotifySellerOnClose` and `NotifyBuyerOnClose`):
- The system resolves the seller pseudonym `SwiftSparrow` back to Alice (`alice@mit.edu`, display name `Alice Doe`, phone `(617) 555-0142`).
- The system resolves the highest bidder pseudonym `EagerBeaver` back to Bob (`bob@mit.edu`, display name `Bob Smith`, phone `(617) 555-0188`).
- BeaverBazaar dispatches a private settlement notification to Alice:
  > *"Your auction for 'Vintage Fuji Bicycle' has ended! Counterparty: alias 'EagerBeaver', actual identity: Bob Smith (bob@mit.edu) | Contact: (617) 555-0188. Reach out to arrange pickup and payment."*
- BeaverBazaar dispatches a private settlement notification to Bob:
  > *"You won the auction for 'Vintage Fuji Bicycle'! Counterparty: alias 'SwiftSparrow', actual identity: Alice Doe (alice@mit.edu) | Contact: (617) 555-0142. Reach out to arrange pickup and payment."*

Alice and Bob review their settlement notifications in the top-right notifications drawer and contact each other directly via text message to arrange physical pickup at the Student Center and settle payment peer-to-peer. Throughout the entire public lifecycle of the listing and bidding, their identities were concealed behind pseudonyms, and their private contact information remained strictly confidential until the deal was completed.

# Testing & Verification

## Running Automated Tests

All tests are implemented using Bun's native test runner (`bun:test`) across 7 test suites covering every concept action and operational principle as well as full composition integration scenarios.

To execute the test suite:
```sh
bun test
```

### Database Setup
- The application concepts support dual-mode persistence: a live MongoDB instance (started via `bun run db:up` or `podman compose up -d mongo`) or an automatic in-memory fallback collection for tests.
- When MongoDB is active, each test initializes a clean state and isolates its actions to avoid cross-test contamination.
- Full local environment setup and database reset:
  ```sh
  bun run db:reset    # Reset local Mongo database volume
  bun run db:up       # Start Mongo container
  bun test            # Run all 22 tests across 7 files
  ```

### Saved Execution Output
Saved test output from the latest run is recorded in [tests/test-output.txt](tests/test-output.txt).


[Visual Design Study](https://docs.google.com/presentation/d/1lUvhIHo5sWtdN6N_uokCQdJ0MAK1Sp8GE7qkBk96m_0/edit?usp=sharing)
[Beta Demo](https://youtu.be/PPSDaQ8sFDY)
