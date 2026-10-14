import { reactive } from "vue";
import { client, PRESETS, type ListingItem, type NotificationItem } from "./api.ts";

export interface AppState {
  user: string | null;
  session: string | null;
  name: string;
  contact: string;
  listings: ListingItem[];
  notifications: NotificationItem[];
  notificationsMenuOpen: boolean;
  statusMessage: string | null;
  statusType: "success" | "error" | "info";
  loading: boolean;
}

export const store = reactive<{
  state: AppState;
  setStatus(message: string | null, type?: "success" | "error" | "info"): void;
  login(username: string): Promise<void>;
  logout(): Promise<void>;
  loadProfile(): Promise<void>;
  updateProfile(name: string, contact: string): Promise<void>;
  loadFeed(silent?: boolean): Promise<void>;
  createListing(item: string, startPrice: number, increment: number, buyout: number | null): Promise<boolean>;
  submitBid(auction: string, item: string, amount: number): Promise<void>;
  closeAuction(auction: string, item: string): Promise<void>;
  cancelAuction(auction: string, item: string): Promise<void>;
  loadNotifications(silent?: boolean): Promise<void>;
  dismissNotification(notification: string): Promise<void>;
  toggleNotificationsMenu(): void;
  closeNotificationsMenu(): void;
  init(): Promise<void>;
}>({
  state: {
    user: null,
    session: null,
    name: "",
    contact: "",
    listings: [],
    notifications: [],
    notificationsMenuOpen: false,
    statusMessage: null,
    statusType: "info",
    loading: false,
  },

  setStatus(message: string | null, type = "info") {
    this.state.statusMessage = message;
    this.state.statusType = type;
  },

  toggleNotificationsMenu() {
    this.state.notificationsMenuOpen = !this.state.notificationsMenuOpen;
  },

  closeNotificationsMenu() {
    this.state.notificationsMenuOpen = false;
  },

  async loadProfile() {
    if (!this.state.session) {
      this.state.name = "";
      this.state.contact = "";
      return;
    }

    try {
      const res = await client["/profile/get"]({ session: this.state.session });
      if (!("error" in res) && res.profile) {
        this.state.name = res.profile.name;
        this.state.contact = res.profile.contact;
        return;
      }
    } catch (err) {
      console.warn("Could not query active profile:", err);
    }

    const preset = PRESETS.find((p) => p.username === this.state.user);
    if (preset) {
      this.state.name = preset.defaultName;
      this.state.contact = preset.defaultContact;
    } else {
      this.state.name = "";
      this.state.contact = "";
    }
  },

  async loadNotifications(silent = false) {
    if (!this.state.session) {
      this.state.notifications = [];
      return;
    }

    try {
      const res = await client["/notifications/list"]({ session: this.state.session });
      if (!("error" in res) && res.notifications) {
        this.state.notifications = res.notifications.notifications;
      }
    } catch (err) {
      if (!silent) console.warn("Could not query notifications:", err);
    }
  },

  async dismissNotification(notification: string) {
    if (!this.state.session) return;
    try {
      const res = await client["/notifications/dismiss"]({
        session: this.state.session,
        notification,
      });
      if ("error" in res) {
        this.setStatus(`Failed to dismiss notification: ${String(res.error)}`, "error");
        return;
      }
      this.setStatus("Notification dismissed.", "info");
      await this.loadNotifications();
    } catch (err) {
      this.setStatus(`Error dismissing notification: ${String(err)}`, "error");
    }
  },

  async login(username: string) {
    if (!username.trim()) return;
    this.state.loading = true;
    this.setStatus(`Signing in as ${username}...`, "info");

    try {
      const res = await client["/auth/login"]({ username: username.trim() });
      if ("error" in res) {
        this.setStatus(`Sign-in failed: ${String(res.error)}`, "error");
        return;
      }

      this.state.user = username.trim();
      this.state.session = res.session;

      await this.loadProfile();
      await this.loadNotifications();
      this.setStatus(`Signed in as ${this.state.user}`, "success");
      await this.loadFeed();
    } catch (err) {
      this.setStatus(`Network error signing in: ${String(err)}`, "error");
    } finally {
      this.state.loading = false;
    }
  },

  async logout() {
    if (this.state.session) {
      try {
        await client["/auth/logout"]({ session: this.state.session });
      } catch {
        // Ignore logout transport errors
      }
    }
    this.state.user = null;
    this.state.session = null;
    this.state.name = "";
    this.state.contact = "";
    this.state.notifications = [];
    this.state.notificationsMenuOpen = false;
    this.setStatus("Signed out successfully.", "info");
  },

  async updateProfile(name: string, contact: string) {
    if (!this.state.session) {
      this.setStatus("Please sign in first.", "error");
      return;
    }
    if (!name.trim() || !contact.trim()) {
      this.setStatus("Please provide both name and contact method.", "error");
      return;
    }

    this.state.loading = true;
    try {
      const res = await client["/profile/update"]({
        session: this.state.session,
        name: name.trim(),
        contact: contact.trim(),
      });

      if ("error" in res) {
        this.setStatus(`Failed to update profile: ${String(res.error)}`, "error");
        return;
      }

      this.state.name = name.trim();
      this.state.contact = contact.trim();
      this.setStatus("Contact profile updated successfully! Private settlement details saved.", "success");
    } catch (err) {
      this.setStatus(`Error updating profile: ${String(err)}`, "error");
    } finally {
      this.state.loading = false;
    }
  },

  async createListing(item: string, startPrice: number, increment: number, buyout: number | null): Promise<boolean> {
    if (!this.state.session) {
      this.setStatus("Please sign in to post a listing.", "error");
      return false;
    }
    if (!item.trim()) {
      this.setStatus("Please enter an item title / description.", "error");
      return false;
    }
    if (isNaN(startPrice) || startPrice < 0) {
      this.setStatus("Starting price must be a non-negative number ($0 or higher).", "error");
      return false;
    }
    if (isNaN(increment) || increment <= 0) {
      this.setStatus("Minimum increment must be greater than 0.", "error");
      return false;
    }
    if (buyout !== null && (buyout < 0 || buyout < startPrice)) {
      this.setStatus("Instant buyout price must be non-negative ($0 or higher) and at least the starting price.", "error");
      return false;
    }

    this.state.loading = true;
    try {
      const res = await client["/listings/create"]({
        session: this.state.session,
        item: item.trim(),
        startPrice,
        increment,
        buyout,
      });

      if ("error" in res) {
        this.setStatus(`Failed to post listing: ${String(res.error)}`, "error");
        return false;
      }

      this.setStatus(`Listing "${item.trim()}" posted successfully!`, "success");
      await this.loadFeed();
      return true;
    } catch (err) {
      this.setStatus(`Error posting listing: ${String(err)}`, "error");
      return false;
    } finally {
      this.state.loading = false;
    }
  },

  async submitBid(auction: string, item: string, amount: number) {
    if (!this.state.session) {
      this.setStatus("Please sign in to place a bid.", "error");
      return;
    }
    if (isNaN(amount) || amount < 0) {
      this.setStatus("Please enter a valid non-negative bid amount ($0 or higher).", "error");
      return;
    }

    this.state.loading = true;
    try {
      const res = await client["/auctions/bid"]({
        session: this.state.session,
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
          friendlyError = "Bid rejected: Bid must meet the starting price (for opening bid) or exceed current price by the minimum increment.";
        } else if (err.includes("AUCTION_INACTIVE") || err.includes("ALREADY_CLOSED")) {
          friendlyError = "Bid rejected: This auction has already closed.";
        } else if (err.includes("UNKNOWN_SESSION")) {
          friendlyError = "Session expired or invalid. Please switch/sign in again.";
        }
        this.setStatus(friendlyError, "error");
        return;
      }

      this.setStatus(`Successfully submitted bid of $${amount}!`, "success");
      await this.loadFeed();
      await this.loadNotifications();
    } catch (err) {
      this.setStatus(`Error placing bid: ${String(err)}`, "error");
    } finally {
      this.state.loading = false;
    }
  },

  async closeAuction(auction: string, item: string) {
    if (!this.state.session) {
      this.setStatus("Please sign in first.", "error");
      return;
    }

    this.state.loading = true;
    try {
      const res = await client["/auctions/close"]({
        session: this.state.session,
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
        this.setStatus(msg, "error");
        return;
      }

      this.setStatus(
        "Auction ended successfully! If winning bids were placed, settlement notifications have been dispatched.",
        "success",
      );
      await this.loadFeed();
      await this.loadNotifications();
    } catch (err) {
      this.setStatus(`Error closing auction: ${String(err)}`, "error");
    } finally {
      this.state.loading = false;
    }
  },

  async cancelAuction(auction: string, item: string) {
    if (!this.state.session) {
      this.setStatus("Please sign in first.", "error");
      return;
    }

    this.state.loading = true;
    try {
      const res = await client["/auctions/delete"]({
        session: this.state.session,
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
        this.setStatus(msg, "error");
        return;
      }

      this.setStatus("Auction cancelled and listing removed successfully.", "success");
      await this.loadFeed();
    } catch (err) {
      this.setStatus(`Error cancelling auction: ${String(err)}`, "error");
    } finally {
      this.state.loading = false;
    }
  },

  async loadFeed(silent = false) {
    try {
      const res = await client["/marketplace/feed"]({ session: this.state.session ?? undefined });
      if ("error" in res) {
        if (!silent) this.setStatus(`Failed to load feed: ${String(res.error)}`, "error");
        return;
      }
      this.state.listings = res.feed.listings;
    } catch (err) {
      if (!silent) this.setStatus(`Error loading feed: ${String(err)}`, "error");
    }
  },

  async init() {
    // Dismiss notification dropdown on click outside
    window.addEventListener("click", (e) => {
      if (this.state.notificationsMenuOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest(".notifications-menu-wrapper")) {
          this.closeNotificationsMenu();
        }
      }
    });

    // 3s background polling to keep feed and notifications fresh
    setInterval(() => {
      if (this.state.session && !this.state.loading) {
        this.loadNotifications(true);
        this.loadFeed(true);
      }
    }, 3000);

    // Initial sign in as Alice
    await this.login("alice@mit.edu");
  },
});
