# Settling

## Purpose

Record and preserve an immutable, readonly log of concluded transactions between buyers and sellers with agreed terms and contact details.

## Principle

When an auction for an item concludes with a winning bidder, a settlement is recorded containing the buyer, seller, item, final price, pseudonyms, and registered contact information. Both the buyer and seller can review their historical settlements at any time to coordinate fulfillment. Settlements cannot be dismissed or altered.

## Types

```types
external User
  The participating student (buyer or seller).

external Item
  The item or listing settled.
```

## State

```state
a set of Settlements with
  a buyer User
  a seller User
  an item Item
  a title String
  a price Number
  a buyerAlias String
  a sellerAlias String
  an optional buyerName String
  an optional buyerContact String
  an optional sellerName String
  an optional sellerContact String
```

## Actions

```actions
record (buyer: User, seller: User, item: Item, title: String, price: Number, buyerAlias: String, sellerAlias: String, buyerName?: String, buyerContact?: String, sellerName?: String, sellerContact?: String) : returns (settlement: Settlement)
  where true
  then
    add a new settlement with buyer, seller, item, title, price, buyerAlias, sellerAlias, buyerName, buyerContact, sellerName, sellerContact
    returns settlement
```

## Queries

```queries
_forUser (user: User) : many (settlement: Settlement, buyer: User, seller: User, item: Item, title: String, price: Number, buyerAlias: String, sellerAlias: String, buyerName: String, buyerContact: String, sellerName: String, sellerContact: String)
  answers all settlements involving the user
  orders rows by settlement
```
