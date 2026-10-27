import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";

import auctioningSpec from "@design/concepts/Auctioning.md" with { type: "text" };
import listingSpec from "@design/concepts/Listing.md" with { type: "text" };
import notifyingSpec from "@design/concepts/Notifying.md" with { type: "text" };
import profilingSpec from "@design/concepts/Profiling.md" with { type: "text" };
import pseudonymingSpec from "@design/concepts/Pseudonyming.md" with { type: "text" };
import sessioningSpec from "@design/concepts/Sessioning.md" with { type: "text" };
import settlingSpec from "@design/concepts/Settling.md" with { type: "text" };

import {
  AlreadyClosed,
  AuctionInactive,
  AuctionNotFound,
  AuctioningConcept,
  BidTooLow,
  CannotDeleteActiveBids,
  InvalidBuyout,
  InvalidPrice,
  NotOwner as AuctionNotOwner,
  OwnerCannotBid,
} from "./concepts/Auctioning.ts";
import {
  AlreadyInactive,
  ListingConcept,
  ListingInactive,
  ListingNotFound,
  NotOwner as ListingNotOwner,
} from "./concepts/Listing.ts";
import { NoSuchNotification, NotifyingConcept } from "./concepts/Notifying.ts";
import { InvalidProfile, ProfilingConcept } from "./concepts/Profiling.ts";
import { NoSuchPseudonym, PseudonymingConcept } from "./concepts/Pseudonyming.ts";
import { SessioningConcept, UnknownSession } from "./concepts/Sessioning.ts";
import { SettlingConcept } from "./concepts/Settling.ts";

const Session = registerConcept({
  class: SessioningConcept,
  spec: sessioningSpec,
  refusals: { UNKNOWN_SESSION: UnknownSession },
});

const Profile = registerConcept({
  class: ProfilingConcept,
  spec: profilingSpec,
  refusals: { INVALID_PROFILE: InvalidProfile },
});

const Listing = registerConcept({
  class: ListingConcept,
  spec: listingSpec,
  refusals: {
    LISTING_NOT_FOUND: ListingNotFound,
    NOT_OWNER: ListingNotOwner,
    LISTING_INACTIVE: ListingInactive,
    ALREADY_INACTIVE: AlreadyInactive,
  },
});

const Pseudonym = registerConcept({
  class: PseudonymingConcept,
  spec: pseudonymingSpec,
  refusals: { NO_SUCH_PSEUDONYM: NoSuchPseudonym },
});

const Auction = registerConcept({
  class: AuctioningConcept,
  spec: auctioningSpec,
  refusals: {
    INVALID_PRICE: InvalidPrice,
    INVALID_BUYOUT: InvalidBuyout,
    AUCTION_NOT_FOUND: AuctionNotFound,
    AUCTION_INACTIVE: AuctionInactive,
    OWNER_CANNOT_BID: OwnerCannotBid,
    BID_TOO_LOW: BidTooLow,
    NOT_OWNER: AuctionNotOwner,
    ALREADY_CLOSED: AlreadyClosed,
    CANNOT_DELETE_ACTIVE_BIDS: CannotDeleteActiveBids,
  },
});

const Notify = registerConcept({
  class: NotifyingConcept,
  spec: notifyingSpec,
  refusals: { NO_SUCH_NOTIFICATION: NoSuchNotification },
});

const Settlement = registerConcept({
  class: SettlingConcept,
  spec: settlingSpec,
  refusals: {},
});

export function isBuyoutMet({
  amount,
  buyout,
}: {
  amount: number;
  buyout?: number;
}): { met: boolean } {
  return {
    met: typeof buyout === "number" && amount >= buyout,
  };
}

export function isBuyerPresent({
  highestBidder,
}: {
  highestBidder?: string;
}): { hasWinner: boolean } {
  return {
    hasWinner: typeof highestBidder === "string" && highestBidder.length > 0,
  };
}

export function isDifferentBidder({
  newBidder,
  outbid,
}: {
  newBidder: string;
  outbid?: string;
}): { different: boolean } {
  return {
    different: typeof outbid === "string" && outbid.length > 0 && outbid !== newBidder,
  };
}

export function formatOutbidNotification({
  title,
  amount,
  listing,
}: {
  title: string;
  amount: number;
  listing: string;
}): { message: string } {
  return {
    message: `You were outbid on "${title}"! Current high bid is $${amount}. (listing:${listing})`,
  };
}

export function formatBuyerNotification({
  title,
  price,
}: {
  title: string;
  price?: number;
}): { message: string } {
  const priceStr = typeof price === "number" ? ` for $${price}` : "";
  return {
    message: `You won the auction for "${title}"${priceStr}! Private contact details have been recorded in your Settlement Log.`,
  };
}

export function formatSellerNotification({
  title,
  price,
}: {
  title: string;
  price?: number;
}): { message: string } {
  const priceStr = typeof price === "number" ? ` at $${price}` : "";
  return {
    message: `Your auction for "${title}" has concluded${priceStr}! Private contact details have been recorded in your Settlement Log.`,
  };
}

export function isUserSeller({
  seller,
  viewer,
}: {
  seller: string;
  viewer?: string | null;
}): { isSeller: boolean } {
  return {
    isSeller: typeof viewer === "string" && viewer.length > 0 && seller === viewer,
  };
}

export function isUserHighestBidder({
  bidderUser,
  viewer,
}: {
  bidderUser?: string | null;
  viewer?: string | null;
}): { isHighestBidder: boolean } {
  return {
    isHighestBidder: typeof viewer === "string" && viewer.length > 0 && bidderUser === viewer,
  };
}

export const applicationConceptSet = conceptSet(
  {
    Session,
    Profile,
    Listing,
    Pseudonym,
    Auction,
    Notify,
    Settlement,
  },
  {
    isBuyoutMet,
    isBuyerPresent,
    isDifferentBidder,
    formatOutbidNotification,
    formatBuyerNotification,
    formatSellerNotification,
    isUserSeller,
    isUserHighestBidder,
  },
);

export const { concepts, computations } = applicationConceptSet;
