# Auctioning

## Purpose

Allow participants to bid incrementally on an item or claim it via an instant buyout price, establishing fair and transparent competitive pricing.

## Principle

Alice starts an auction for a bicycle with a starting price of 60, a minimum increment of 5, and a buyout price of 75. Bob places a bid of 65, becoming the highest bidder. Later, Bob places a bid of 75; because the bid meets the buyout price, the auction immediately closes. If no buyout bid had been placed, Alice could have closed the auction manually. Alice can delete the auction if no bids have been placed.

## Types

```types
external Owner
  The seller who creates and owns the auction.

external Item
  The item being auctioned.

external Bidder
  A participant eligible to place bids.
```

## State

```state
a set of Auctions with
  an owner Owner
  an item Item
  an optional highestBidder Bidder
  a price Number
  an increment Number
  an active Flag
  an optional buyout Number
```

## Actions

```actions
create (owner: Owner, item: Item, startPrice: Number, increment: Number, buyout?: Number) : returns (auction: Auction)
  where startPrice < 0 or increment <= 0
  then
    refuses INVALID_PRICE "Start price must be non-negative and increment must be positive."
  where buyout != undefined and buyout < startPrice
  then
    refuses INVALID_BUYOUT "Buyout price must be greater than or equal to start price."
  where true
  then
    add a new auction with owner, item, price startPrice, increment, buyout, active true, and highestBidder None
    returns auction

bid (bidder: Bidder, auction: Auction, amount: Number) : returns (auction: Auction, outbid?: Bidder)
  where auction not in auctions
  then
    refuses AUCTION_NOT_FOUND "There is no such auction."
  where auction in auctions and not auction.active
  then
    refuses AUCTION_INACTIVE "Cannot bid on an inactive auction."
  where auction in auctions and auction.owner == bidder
  then
    refuses OWNER_CANNOT_BID "The auction owner cannot place bids."
  where auction in auctions and ((auction.highestBidder != None and amount < auction.price + auction.increment) or (auction.highestBidder == None and amount < auction.price))
  then
    refuses BID_TOO_LOW "Bid amount must meet the starting price or exceed the current price by at least the minimum increment."
  where true
  then
    let outbid = auction.highestBidder
    set auction.price to amount
    set auction.highestBidder to bidder
    returns auction, outbid

close (owner: Owner, auction: Auction) : returns (auction: Auction)
  where auction not in auctions
  then
    refuses AUCTION_NOT_FOUND "There is no such auction."
  where auction in auctions and auction.owner != owner
  then
    refuses NOT_OWNER "Only the auction owner can close this auction."
  where auction in auctions and not auction.active
  then
    refuses ALREADY_CLOSED "The auction is already closed."
  where auction in auctions and auction.owner == owner and auction.active
  then
    set auction.active to false
    returns auction

delete (owner: Owner, auction: Auction) : returns (auction: Auction)
  where auction not in auctions
  then
    refuses AUCTION_NOT_FOUND "There is no such auction."
  where auction in auctions and auction.owner != owner
  then
    refuses NOT_OWNER "Only the auction owner can delete this auction."
  where auction in auctions and auction.highestBidder != None
  then
    refuses CANNOT_DELETE_ACTIVE_BIDS "Cannot delete an auction that has bids."
  where auction in auctions and auction.owner == owner
  then
    remove auction
    returns auction
```

## Queries

```queries
_get (auction: Auction) : optional (auction: Auction, owner: Owner, item: Item, highestBidder: Bidder, price: Number, increment: Number, active: Flag, buyout: Number)
  answers the details of an auction
  answers no row for an unknown auction

_byItem (item: Item) : optional (auction: Auction, owner: Owner, item: Item, highestBidder: Bidder, price: Number, increment: Number, active: Flag, buyout: Number)
  answers the auction associated with the item
  answers no row when no auction exists for the item

_active () : many (auction: Auction, owner: Owner, item: Item, highestBidder: Bidder, price: Number, increment: Number, buyout: Number)
  answers all currently active auctions
  orders rows by auction
```
