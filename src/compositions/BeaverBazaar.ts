import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import {
  compute,
  each,
  form,
  former,
  reaction,
  when,
  where,
  whether,
} from "@mit-sdg/sync-engine/language";
import { concepts, computations } from "../concepts.ts";

const { Session, Profile, Listing, Pseudonym, Auction, Notify } = concepts;
const {
  isBuyoutMet,
  isBuyerPresent,
  formatBuyerNotification,
  formatSellerNotification,
  isUserSeller,
  isUserHighestBidder,
} = computations;

// ==========================================
// Formers (Read Models)
// ==========================================

export const UserProfile = former("user profile", ({ user }, { name, contact }) =>
  where(Profile._get({ user }).is({ name, contact })).form({ name, contact }),
).optional();

export const MarketplaceFeed = former(
  "marketplace feed",
  (
    { viewer },
    {
      auction,
      listing,
      sellerAlias,
      seller,
      item,
      price,
      increment,
      buyout,
      highestBidder,
      bidderUser,
      isSeller,
      isHighestBidder,
    },
  ) =>
    form({
      listings: each(
        Auction._active({}).is({
          auction,
          owner: sellerAlias,
          item: listing,
          highestBidder,
          price,
          increment,
          buyout,
        }),
      )
        .where(
          Listing._get({ listing }).is({ item, owner: seller }),
          compute(isUserSeller, { seller, viewer }, { isSeller }),
          whether(Pseudonym._getUser({ context: listing, alias: highestBidder }).is({ user: bidderUser })),
          compute(isUserHighestBidder, { bidderUser, viewer }, { isHighestBidder }),
        )
        .form({
          auction,
          listing,
          sellerAlias,
          item,
          price,
          increment,
          buyout,
          highestBidder,
          isSeller,
          isHighestBidder,
        }),
    }),
);

export const ListingDetail = former(
  "listing detail",
  (
    { listing, viewer },
    {
      item,
      active,
      auction,
      sellerAlias,
      seller,
      highestBidder,
      bidderUser,
      price,
      increment,
      buyout,
      auctionActive,
      isSeller,
      isHighestBidder,
    },
  ) =>
    where(
      Listing._get({ listing }).is({ item, active, owner: seller }),
      Auction._byItem({ item: listing }).is({
        auction,
        owner: sellerAlias,
        highestBidder,
        price,
        increment,
        buyout,
        active: auctionActive,
      }),
      compute(isUserSeller, { seller, viewer }, { isSeller }),
      whether(Pseudonym._getUser({ context: listing, alias: highestBidder }).is({ user: bidderUser })),
      compute(isUserHighestBidder, { bidderUser, viewer }, { isHighestBidder }),
    ).form({
      listing,
      item,
      active,
      auction,
      sellerAlias,
      highestBidder,
      price,
      increment,
      buyout,
      auctionActive,
      isSeller,
      isHighestBidder,
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

export const GetProfile = endpoint("/profile/get", ({ session, user }) =>
  receive({ session })
    .then(Session.current({ session }).responds({ subject: user }))
    .then(respond({ profile: UserProfile({ user }) })),
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
  {
    input: {
      required: ["session", "item", "startPrice", "increment"],
      defaults: { buyout: null },
    },
  },
);

export const GetFeed = endpoint(
  "/marketplace/feed",
  ({ session, viewer }) =>
    receive({ session })
      .where(whether(Session._active({ session }).is({ subject: viewer })))
      .then(respond({ feed: MarketplaceFeed({ viewer }) })),
  {
    input: {
      defaults: { session: null },
    },
  },
);

export const GetListing = endpoint(
  "/listings/get",
  ({ session, listing, viewer }) =>
    receive({ session, listing })
      .where(whether(Session._active({ session }).is({ subject: viewer })))
      .then(respond({ detail: ListingDetail({ listing, viewer }) })),
  {
    input: {
      required: ["listing"],
      defaults: { session: null },
    },
  },
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
// Reactions (Automated Synchronization)
// ==========================================

export const CloseOnBuyout = reaction(
  ({ auction, amount, owner, buyout }) =>
    when(Auction.bid({ auction, amount }).responds({}))
      .where(
        Auction._get({ auction }).is({ owner, buyout }),
        compute(isBuyoutMet, { amount, buyout }, { met: true }),
      )
      .then(Auction.close({ owner, auction })),
);

export const SyncAuctionListingStatus = reaction(
  ({ auction, listing, sellerAlias, sellerUser }) =>
    when(Auction.close({ auction }).responds({}))
      .where(
        Auction._get({ auction }).is({ item: listing, owner: sellerAlias }),
        Pseudonym._getUser({ context: listing, alias: sellerAlias }).is({ user: sellerUser }),
      )
      .then(Listing.deactivate({ owner: sellerUser, listing })),
);

export const NotifySellerOnClose = reaction(
  ({
    auction,
    listing,
    sellerAlias,
    buyerAlias,
    sellerUser,
    buyerUser,
    item,
    price,
    buyerName,
    buyerContact,
    sellerMessage,
  }) =>
    when(Auction.close({ auction }).responds({}))
      .where(
        Auction._get({ auction }).is({ item: listing, owner: sellerAlias, highestBidder: buyerAlias, price }),
        compute(isBuyerPresent, { highestBidder: buyerAlias }, { hasWinner: true }),
        Pseudonym._getUser({ context: listing, alias: sellerAlias }).is({ user: sellerUser }),
        Pseudonym._getUser({ context: listing, alias: buyerAlias }).is({ user: buyerUser }),
        Listing._get({ listing }).is({ item }),
        whether(Profile._get({ user: buyerUser }).is({ name: buyerName, contact: buyerContact })),
        compute(
          formatSellerNotification,
          { item, buyerAlias, buyerUser, buyerName, buyerContact, price },
          { message: sellerMessage },
        ),
      )
      .then(Notify.notify({ user: sellerUser, message: sellerMessage })),
);

export const NotifyBuyerOnClose = reaction(
  ({
    auction,
    listing,
    sellerAlias,
    buyerAlias,
    sellerUser,
    buyerUser,
    item,
    price,
    sellerName,
    sellerContact,
    buyerMessage,
  }) =>
    when(Auction.close({ auction }).responds({}))
      .where(
        Auction._get({ auction }).is({ item: listing, owner: sellerAlias, highestBidder: buyerAlias, price }),
        compute(isBuyerPresent, { highestBidder: buyerAlias }, { hasWinner: true }),
        Pseudonym._getUser({ context: listing, alias: sellerAlias }).is({ user: sellerUser }),
        Pseudonym._getUser({ context: listing, alias: buyerAlias }).is({ user: buyerUser }),
        Listing._get({ listing }).is({ item }),
        whether(Profile._get({ user: sellerUser }).is({ name: sellerName, contact: sellerContact })),
        compute(
          formatBuyerNotification,
          { item, sellerAlias, sellerUser, sellerName, sellerContact, price },
          { message: buyerMessage },
        ),
      )
      .then(Notify.notify({ user: buyerUser, message: buyerMessage })),
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
    GetProfile,
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
    CloseOnBuyout,
    SyncAuctionListingStatus,
  },
  Notifications: {
    ListNotifications,
    DismissNotification,
    UserNotifications,
    NotifySellerOnClose,
    NotifyBuyerOnClose,
  },
};
