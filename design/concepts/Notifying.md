# Notifying

## Purpose

Deliver and maintain messages for users to notify them of important asynchronous system events and status changes.

## Principle

The system delivers a notification to Alice that her bicycle auction has ended with a winning bidder. Alice views her notifications to read the message and obtain the buyer's contact info. Alice dismisses the notification once addressed.

## Types

```types
external User
  The recipient of the notification.

external Message
  The message content to deliver.
```

## State

```state
a set of Notifications with
  a user User
  a message Message
```

## Actions

```actions
notify (user: User, message: Message) : returns (notification: Notification)
  where true
  then
    add a new notification with user and message
    returns notification

dismiss (notification: Notification) : returns (notification: Notification)
  where notification not in notifications
  then
    refuses NO_SUCH_NOTIFICATION "There is no such notification."
  where notification in notifications
  then
    remove notification
    returns notification
```

## Queries

```queries
_all (user: User) : many (notification: Notification, message: Message)
  answers all notifications for the user
  orders rows by notification
```
