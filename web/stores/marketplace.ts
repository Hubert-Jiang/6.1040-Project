import { reactive } from "vue";
import { client, type ListingItem } from "../api.ts";
import { setStatus, setLoading, setPage } from "./ui.ts";

export interface MarketplaceState {
  listings: ListingItem[];
  selectedListing: ListingItem | null;
}

export const marketplaceState = reactive<MarketplaceState>({
  listings: [],
  selectedListing: null,
});

export function setSelectedListing(listing: ListingItem | null): void {
  marketplaceState.selectedListing = listing;
}

export async function loadFeed(session: string | null, silent = false): Promise<void> {
  try {
    const res = await client["/marketplace/feed"]({ session: session ?? undefined });
    if ("error" in res) {
      if (!silent) setStatus(`Failed to load feed: ${String(res.error)}`, "error");
      return;
    }
    marketplaceState.listings = res.feed.listings;
    if (marketplaceState.selectedListing) {
      const updated = res.feed.listings.find(
        (l) => l.listing === marketplaceState.selectedListing?.listing,
      );
      if (updated) {
        marketplaceState.selectedListing = updated;
      }
    }
  } catch (err) {
    if (!silent) setStatus(`Error loading feed: ${String(err)}`, "error");
  }
}

export async function createListing(
  session: string | null,
  title: string,
  description: string,
  images: string[],
  startPrice: number,
  increment: number,
  buyout: number | null,
): Promise<boolean> {
  if (!session) {
    setStatus("Please sign in to post a listing.", "error");
    return false;
  }
  if (!title.trim()) {
    setStatus("Please enter an item title.", "error");
    return false;
  }
  if (title.trim().length > 100) {
    setStatus("Title cannot exceed 100 characters.", "error");
    return false;
  }
  if (description.length > 1000) {
    setStatus("Description exceeds the 1,000 character maximum limit.", "error");
    return false;
  }
  if (description.split("\n").length > 12) {
    setStatus("Description cannot have more than 12 lines. Please consolidate paragraph breaks.", "error");
    return false;
  }
  if (images.length > 5) {
    setStatus("Maximum of 5 photos allowed per listing.", "error");
    return false;
  }
  if (isNaN(startPrice) || startPrice < 0 || startPrice > 1_000_000) {
    setStatus("Starting price must be a non-negative number between $0 and $1,000,000.", "error");
    return false;
  }
  if (isNaN(increment) || increment <= 0 || increment > 100_000) {
    setStatus("Minimum increment must be between $1 and $100,000.", "error");
    return false;
  }
  if (buyout !== null && (buyout < 0 || buyout < startPrice || buyout > 10_000_000)) {
    setStatus(
      "Instant buyout price must be at least the starting price and at most $10,000,000.",
      "error",
    );
    return false;
  }

  setLoading(true);
  try {
    const res = await client["/listings/create"]({
      session,
      title: title.trim(),
      description: description.trim(),
      images,
      startPrice,
      increment,
      buyout,
    });

    if ("error" in res) {
      setStatus(`Failed to post listing: ${String(res.error)}`, "error");
      return false;
    }

    setStatus(`Listing "${title.trim()}" posted successfully!`, "success");
    await loadFeed(session);
    setPage("marketplace");
    return true;
  } catch (err) {
    setStatus(`Error posting listing: ${String(err)}`, "error");
    return false;
  } finally {
    setLoading(false);
  }
}

export async function submitBid(
  session: string | null,
  auction: string,
  item: string,
  amount: number,
  onRefresh?: () => Promise<void>,
): Promise<void> {
  if (!session) {
    setStatus("Please sign in to place a bid.", "error");
    return;
  }
  if (isNaN(amount) || amount < 0 || amount > 10_000_000) {
    setStatus("Please enter a valid bid amount between $0 and $10,000,000.", "error");
    return;
  }

  const currentItem = marketplaceState.listings.find((l) => l.auction === auction);
  if (currentItem?.isHighestBidder) {
    if (currentItem.buyout === null || amount < currentItem.buyout) {
      setStatus(
        `You already hold the highest bid ($${currentItem.price})! You cannot outbid yourself.`,
        "info",
      );
      return;
    }
  }

  setLoading(true);
  try {
    const res = await client["/auctions/bid"]({
      session,
      auction,
      item,
      amount,
    });

    if ("error" in res) {
      const err = String(res.error);
      let friendlyError = `Bid rejected: ${err}`;
      if (err.includes("OWNER_CANNOT_BID")) {
        friendlyError = "Bid rejected: You are the seller of this listing and cannot bid on your own auction.";
      } else if (err.includes("BID_TOO_LOW")) {
        friendlyError =
          "Bid rejected: Bid must meet the starting price (for opening bid) or exceed current price by the minimum increment.";
      } else if (err.includes("AUCTION_INACTIVE") || err.includes("ALREADY_CLOSED")) {
        friendlyError = "Bid rejected: This auction has already closed.";
      } else if (err.includes("UNKNOWN_SESSION")) {
        friendlyError = "Session expired or invalid. Please switch/sign in again.";
      }
      setStatus(friendlyError, "error");
      return;
    }

    setStatus(`Successfully submitted bid of $${amount}!`, "success");
    await loadFeed(session);
    if (onRefresh) await onRefresh();
  } catch (err) {
    setStatus(`Error placing bid: ${String(err)}`, "error");
  } finally {
    setLoading(false);
  }
}

export async function closeAuction(
  session: string | null,
  auction: string,
  item: string,
  onRefresh?: () => Promise<void>,
): Promise<void> {
  if (!session) {
    setStatus("Please sign in first.", "error");
    return;
  }

  setLoading(true);
  try {
    const res = await client["/auctions/close"]({
      session,
      auction,
      item,
    });

    if ("error" in res) {
      const err = String(res.error);
      let msg = `Could not close auction: ${err}`;
      if (err.includes("NOT_OWNER")) {
        msg = "Only the listing seller can close this auction.";
      } else if (err.includes("ALREADY_CLOSED")) {
        msg = "This auction is already closed.";
      }
      setStatus(msg, "error");
      return;
    }

    setStatus(
      "Auction ended successfully! If winning bids were placed, settlement notifications have been dispatched.",
      "success",
    );
    setSelectedListing(null);
    await loadFeed(session);
    if (onRefresh) await onRefresh();
  } catch (err) {
    setStatus(`Error closing auction: ${String(err)}`, "error");
  } finally {
    setLoading(false);
  }
}

export async function cancelAuction(
  session: string | null,
  auction: string,
  item: string,
): Promise<void> {
  if (!session) {
    setStatus("Please sign in first.", "error");
    return;
  }

  setLoading(true);
  try {
    const res = await client["/auctions/delete"]({
      session,
      auction,
      item,
    });

    if ("error" in res) {
      const err = String(res.error);
      let msg = `Could not cancel auction: ${err}`;
      if (err.includes("CANNOT_DELETE_ACTIVE_BIDS")) {
        msg = "Cannot cancel an auction that already has bids placed.";
      } else if (err.includes("NOT_OWNER")) {
        msg = "Only the listing seller can cancel this auction.";
      }
      setStatus(msg, "error");
      return;
    }

    setStatus("Auction cancelled and listing removed successfully.", "success");
    setSelectedListing(null);
    await loadFeed(session);
  } catch (err) {
    setStatus(`Error cancelling auction: ${String(err)}`, "error");
  } finally {
    setLoading(false);
  }
}

export function clearMarketplace(): void {
  marketplaceState.listings = [];
  marketplaceState.selectedListing = null;
}

export function useMarketplaceStore() {
  return {
    state: marketplaceState,
    setSelectedListing,
    loadFeed,
    createListing,
    submitBid,
    closeAuction,
    cancelAuction,
    clearMarketplace,
  };
}
