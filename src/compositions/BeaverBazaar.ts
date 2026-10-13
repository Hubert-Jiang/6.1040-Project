import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, form, former, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Session, Profile, Listing, Pseudonym, Auction, Notify } = concepts;

// ==========================================
// Formers (Read Models)
// ==========================================

export const UserProfile = former("user profile", ({ user }, { name, contact }) =>
  where(Profile._get({ user }).is({ name, contact })).form({ name, contact }),
).optional();

export const MarketplaceFeed = former("marketplace feed", (_input, { listing, owner, item }) =>
  form({
    listings: each(Listing._active({}).is({ listing, owner, item })).form({
      listing,
      owner,
      item,
    }),
  }),
);

export const ListingDetail = former(
  "listing detail",
  ({ listing }, { owner, item, active }) =>
    where(Listing._get({ listing }).is({ listing, owner, item, active })).form({
      listing,
      owner,
      item,
      active,
    }),
).optional();

export const UserNotifications = former(
  "user notifications",
  ({ user }, { notification, message }) =>
    form({
      notifications: each(Notify._all({ user }).is({ notification, message })).form({
        notification,
        message,
      }),
    }),
);

// ==========================================
// Endpoints
// ==========================================

// Auth & Sessions
export const SignIn = endpoint("/auth/login", ({ username, session, expiresAt }) =>
  receive({ username })
    .then(Session.start({ subject: username }).responds({ session, expiresAt }))
    .then(respond({ session, expiresAt })),
);

export const CurrentUser = endpoint("/auth/me", ({ session, user }) =>
  receive({ session })
    .then(Session.current({ session }).responds({ subject: user }))
    .then(respond({ user })),
);

export const SignOut = endpoint("/auth/logout", ({ session, ended }) =>
  receive({ session })
    .then(Session.end({ session }).responds({ ended }))
    .then(respond({ ended })),
);

// Profile
export const UpdateProfile = endpoint(
  "/profile/update",
  ({ session, user, name, contact, profile }) =>
    receive({ session, name, contact })
      .then(Session.current({ session }).responds({ subject: user }))
      .then(Profile.update({ user, name, contact }).responds({ profile }))
      .then(respond({ profile })),
);

// Marketplace & Listings
export const CreateAuctionListing = endpoint(
  "/listings/create",
  ({ session, user, item, startPrice, increment, buyout, listing, alias, auction }) =>
    receive({ session, item, startPrice, increment, buyout })
      .then(Session.current({ session }).responds({ subject: user }))
      .then(Listing.create({ owner: user, item }).responds({ listing }))
      .then(Pseudonym.getAlias({ context: listing, user }).responds({ alias }))
      .then(
        Auction.create({ owner: alias, item: listing, startPrice, increment, buyout }).responds({
          auction,
        }),
      )
      .then(respond({ listing, auction })),
);

export const GetFeed = endpoint("/marketplace/feed", () =>
  receive({}).then(respond({ feed: MarketplaceFeed({}) })),
);

export const GetListing = endpoint("/listings/get", ({ listing }) =>
  receive({ listing }).then(respond({ detail: ListingDetail({ listing }) })),
);

// Auctions & Bids
export const SubmitBid = endpoint(
  "/auctions/bid",
  ({ session, user, auction, item, amount, alias }) =>
    receive({ session, auction, item, amount })
      .then(Session.current({ session }).responds({ subject: user }))
      .then(Pseudonym.getAlias({ context: item, user }).responds({ alias }))
      .then(Auction.bid({ bidder: alias, auction, amount }).responds({ auction }))
      .then(respond({ auction })),
);

export const CloseAuction = endpoint(
  "/auctions/close",
  ({ session, user, auction, item, alias }) =>
    receive({ session, auction, item })
      .then(Session.current({ session }).responds({ subject: user }))
      .then(Pseudonym.getAlias({ context: item, user }).responds({ alias }))
      .then(Auction.close({ owner: alias, auction }).responds({ auction }))
      .then(respond({ auction })),
);

export const DeleteAuction = endpoint(
  "/auctions/delete",
  ({ session, user, auction, item, alias }) =>
    receive({ session, auction, item })
      .then(Session.current({ session }).responds({ subject: user }))
      .then(Pseudonym.getAlias({ context: item, user }).responds({ alias }))
      .then(Auction.delete({ owner: alias, auction }).responds({ auction }))
      .then(respond({ auction })),
);

// Notifications
export const ListNotifications = endpoint(
  "/notifications/list",
  ({ session, user }) =>
    receive({ session })
      .then(Session.current({ session }).responds({ subject: user }))
      .then(respond({ notifications: UserNotifications({ user }) })),
);

export const DismissNotification = endpoint(
  "/notifications/dismiss",
  ({ session, user, notification }) =>
    receive({ session, notification })
      .then(Session.current({ session }).responds({ subject: user }))
      .then(Notify.dismiss({ notification }).responds({ notification }))
      .then(respond({ notification })),
);

// ==========================================
// Composition Export
// ==========================================

export const composition = {
  Auth: {
    SignIn,
    CurrentUser,
    SignOut,
  },
  Profile: {
    UpdateProfile,
    UserProfile,
  },
  Marketplace: {
    CreateAuctionListing,
    GetFeed,
    GetListing,
    SubmitBid,
    CloseAuction,
    DeleteAuction,
    MarketplaceFeed,
    ListingDetail,
  },
  Notifications: {
    ListNotifications,
    DismissNotification,
    UserNotifications,
  },
};
