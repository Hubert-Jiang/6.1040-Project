import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { BeaverBazaarWireHttp } from "../generated/wire.ts";

// Initialize HTTP client pointing to backend /api
const client = createHttpClient<BeaverBazaarWireHttp>({ baseUrl: "/api" });

interface ListingItem {
  listing: string;
  auction: string;
  item: string;
  price: number;
  increment: number;
  buyout: number | null;
  highestBidder: string | null;
  sellerAlias: string;
}

interface NotificationItem {
  notification: string;
  message: string;
}

interface AppState {
  user: string | null;
  session: string | null;
  name: string;
  contact: string;
  listings: ListingItem[];
  notifications: NotificationItem[];
  statusMessage: string | null;
  statusType: "success" | "error" | "info";
  loading: boolean;
}

// In-memory application state
const state: AppState = {
  user: null,
  session: null,
  name: "",
  contact: "",
  listings: [],
  notifications: [],
  statusMessage: null,
  statusType: "info",
  loading: false,
};

// Preset users for quick switching
const PRESETS = [
  { label: "Alice", username: "alice@mit.edu", defaultName: "Alice Doe", defaultContact: "617-555-0101" },
  { label: "Bob", username: "bob@mit.edu", defaultName: "Bob Smith", defaultContact: "bob@mit.edu" },
];

function escapeHtml(str: string | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setStatus(message: string | null, type: "success" | "error" | "info" = "info") {
  state.statusMessage = message;
  state.statusType = type;
  render();
}

/**
 * Component 2: Profile Query & Synchronization Action
 * Fetches the registered contact profile for the currently active session.
 */
async function loadProfile() {
  if (!state.session) {
    state.name = "";
    state.contact = "";
    return;
  }

  try {
    const res = await client["/profile/get"]({ session: state.session });
    if (!("error" in res) && res.profile) {
      state.name = res.profile.name;
      state.contact = res.profile.contact;
      return;
    }
  } catch (err) {
    console.warn("Could not query active profile:", err);
  }

  // Fallback to preset defaults if profile has not been persisted on the server yet
  const preset = PRESETS.find((p) => p.username === state.user);
  if (preset) {
    state.name = preset.defaultName;
    state.contact = preset.defaultContact;
  } else {
    state.name = "";
    state.contact = "";
  }
}

/**
 * Component 6: Notification Retrieval Action
 * Queries incoming private settlement notifications for the active user.
 */
async function loadNotifications() {
  if (!state.session) {
    state.notifications = [];
    return;
  }

  try {
    const res = await client["/notifications/list"]({ session: state.session });
    if (!("error" in res) && res.notifications) {
      state.notifications = res.notifications.notifications;
    }
  } catch (err) {
    console.warn("Could not query notifications:", err);
  } finally {
    render();
  }
}

/**
 * Component 6: Notification Dismissal Action
 */
async function dismissNotification(notification: string) {
  if (!state.session) return;
  try {
    const res = await client["/notifications/dismiss"]({
      session: state.session,
      notification,
    });
    if ("error" in res) {
      setStatus(`Failed to dismiss notification: ${String(res.error)}`, "error");
      return;
    }
    setStatus("Notification dismissed.", "info");
    await loadNotifications();
  } catch (err) {
    setStatus(`Error dismissing notification: ${String(err)}`, "error");
  }
}

/**
 * Component 1: Authentication & User Switcher Actions
 */
async function login(username: string) {
  if (!username.trim()) return;
  state.loading = true;
  setStatus(`Signing in as ${username}...`, "info");

  try {
    const res = await client["/auth/login"]({ username: username.trim() });
    if ("error" in res) {
      setStatus(`Sign-in failed: ${String(res.error)}`, "error");
      return;
    }

    state.user = username.trim();
    state.session = res.session;

    // Dynamically update profile fields according to the active session
    await loadProfile();
    await loadNotifications();

    setStatus(`Signed in as ${state.user}`, "success");
    await loadFeed();
  } catch (err) {
    setStatus(`Network error signing in: ${String(err)}`, "error");
  } finally {
    state.loading = false;
    render();
  }
}

async function logout() {
  if (state.session) {
    try {
      await client["/auth/logout"]({ session: state.session });
    } catch {
      // Ignore logout transport errors
    }
  }
  state.user = null;
  state.session = null;
  state.name = "";
  state.contact = "";
  state.notifications = [];
  setStatus("Signed out successfully.", "info");
  render();
}

/**
 * Component 2: Profile Settings Action
 */
async function updateProfile(name: string, contact: string) {
  if (!state.session) {
    setStatus("Please sign in first.", "error");
    return;
  }
  if (!name.trim() || !contact.trim()) {
    setStatus("Please provide both name and contact method.", "error");
    return;
  }

  state.loading = true;
  try {
    const res = await client["/profile/update"]({
      session: state.session,
      name: name.trim(),
      contact: contact.trim(),
    });

    if ("error" in res) {
      setStatus(`Failed to update profile: ${String(res.error)}`, "error");
      return;
    }

    state.name = name.trim();
    state.contact = contact.trim();
    setStatus(`Contact profile updated for ${state.user}!`, "success");
  } catch (err) {
    setStatus(`Error updating profile: ${String(err)}`, "error");
  } finally {
    state.loading = false;
    render();
  }
}

/**
 * Component 4: Listing Creator Action
 */
async function createListing(item: string, startPrice: number, increment: number, buyout: number | null) {
  if (!state.session) {
    setStatus("Please sign in first.", "error");
    return;
  }
  if (!item.trim()) {
    setStatus("Please enter an item title / description.", "error");
    return;
  }
  if (isNaN(startPrice) || startPrice < 0) {
    setStatus("Starting price must be a non-negative number ($0 or higher).", "error");
    return;
  }
  if (isNaN(increment) || increment <= 0) {
    setStatus("Minimum increment must be greater than 0.", "error");
    return;
  }
  if (buyout !== null && (buyout < 0 || buyout < startPrice)) {
    setStatus("Instant buyout price must be non-negative ($0 or higher) and at least the starting price.", "error");
    return;
  }

  state.loading = true;
  try {
    const res = await client["/listings/create"]({
      session: state.session,
      item: item.trim(),
      startPrice,
      increment,
      buyout,
    });

    if ("error" in res) {
      setStatus(`Failed to post listing: ${String(res.error)}`, "error");
      return;
    }

    setStatus(`Listing "${item.trim()}" posted successfully!`, "success");
    await loadFeed();
  } catch (err) {
    setStatus(`Error posting listing: ${String(err)}`, "error");
  } finally {
    state.loading = false;
    render();
  }
}

/**
 * Component 5: Bidding & Buyout Action
 */
async function submitBid(auction: string, item: string, amount: number) {
  if (!state.session) {
    setStatus("Please sign in to place a bid.", "error");
    return;
  }
  if (isNaN(amount) || amount < 0) {
    setStatus("Please enter a valid non-negative bid amount ($0 or higher).", "error");
    return;
  }

  state.loading = true;
  try {
    const res = await client["/auctions/bid"]({
      session: state.session,
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
      setStatus(friendlyError, "error");
      return;
    }

    setStatus(`Successfully submitted bid of $${amount}!`, "success");
    await loadFeed();
    await loadNotifications();
  } catch (err) {
    setStatus(`Error placing bid: ${String(err)}`, "error");
  } finally {
    state.loading = false;
    render();
  }
}

/**
 * Component 3: Marketplace Feed Action
 */
async function loadFeed() {
  try {
    const res = await client["/marketplace/feed"]({});
    if ("error" in res) {
      setStatus(`Failed to load feed: ${String(res.error)}`, "error");
      return;
    }
    state.listings = res.feed.listings;
  } catch (err) {
    setStatus(`Error loading feed: ${String(err)}`, "error");
  } finally {
    render();
  }
}

/**
 * Pure DOM render function that paints UI components 1 through 6
 */
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="container">
      <!-- App Header -->
      <header class="header">
        <h1>BeaverBazaar 🦫</h1>
        <p>MIT Dormspam Marketplace with Pseudonymous Bidding</p>
      </header>

      <!-- Status Alert Banner -->
      ${
        state.statusMessage
          ? `<div class="alert alert-${state.statusType}">${escapeHtml(state.statusMessage)}</div>`
          : ""
      }

      <!-- Component 1: User Switcher & Auth Bar -->
      <section class="card">
        <div class="card-title">
          <span>1. Touchstone User Switcher</span>
          ${state.session ? `<span class="session-badge">Session Active</span>` : ""}
        </div>
        <div class="auth-bar">
          <div class="auth-status">
            <div>
              <span>Current User: </span>
              <span class="user-badge">${escapeHtml(state.user ?? "Not Signed In")}</span>
            </div>
            ${
              state.session
                ? `<button id="btn-logout" class="btn btn-sm">Sign Out</button>`
                : ""
            }
          </div>

          <div class="user-switcher-actions">
            <span>Quick Switch:</span>
            ${PRESETS.map(
              (p) => `
              <button
                class="btn btn-sm ${state.user === p.username ? "btn-active" : ""}"
                data-login-preset="${escapeHtml(p.username)}">
                ${escapeHtml(p.label)} (${escapeHtml(p.username)})
              </button>
            `,
            ).join("")}
          </div>

          <form id="custom-login-form" class="custom-login-form">
            <input
              type="text"
              id="custom-username"
              placeholder="Or enter custom Kerberos email (e.g. charlie@mit.edu)"
              value="${escapeHtml(state.user ? "" : "")}" />
            <button type="submit" class="btn btn-primary btn-sm">Sign In</button>
          </form>
        </div>
      </section>

      <!-- Component 2: Profile Settings Card -->
      <section class="card">
        <div class="card-title">
          <span>2. My Contact Profile</span>
          ${state.user ? `<span class="session-badge">Active: ${escapeHtml(state.user)}</span>` : ""}
        </div>
        ${
          state.session
            ? `
          <form id="profile-form">
            <div class="form-help" style="margin-bottom: 0.75rem;">
              Currently editing contact details for <strong>${escapeHtml(state.user)}</strong>.
            </div>
            <div class="input-group">
              <label class="input-label" for="profile-name">Display Name</label>
              <input
                type="text"
                id="profile-name"
                placeholder="e.g. Alice Doe"
                value="${escapeHtml(state.name)}"
                required />
            </div>
            <div class="input-group">
              <label class="input-label" for="profile-contact">Preferred Contact (Phone or Email)</label>
              <input
                type="text"
                id="profile-contact"
                placeholder="e.g. 617-555-0101 or alice@mit.edu"
                value="${escapeHtml(state.contact)}"
                required />
              <div class="form-help">
                🔒 Your contact info is strictly hidden while auctions are active, and only disclosed privately to the winning counterparty.
              </div>
            </div>
            <button type="submit" class="btn btn-primary" ${state.loading ? "disabled" : ""}>
              Save Contact Profile
            </button>
          </form>
        `
            : `
          <div class="empty-state">
            <p>Please sign in above to view and manage your contact profile.</p>
          </div>
        `
        }
      </section>

      <!-- Component 4: Listing Creator Form -->
      <section class="card">
        <div class="card-title">
          <span>3. Post a New Auction Listing</span>
        </div>
        ${
          state.session
            ? `
          <form id="create-listing-form">
            <div class="input-group">
              <label class="input-label" for="listing-item">Item Title / Description</label>
              <input
                type="text"
                id="listing-item"
                placeholder="e.g. Vintage Road Bike (Great Condition)"
                required />
            </div>

            <div class="form-row">
              <div class="input-group">
                <label class="input-label" for="listing-start-price">Starting Price ($)</label>
                <input
                  type="number"
                  id="listing-start-price"
                  placeholder="60"
                  min="0"
                  step="1"
                  required />
              </div>
              <div class="input-group">
                <label class="input-label" for="listing-increment">Min Increment ($)</label>
                <input
                  type="number"
                  id="listing-increment"
                  placeholder="5"
                  min="1"
                  step="1"
                  required />
              </div>
              <div class="input-group">
                <label class="input-label" for="listing-buyout">Buyout Price ($ optional, 0 for giveaway)</label>
                <input
                  type="number"
                  id="listing-buyout"
                  placeholder="75 (or 0)"
                  min="0"
                  step="1" />
              </div>
            </div>

            <div class="form-help" style="margin-bottom: 0.75rem;">
              🎭 Anonymity Notice: Your listing is posted under a unique contextual pseudonym to shield your identity from public campus dormspam feeds.
            </div>

            <button type="submit" class="btn btn-primary" ${state.loading ? "disabled" : ""}>
              Post Auction Listing
            </button>
          </form>
        `
            : `
          <div class="empty-state">
            <p>Please sign in above to post an auction listing.</p>
          </div>
        `
        }
      </section>

      <!-- Component 6: Notifications & Settlement Inbox -->
      <section class="card">
        <div class="card-title">
          <span>4. Private Settlement Inbox</span>
          ${
            state.session && state.notifications.length > 0
              ? `<span class="notification-count">${state.notifications.length} New</span>`
              : ""
          }
        </div>
        ${
          state.session
            ? state.notifications.length === 0
              ? `
              <div class="empty-state">
                <p>No new notifications. When an auction closes or you win an item, private contact exchange details appear here.</p>
              </div>
            `
              : `
              <div class="notification-list">
                ${state.notifications
                  .map(
                    (n) => `
                  <div class="notification-item">
                    <div class="notification-message">
                      🔔 ${escapeHtml(n.message)}
                    </div>
                    <button
                      class="btn btn-sm btn-dismiss"
                      data-dismiss-id="${escapeHtml(n.notification)}">
                      Dismiss
                    </button>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            `
            : `
          <div class="empty-state">
            <p>Please sign in above to view your settlement notifications.</p>
          </div>
        `
        }
      </section>

      <!-- Component 3 & 5: Active Marketplace Feed & Bidding / Buyout Action -->
      <section class="card">
        <div class="feed-header">
          <div class="card-title" style="margin-bottom: 0;">
            <span>5. Active Marketplace Feed (${state.listings.length})</span>
          </div>
          <button id="btn-refresh-feed" class="btn btn-sm">↻ Refresh Feed</button>
        </div>

        ${
          state.listings.length === 0
            ? `
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <p>No active listings found in the marketplace feed.</p>
            <p class="form-help">Items will appear here once posted by sellers.</p>
          </div>
        `
            : `
          <div class="feed-grid">
            ${state.listings
              .map(
                (item) => `
              <div class="listing-card">
                <div class="listing-title">${escapeHtml(item.item)}</div>

                <div class="listing-price-row">
                  <span class="listing-current-price">$${item.price}</span>
                  <span class="listing-increment">(+$${item.increment} min increment)</span>
                  ${
                    item.buyout !== null
                      ? `<span class="listing-buyout">⚡ $${item.buyout} Instant Buyout</span>`
                      : `<span class="listing-increment">No buyout set</span>`
                  }
                </div>

                <div class="listing-meta">
                  <div class="meta-pill">
                    <span>Seller:</span>
                    <span class="pseudonym-tag">${escapeHtml(item.sellerAlias)}</span>
                    <span class="session-badge">(Masked Alias)</span>
                  </div>
                  <div class="meta-pill">
                    <span>Highest Bidder:</span>
                    <span>${
                      item.highestBidder
                        ? `<strong class="pseudonym-tag">${escapeHtml(item.highestBidder)}</strong>`
                        : "<em>No bids placed yet</em>"
                    }</span>
                  </div>
                </div>

                <!-- Component 5: Bidding & Buyout Action -->
                ${
                  state.session
                    ? (() => {
                        const minBid = item.highestBidder !== null ? item.price + item.increment : item.price;
                        const bidLabel = item.highestBidder !== null ? `Bid $${minBid}` : `Opening Bid $${minBid}`;
                        return `
                  <div class="listing-actions">
                    <div class="bid-controls">
                      <button
                        type="button"
                        class="btn btn-sm btn-quick-bid"
                        data-quick-bid
                        data-auction-id="${escapeHtml(item.auction)}"
                        data-listing-id="${escapeHtml(item.listing)}"
                        data-bid-amount="${minBid}">
                        ${bidLabel}
                      </button>

                      <form
                        class="custom-bid-form"
                        data-auction-id="${escapeHtml(item.auction)}"
                        data-listing-id="${escapeHtml(item.listing)}"
                        style="display: inline-flex; gap: 0.35rem; align-items: center;">
                        <input
                          type="number"
                          placeholder="$"
                          value="${minBid}"
                          min="${minBid}"
                          step="1"
                          required />
                        <button type="submit" class="btn btn-sm">Bid</button>
                      </form>

                      ${
                        item.buyout !== null
                          ? `
                        <button
                          type="button"
                          class="btn btn-sm btn-buyout"
                          data-buyout
                          data-auction-id="${escapeHtml(item.auction)}"
                          data-listing-id="${escapeHtml(item.listing)}"
                          data-buyout-amount="${item.buyout}">
                          ⚡ Buyout $${item.buyout}
                        </button>
                      `
                          : ""
                      }
                    </div>
                  </div>
                `;
                      })()
                    : `
                  <div class="form-help" style="margin-top: 0.5rem;">
                    Sign in above to place bids or buy out this item.
                  </div>
                `
                }
              </div>
            `,
              )
              .join("")}
          </div>
        `
        }
      </section>
    </div>
  `;

  // Attach event listeners
  document.getElementById("btn-logout")?.addEventListener("click", () => logout());

  document.querySelectorAll("[data-login-preset]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const username = target.getAttribute("data-login-preset");
      if (username) login(username);
    });
  });

  document.getElementById("custom-login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("custom-username") as HTMLInputElement;
    if (input && input.value) login(input.value);
  });

  document.getElementById("profile-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("profile-name") as HTMLInputElement;
    const contactInput = document.getElementById("profile-contact") as HTMLInputElement;
    if (nameInput && contactInput) {
      updateProfile(nameInput.value, contactInput.value);
    }
  });

  document.getElementById("create-listing-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const itemInput = document.getElementById("listing-item") as HTMLInputElement;
    const priceInput = document.getElementById("listing-start-price") as HTMLInputElement;
    const incInput = document.getElementById("listing-increment") as HTMLInputElement;
    const buyoutInput = document.getElementById("listing-buyout") as HTMLInputElement;

    if (itemInput && priceInput && incInput) {
      const item = itemInput.value;
      const startPrice = parseFloat(priceInput.value);
      const increment = parseFloat(incInput.value);
      const buyout = buyoutInput && buyoutInput.value.trim() !== "" ? parseFloat(buyoutInput.value) : null;
      createListing(item, startPrice, increment, buyout);
    }
  });

  document.querySelectorAll(".btn-quick-bid, [data-quick-bid]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const auction = target.getAttribute("data-auction-id");
      const item = target.getAttribute("data-listing-id");
      const rawAmount = target.getAttribute("data-bid-amount");
      if (rawAmount !== null && rawAmount !== undefined) {
        const amount = parseFloat(rawAmount);
        if (auction && item && !isNaN(amount) && amount >= 0) {
          submitBid(auction, item, amount);
        }
      }
    });
  });

  document.querySelectorAll(".custom-bid-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLFormElement;
      const auction = target.getAttribute("data-auction-id");
      const item = target.getAttribute("data-listing-id");
      const input = target.querySelector("input[type='number']") as HTMLInputElement;
      if (auction && item && input && input.value !== "") {
        const amount = parseFloat(input.value);
        if (!isNaN(amount) && amount >= 0) submitBid(auction, item, amount);
      }
    });
  });

  document.querySelectorAll(".btn-buyout, [data-buyout-amount]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const auction = target.getAttribute("data-auction-id");
      const item = target.getAttribute("data-listing-id");
      const rawBuyout = target.getAttribute("data-buyout-amount");
      if (rawBuyout !== null && rawBuyout !== undefined) {
        const buyout = parseFloat(rawBuyout);
        if (auction && item && !isNaN(buyout) && buyout >= 0) {
          submitBid(auction, item, buyout);
        }
      }
    });
  });

  document.querySelectorAll("[data-dismiss-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const notificationId = target.getAttribute("data-dismiss-id");
      if (notificationId) {
        dismissNotification(notificationId);
      }
    });
  });

  document.getElementById("btn-refresh-feed")?.addEventListener("click", () => {
    loadFeed();
    loadNotifications();
  });
}

// Initial bootstrap: auto-login as Alice to provide immediate friendly interactive view
async function init() {
  await login("alice@mit.edu");
}

init();
