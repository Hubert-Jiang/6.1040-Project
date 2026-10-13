import { assemble } from "@mit-sdg/sync-engine/assembly";
import { composition } from "./compositions/BeaverBazaar.ts";
import { AuctioningConcept } from "./concepts/Auctioning.ts";
import { ListingConcept } from "./concepts/Listing.ts";
import { NotifyingConcept } from "./concepts/Notifying.ts";
import { ProfilingConcept } from "./concepts/Profiling.ts";
import { PseudonymingConcept } from "./concepts/Pseudonyming.ts";
import { SessioningConcept } from "./concepts/Sessioning.ts";
import { applicationConceptSet } from "./concepts.ts";
import { db } from "./db.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: {
      Session: new SessioningConcept(db),
      Profile: new ProfilingConcept(db),
      Listing: new ListingConcept(db),
      Pseudonym: new PseudonymingConcept(db),
      Auction: new AuctioningConcept(db),
      Notify: new NotifyingConcept(db),
    },
    composition: { BeaverBazaar: composition },
    // Print what went wrong. Otherwise a failure only shows up as INTERNAL_ERROR.
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
