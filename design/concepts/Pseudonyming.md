# Pseudonyming

## Purpose

Provide trackable, bijective, and anonymous aliases within a given context, concealing participant identities while preserving accountability and attribution.

## Principle

Alice participates in an auction context and generates an alias SwiftSparrow. Alice retrieves this alias consistently within the same auction context. The system can resolve SwiftSparrow back to Alice within that context when the auction closes. In a different auction context, Alice receives a distinct pseudonym.

## Types

```types
external Context
  The scoping entity within which pseudonyms are unique.

external User
  The real user identity being masked.
```

## State

```state
a set of Pseudonyms with
  a context Context
  a user User
  an alias String

Rule: at most one Pseudonym has each context and user pair
Rule: at most one Pseudonym has each context and alias pair
```

## Actions

```actions
getAlias (context: Context, user: User) : returns (alias: String)
  where some pseudonym has context and user
  then
    returns alias
  where no pseudonym has context and user
  then
    add a new pseudonym with context, user, and a newly generated alias unique to context
    returns alias

getUser (context: Context, alias: String) : returns (user: User)
  where some pseudonym has context and alias
  then
    returns user
  where no pseudonym has context and alias
  then
    refuses NO_SUCH_PSEUDONYM "No pseudonym matches the given alias in this context."
```

## Queries

```queries
_getUser (context: Context, alias: String) : optional (user: User)
  answers the user identity associated with the alias in the context
  answers no row if no pseudonym matches the alias in that context

_getAlias (context: Context, user: User) : optional (alias: String)
  answers the alias associated with the user in the context
  answers no row if the user does not have a pseudonym in that context
```
