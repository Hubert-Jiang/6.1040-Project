# BeaverBazaar 🦫

**BeaverBazaar** is an anonymous peer-to-peer auction marketplace tailored for the MIT community, replacing chaotic dormspam email threads and spreadsheets with fair incremental bidding, instant buyouts, and contextual pseudonymity.

---

## Project Materials & Links

- **Deployed Application**: [https://beaverbazaar.mit-sdg.dev](https://beaverbazaar.mit-sdg.dev)
- **Demo Videos**: [P3 Beta Demo](https://youtu.be/PPSDaQ8sFDY) & [P3 Code-Complete Demo](https://youtu.be/siV2iYF6g9s)
- **Design Document (P4)**: [DESIGN.md](DESIGN.md)
- **Visual Design Study**: [Slide Presentation](https://docs.google.com/presentation/d/1lUvhIHo5sWtdN6N_uokCQdJ0MAK1Sp8GE7qkBk96m_0/edit?usp=sharing)
- **Concept Specifications**:
  - [`Auctioning`](design/concepts/Auctioning.md) — Incremental bidding, buyout thresholds, and status progression.
  - [`Listing`](design/concepts/Listing.md) — Public item listings and seller lifecycle management.
  - [`Notifying`](design/concepts/Notifying.md) — Asynchronous delivery of private counterparty disclosures.
  - [`Profiling`](design/concepts/Profiling.md) — Out-of-band private contact information storage.
  - [`Pseudonyming`](design/concepts/Pseudonyming.md) — Bijective, contextual alias generation scoped per listing.
  - [`Sessioning`](design/concepts/Sessioning.md) — Opaque authenticated session tokens for Touchstone users.
  - [`Application Types`](design/types.md) — Concept type bindings and instance mappings.
  - [`Composition Specification`](design/compositions/BeaverBazaar.md) — Authoritative composition, reactions, endpoints, and formers.
  - [`Assembled Read-Back`](generated/beaverbazaar.md) — Sync-engine read-back manifest.

---

## Core Concepts & Architecture

BeaverBazaar is engineered using strict **Concept Design** principles via `@mit-sdg/sync-engine`. Concepts operate in complete isolation with zero cross-concept imports or shared state:

| Concept | Purpose | State Model |
| :--- | :--- | :--- |
| **`Sessioning`** | Manages authenticated sessions for verified MIT community members. | `Sessions(session, subject, expiresAt)` |
| **`Profiling`** | Stores private contact info out-of-band until an auction resolves. | `Profiles(user, name, contact)` |
| **`Listing`** | Tracks public item metadata and catalog availability. | `Listings(owner, item, active)` |
| **`Pseudonyming`** | Provides contextual, bijective pseudonym mappings per listing. | `Pseudonyms(context, user, alias)` |
| **`Auctioning`** | Governs competitive bidding, minimum increments, and buyouts under aliases. | `Auctions(owner, item, price, increment, active, buyout, highestBidder)` |
| **`Notifying`** | Maintains inbox message queues for asynchronous status events. | `Notifications(user, message)` |

### Synchronization Reactions
Cross-concept coordination is handled entirely through four non-invasive sync-engine reactions:
1. **`CloseOnBuyout`**: Automatically closes an auction when a submitted bid meets or exceeds the instant buyout price.
2. **`SyncAuctionListingStatus`**: Deactivates the public `Listing` as soon as its corresponding `Auction` closes, withdrawing it from the active feed.
3. **`NotifySellerOnClose`**: Resolves the winning buyer's alias back to their real student identity and dispatches a private settlement notification to the seller with contact details and final price.
4. **`NotifyBuyerOnClose`**: Resolves the seller's alias back to their real student identity and dispatches a private settlement notification to the buyer with contact details and final price.

### Access Control & Privacy Guarantees
* **Session Enforcement**: All private endpoints (`/profile/*`, `/listings/create`, `/auctions/*`, `/notifications/*`) require an active session token validated through `Sessioning.current({ session })`.
* **Zero Identity Leakage**: Bidders and sellers are masked behind unique pseudonyms scoped to each listing context. Public feeds (`/marketplace/feed` and `/listings/get`) never expose actual student identities (`User`), emails, or phone numbers.
* **Anti-Self-Bidding**: `Auctioning.bid` rejects bids where `auction.owner == bidder` with `OWNER_CANNOT_BID`. Because aliases are generated bijectively per listing, sellers cannot bid on their own items.
* **Ownership Verification**: Auctions can only be closed or deleted by their verified seller (`NOT_OWNER`). Deleting an unbid auction atomically cleans up its associated `Listing`.

---

## Local Setup & Quickstart

### Prerequisites
- [Bun](https://bun.sh) (v1.2+ or v1.4+)
- [Podman](https://podman.io) or [Docker](https://www.docker.com) (for local MongoDB)

### 1. Clone & Install Dependencies
```sh
git clone https://github.com/Hubert-Jiang/6.1040-Project.git
cd 6.1040-Project
bun install
```

### 2. Configure Environment
Copy the example environment configuration:
```sh
cp .env.example .env
```
*(The defaults are pre-configured for local development at `http://127.0.0.1:8080` with mock Touchstone test credentials.)*

### 3. Run Development Server
```sh
bun run dev
```
This command starts MongoDB in a container, boots the backend API at `http://127.0.0.1:3000`, and launches the frontend server at `http://127.0.0.1:8080` in live watch mode.

Visit **`http://127.0.0.1:8080`** in your browser.

### 4. Alternative: Full Containerized Stack
To build and spin up all three services (MongoDB, backend, and frontend) in production containers:
```sh
bun run up        # Builds and launches containers with automated health checks
bun run down      # Stops and tears down containers
bun run db:reset  # Clears local database volumes
```

---

## Authentication & Testing Accounts

BeaverBazaar integrates with **MIT Touchstone** via the Petrock OpenID Connect service (`petrock.mit.edu`). In local development and automated testing, the login landing page provides instant one-click testing profiles:
- **Alice (Seller)**: `alice@mit.edu` — Configured with display name `Alice Doe` and contact `617-555-0101`.
- **Bob (Buyer)**: `bob@mit.edu` — Configured with display name `Bob Smith` and contact `bob@mit.edu`.

---

## Testing & Verification

The project includes an automated test suite verifying concept principles, action partition domains, boundary failure conditions, composition reactions, and Touchstone OIDC authentication:

### Run Automated Tests
```sh
bun test
```
*Current test suite: **26 tests passing across 8 files** (`tests/concepts/*.test.ts`, `tests/compositions/BeaverBazaar.test.ts`, `tests/auth/PetrockOIDC.test.ts`). Execution results are logged in [tests/test-output.txt](tests/test-output.txt).*

### Verify Design Specifications
To verify that all concept Markdown files, types, and compositions strictly conform to sync-engine grammar and invariants:
```sh
bun run check:design
```

### Typecheck & Artifacts Verification
To regenerate sync-engine artifact pins and perform strict TypeScript compilation:
```sh
bun run generate
bun run check
```

---

## End-to-End User Scenario Walkthrough

1. **Seller Setup & Listing Creation**:
   Alice logs in as `alice@mit.edu` and configures her private contact details (`Alice Doe`, `617-555-0101`). She publishes a listing for a *"Vintage Fuji Bicycle"* with a starting price of **\$60**, a minimum bid increment of **\$5**, and an instant buyout price of **\$75**. The system registers her contextual pseudonym (e.g., `NimbleFox`) as the auction owner.
2. **Buyer Discovery & Incremental Bidding**:
   Bob logs in as `bob@mit.edu` and configures his private contact details (`Bob Smith`, `bob@mit.edu`). Bob discovers Alice's bicycle on the marketplace feed under seller `NimbleFox`. Bob places an opening bid of **\$60** under his own pseudonym (e.g., `CleverRobin`).
3. **Instant Buyout & Automated Closure**:
   Later, Bob decides to guarantee the item and places an instant buyout bid of **\$75**. Because the bid reaches the buyout threshold, the `CloseOnBuyout` reaction immediately triggers `Auction.close`. The `SyncAuctionListingStatus` reaction instantly deactivates the listing and removes it from the active feed.
4. **Private Bilateral Settlement**:
   Upon auction closure, `NotifySellerOnClose` and `NotifyBuyerOnClose` resolve the counterparties' aliases back to their real student identities and deliver private settlement notifications:
   - **Alice receives**: Notification that her bicycle sold for \$75 to Bob Smith (`bob@mit.edu`), along with Bob's contact details.
   - **Bob receives**: Notification that he won the bicycle for \$75 from Alice Doe (`alice@mit.edu`), along with Alice's contact details.
   - Alice and Bob contact each other directly to coordinate physical pickup at the Student Center and settle payment peer-to-peer.
