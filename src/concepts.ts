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

export const applicationConceptSet = conceptSet({
  Session,
  Profile,
  Listing,
  Pseudonym,
  Auction,
  Notify,
});

export const { concepts } = applicationConceptSet;
