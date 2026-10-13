# Profiling

## Purpose

Maintain profile and contact information for a user, allowing participants in an interaction to exchange verified contact methods out-of-band.

## Principle

Alice registers or updates her profile with name Alice and contact method (617) 555-0142. When queried, the system provides Alice's name and contact information. Later, Alice updates her contact method to (617) 555-9999, and subsequent queries return the updated information.

## Types

```types
external User
  The user whose profile is maintained.
```

## State

```state
a set of Profiles with
  a unique user User
  a name String
  a contact String
```

## Actions

```actions
update (user: User, name: String, contact: String) : returns (profile: Profile)
  where name is empty or contact is empty
  then
    refuses INVALID_PROFILE "Name and contact method cannot be empty."
  where some profile has user
  then
    set profile.name to name
    set profile.contact to contact
    returns profile
  where no profile has user
  then
    add a new profile with user, name, and contact
    returns profile
```

## Queries

```queries
_get (user: User) : optional (name: String, contact: String)
  answers the user's name and contact method
  answers no row if no profile exists for the user
```
