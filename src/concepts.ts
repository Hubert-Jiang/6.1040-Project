import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";

import auctioningSpec from "@design/concepts/Auctioning.md" with { type: "text" };
import listingSpec from "@design/concepts/Listing.md" with { type: "text" };
import notifyingSpec from "@design/concepts/Notifying.md" with { type: "text" };
import profilingSpec from "@design/concepts/Profiling.md" with { type: "text" };
import pseudonymingSpec from "@design/concepts/Pseudonyming.md" with { type: "text" };
import sessioningSpec from "@design/concepts/Sessioning.md" with { type: "text" };

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

export function formatBuyerNotification({
  item,
  sellerAlias,
  sellerUser,
  sellerName,
  sellerContact,
}: {
  item: string;
  sellerAlias: string;
  sellerUser: string;
  sellerName?: string;
  sellerContact?: string;
}): { message: string } {
  const name = sellerName ? `${sellerName} (${sellerUser})` : sellerUser;
  const contact = sellerContact ? ` | Contact: ${sellerContact}` : "";
  return {
    message: `You won the auction for "${item}"! Counterparty: alias "${sellerAlias}", actual identity: ${name}${contact}. Reach out to arrange pickup and payment.`,
  };
}

export function formatSellerNotification({
  item,
  buyerAlias,
  buyerUser,
  buyerName,
  buyerContact,
}: {
  item: string;
  buyerAlias: string;
  buyerUser: string;
  buyerName?: string;
  buyerContact?: string;
}): { message: string } {
  const name = buyerName ? `${buyerName} (${buyerUser})` : buyerUser;
  const contact = buyerContact ? ` | Contact: ${buyerContact}` : "";
  return {
    message: `Your auction for "${item}" has ended! Counterparty: alias "${buyerAlias}", actual identity: ${name}${contact}. Reach out to arrange pickup and payment.`,
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
  },
  {
    isBuyoutMet,
    isBuyerPresent,
    formatBuyerNotification,
    formatSellerNotification,
    isUserSeller,
    isUserHighestBidder,
  },
);

export const { concepts, computations } = applicationConceptSet;

