import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { BeaverBazaarWireHttp } from "../generated/wire.ts";

// Initialize HTTP client pointing to backend /api
const client = createHttpClient<BeaverBazaarWireHttp>({ baseUrl: "/api" });

interface ListingItem {
  listing: string;
  auction: string;
  seller: string;
  sellerAlias: string;
  item: string;
  price: number;
  increment: number;
  buyout: number | null;
  highestBidder: string | null;
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
  notificationsMenuOpen: boolean;
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
  notificationsMenuOpen: false,
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

// Top-level cached DOM element references queried once at initialization
const elements = {
  // Notifications Menu
  btnNotifMenuToggle: document.querySelector<HTMLButtonElement>("#btn-notif-menu-toggle")!,
  notifMenuBadge: document.querySelector<HTMLSpanElement>("#notif-menu-badge")!,
  notificationsDropdown: document.querySelector<HTMLDivElement>("#notifications-dropdown")!,
  notifDropdownUserTitle: document.querySelector<HTMLSpanElement>("#notif-dropdown-user-title")!,
  notifDropdownUnreadCount: document.querySelector<HTMLSpanElement>("#notif-dropdown-unread-count")!,
  btnRefreshNotifications: document.querySelector<HTMLButtonElement>("#btn-refresh-notifications")!,
  notifDropdownEmpty: document.querySelector<HTMLDivElement>("#notif-dropdown-empty")!,
  notifDropdownList: document.querySelector<HTMLDivElement>("#notif-dropdown-list")!,

  // Status Banner
  statusBanner: document.querySelector<HTMLDivElement>("#status-banner")!,

  // Component 1: Auth & User Switcher
  sessionActiveBadge: document.querySelector<HTMLSpanElement>("#session-active-badge")!,
  currentUserBadge: document.querySelector<HTMLSpanElement>("#current-user-badge")!,
  btnLogout: document.querySelector<HTMLButtonElement>("#btn-logout")!,
  loginPresetButtons: document.querySelectorAll<HTMLButtonElement>("[data-login-preset]"),
  customLoginForm: document.querySelector<HTMLFormElement>("#custom-login-form")!,
  customUsernameInput: document.querySelector<HTMLInputElement>("#custom-username")!,

  // Component 2: Profile Settings
  profileActiveUserBadge: document.querySelector<HTMLSpanElement>("#profile-active-user-badge")!,
  profileEmptyState: document.querySelector<HTMLDivElement>("#profile-empty-state")!,
  profileForm: document.querySelector<HTMLFormElement>("#profile-form")!,
  profileEditingNotice: document.querySelector<HTMLDivElement>("#profile-editing-notice")!,
  profileNameInput: document.querySelector<HTMLInputElement>("#profile-name")!,
  profileContactInput: document.querySelector<HTMLInputElement>("#profile-contact")!,
  btnSaveProfile: document.querySelector<HTMLButtonElement>("#btn-save-profile")!,

  // Component 3: Post Listing Form
  listingEmptyState: document.querySelector<HTMLDivElement>("#listing-empty-state")!,
  createListingForm: document.querySelector<HTMLFormElement>("#create-listing-form")!,
  listingItemInput: document.querySelector<HTMLInputElement>("#listing-item")!,
  listingStartPriceInput: document.querySelector<HTMLInputElement>("#listing-start-price")!,
  listingIncrementInput: document.querySelector<HTMLInputElement>("#listing-increment")!,
  listingBuyoutInput: document.querySelector<HTMLInputElement>("#listing-buyout")!,
  btnPostListing: document.querySelector<HTMLButtonElement>("#btn-post-listing")!,

  // Component 4: Private Settlement Inbox
  inboxCountBadge: document.querySelector<HTMLSpanElement>("#inbox-count-badge")!,
  inboxSignedOutState: document.querySelector<HTMLDivElement>("#inbox-signed-out-state")!,
  inboxEmptyState: document.querySelector<HTMLDivElement>("#inbox-empty-state")!,
  inboxList: document.querySelector<HTMLDivElement>("#inbox-list")!,

  // Component 5: Marketplace Feed
  feedCount: document.querySelector<HTMLSpanElement>("#feed-count")!,
  btnRefreshFeed: document.querySelector<HTMLButtonElement>("#btn-refresh-feed")!,
  feedEmptyState: document.querySelector<HTMLDivElement>("#feed-empty-state")!,
  feedGrid: document.querySelector<HTMLDivElement>("#feed-grid")!,
};

/**
 * Display alert status message to user via safe textContent
 */
function setStatus(message: string | null, type: "success" | "error" | "info" = "info") {
  state.statusMessage = message;
  state.statusType = type;
  if (!message) {
    elements.statusBanner.hidden = true;
    elements.statusBanner.textContent = "";
    elements.statusBanner.className = "alert";
  } else {
    elements.statusBanner.hidden = false;
    elements.statusBanner.className = `alert alert-${type}`;
    elements.statusBanner.textContent = message;
  }
}

/**
 * Update Component 1 (Auth & User Switcher) and session-dependent visibility
 */
function updateAuthUI() {
  const isLoggedIn = !!state.session;
  elements.sessionActiveBadge.hidden = !isLoggedIn;
  elements.currentUserBadge.textContent = state.user ?? "Not Signed In";
  elements.btnLogout.hidden = !isLoggedIn;

  // Preset button active state
  elements.loginPresetButtons.forEach((btn) => {
    const preset = btn.getAttribute("data-login-preset");
    btn.classList.toggle("btn-active", state.user === preset);
  });

  // Profile section toggle
  elements.profileActiveUserBadge.hidden = !isLoggedIn;
  elements.profileActiveUserBadge.textContent = state.user ? `Active: ${state.user}` : "";
  elements.profileEmptyState.hidden = isLoggedIn;
  elements.profileForm.hidden = !isLoggedIn;
  if (state.user) {
    elements.profileEditingNotice.innerHTML = `Currently editing contact details for <strong>${escapeHtml(state.user)}</strong>.`;
  }

  // Listing creation section toggle
  elements.listingEmptyState.hidden = isLoggedIn;
  elements.createListingForm.hidden = !isLoggedIn;

  // Inbox section toggle
  elements.inboxSignedOutState.hidden = isLoggedIn;
}

/**
 * Update Component 2 (Profile Settings inputs) without overwriting active focus
 */
function updateProfileUI() {
  if (document.activeElement !== elements.profileNameInput) {
    elements.profileNameInput.value = state.name;
  }
  if (document.activeElement !== elements.profileContactInput) {
    elements.profileContactInput.value = state.contact;
  }
}

/**
 * Update Top-Right Notifications Menu and Component 4 Settlement Inbox
 */
function updateNotificationsUI() {
  const count = state.notifications.length;
  const hasNotifs = count > 0;
  const isLoggedIn = !!state.session;

  // Top header button & badge
  elements.notifMenuBadge.textContent = String(count);
  elements.notifMenuBadge.classList.toggle("notif-badge-active", hasNotifs);
  elements.btnNotifMenuToggle.classList.toggle("btn-active", state.notificationsMenuOpen);
  elements.notificationsDropdown.hidden = !state.notificationsMenuOpen;

  // Dropdown header
  elements.notifDropdownUserTitle.textContent = `🔔 Inbox (${state.user ?? "Not Signed In"})`;
  elements.notifDropdownUnreadCount.textContent = `${count} unread`;

  // Dropdown list
  if (!isLoggedIn) {
    elements.notifDropdownEmpty.hidden = false;
    elements.notifDropdownEmpty.innerHTML = `<p>Sign in to view your settlement notifications.</p>`;
    elements.notifDropdownList.replaceChildren();
  } else if (!hasNotifs) {
    elements.notifDropdownEmpty.hidden = false;
    elements.notifDropdownEmpty.innerHTML = `
      <p>No notifications.</p>
      <p class="form-help">When an auction closes, private contact exchange details appear here.</p>
    `;
    elements.notifDropdownList.replaceChildren();
  } else {
    elements.notifDropdownEmpty.hidden = true;
    const items = state.notifications.map((n) => {
      const itemEl = document.createElement("div");
      itemEl.className = "notif-dropdown-item";

      const msgEl = document.createElement("div");
      msgEl.className = "notif-dropdown-msg";
      msgEl.textContent = `🔔 ${n.message}`;

      const footerEl = document.createElement("div");
      footerEl.className = "notif-dropdown-footer";

      const dismissBtn = document.createElement("button");
      dismissBtn.type = "button";
      dismissBtn.className = "btn btn-xs btn-dismiss";
      dismissBtn.textContent = "Dismiss";
      dismissBtn.addEventListener("click", () => dismissNotification(n.notification));

      footerEl.appendChild(dismissBtn);
      itemEl.append(msgEl, footerEl);
      return itemEl;
    });
    elements.notifDropdownList.replaceChildren(...items);
  }

  // Component 4: Settlement Inbox Card
  if (!isLoggedIn) {
    elements.inboxCountBadge.hidden = true;
    elements.inboxSignedOutState.hidden = false;
    elements.inboxEmptyState.hidden = true;
    elements.inboxList.hidden = true;
    elements.inboxList.replaceChildren();
  } else {
    elements.inboxSignedOutState.hidden = true;
    elements.inboxCountBadge.hidden = !hasNotifs;
    elements.inboxCountBadge.textContent = `${count} New`;

    if (!hasNotifs) {
      elements.inboxEmptyState.hidden = false;
      elements.inboxList.hidden = true;
      elements.inboxList.replaceChildren();
    } else {
      elements.inboxEmptyState.hidden = true;
      elements.inboxList.hidden = false;

      const inboxCards = state.notifications.map((n) => {
        const card = document.createElement("div");
        card.className = "notification-item";

        const msg = document.createElement("div");
        msg.className = "notification-message";
        msg.textContent = `🔔 ${n.message}`;

        const dismissBtn = document.createElement("button");
        dismissBtn.type = "button";
        dismissBtn.className = "btn btn-sm btn-dismiss";
        dismissBtn.textContent = "Dismiss";
        dismissBtn.addEventListener("click", () => dismissNotification(n.notification));

        card.append(msg, dismissBtn);
        return card;
      });
      elements.inboxList.replaceChildren(...inboxCards);
    }
  }
}

/**
 * Update Component 5 (Marketplace Feed) using replaceChildren
 */
function updateFeedUI() {
  const count = state.listings.length;
  elements.feedCount.textContent = String(count);

  if (count === 0) {
    elements.feedEmptyState.hidden = false;
    elements.feedGrid.hidden = true;
    elements.feedGrid.replaceChildren();
    return;
  }

  elements.feedEmptyState.hidden = true;
  elements.feedGrid.hidden = false;

  const cards = state.listings.map((item) => {
    const card = document.createElement("div");
    card.className = "listing-card";

    // Title
    const title = document.createElement("div");
    title.className = "listing-title";
    title.textContent = item.item;

    // Price Row
    const priceRow = document.createElement("div");
    priceRow.className = "listing-price-row";

    const curPrice = document.createElement("span");
    curPrice.className = "listing-current-price";
    curPrice.textContent = `$${item.price}`;

    const inc = document.createElement("span");
    inc.className = "listing-increment";
    inc.textContent = `(+$${item.increment} min increment)`;

    priceRow.append(curPrice, inc);

    if (item.buyout !== null) {
      const buyoutSpan = document.createElement("span");
      buyoutSpan.className = "listing-buyout";
      buyoutSpan.textContent = `⚡ $${item.buyout} Instant Buyout`;
      priceRow.appendChild(buyoutSpan);
    } else {
      const noBuyoutSpan = document.createElement("span");
      noBuyoutSpan.className = "listing-increment";
      noBuyoutSpan.textContent = "No buyout set";
      priceRow.appendChild(noBuyoutSpan);
    }

    // Meta Row (Seller alias & Highest bidder)
    const metaRow = document.createElement("div");
    metaRow.className = "listing-meta";

    const sellerPill = document.createElement("div");
    sellerPill.className = "meta-pill";
    sellerPill.innerHTML = `<span>Seller:</span> <span class="pseudonym-tag">${escapeHtml(item.sellerAlias)}</span> <span class="session-badge">(Masked Alias)</span>`;

    const bidderPill = document.createElement("div");
    bidderPill.className = "meta-pill";
    if (item.highestBidder) {
      bidderPill.innerHTML = `<span>Highest Bidder:</span> <strong class="pseudonym-tag">${escapeHtml(item.highestBidder)}</strong>`;
    } else {
      bidderPill.innerHTML = `<span>Highest Bidder:</span> <em>No bids placed yet</em>`;
    }

    metaRow.append(sellerPill, bidderPill);
    card.append(title, priceRow, metaRow);

    // Bidding Actions
    if (!state.session) {
      const notice = document.createElement("div");
      notice.className = "form-help";
      notice.style.marginTop = "0.5rem";
      notice.textContent = "Sign in above to place bids or buy out this item.";
      card.appendChild(notice);
    } else {
      const isSeller = state.user !== null && state.user === item.seller;
      const minBid = item.highestBidder !== null ? item.price + item.increment : item.price;

      const actions = document.createElement("div");
      actions.className = "listing-actions";

      const controls = document.createElement("div");
      controls.className = "bid-controls";

      if (isSeller) {
        // Seller actions: Sellers manage their listing and can finalize when bids exist
        const sellerBadge = document.createElement("span");
        sellerBadge.className = "session-badge";
        sellerBadge.textContent = "Your Listing";
        controls.appendChild(sellerBadge);

        if (item.highestBidder !== null) {
          const closeBtn = document.createElement("button");
          closeBtn.type = "button";
          closeBtn.className = "btn btn-sm btn-close-auction";
          closeBtn.textContent = `🏁 Close & Finalize ($${item.price})`;
          closeBtn.title = "Finalize auction early with current highest bidder (Seller action)";
          closeBtn.addEventListener("click", () => closeAuction(item.auction, item.listing));
          controls.appendChild(closeBtn);
        } else {
          const waitingNotice = document.createElement("span");
          waitingNotice.className = "form-help";
          waitingNotice.style.marginLeft = "0.5rem";
          waitingNotice.textContent = "Waiting for bids";
          controls.appendChild(waitingNotice);
        }
      } else {
        // Buyer actions: Bid amount automatically defaults to minBid; min bid button removed
        const customForm = document.createElement("form");
        customForm.className = "custom-bid-form";
        customForm.style.display = "inline-flex";
        customForm.style.gap = "0.35rem";
        customForm.style.alignItems = "center";

        const numInput = document.createElement("input");
        numInput.type = "number";
        numInput.placeholder = "$";
        numInput.value = String(minBid);
        numInput.min = String(minBid);
        numInput.step = "1";
        numInput.required = true;

        const submitBidBtn = document.createElement("button");
        submitBidBtn.type = "submit";
        submitBidBtn.className = "btn btn-sm";
        submitBidBtn.textContent = "Bid";

        customForm.append(numInput, submitBidBtn);
        customForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const val = parseFloat(numInput.value);
          if (!isNaN(val) && val >= 0) {
            submitBid(item.auction, item.listing, val);
          }
        });
        controls.appendChild(customForm);

        // Instant Buyout Button
        if (item.buyout !== null) {
          const buyoutBtn = document.createElement("button");
          buyoutBtn.type = "button";
          buyoutBtn.className = "btn btn-sm btn-buyout";
          buyoutBtn.textContent = `⚡ Buyout $${item.buyout}`;
          buyoutBtn.addEventListener("click", () => submitBid(item.auction, item.listing, item.buyout!));
          controls.appendChild(buyoutBtn);
        }
      }

      actions.appendChild(controls);
      card.appendChild(actions);
    }

    return card;
  });

  elements.feedGrid.replaceChildren(...cards);
}

/**
 * Master UI paint function that coordinates granular updater calls
 */
function renderAll() {
  updateAuthUI();
  updateProfileUI();
  updateNotificationsUI();
  updateFeedUI();
}

// ==========================================
// API Actions
// ==========================================

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

  const preset = PRESETS.find((p) => p.username === state.user);
  if (preset) {
    state.name = preset.defaultName;
    state.contact = preset.defaultContact;
  } else {
    state.name = "";
    state.contact = "";
  }
}

async function loadNotifications(silent = false) {
  if (!state.session) {
    if (state.notifications.length > 0) {
      state.notifications = [];
      updateNotificationsUI();
    }
    return;
  }

  try {
    const res = await client["/notifications/list"]({ session: state.session });
    if (!("error" in res) && res.notifications) {
      const fresh = res.notifications.notifications;
      const changed =
        fresh.length !== state.notifications.length ||
        fresh.some((n, i) => n.notification !== state.notifications[i]?.notification);
      state.notifications = fresh;
      if (changed || !silent) {
        updateNotificationsUI();
      }
    }
  } catch (err) {
    if (!silent) console.warn("Could not query notifications:", err);
  }
}

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

    await loadProfile();
    await loadNotifications();
    setStatus(`Signed in as ${state.user}`, "success");
    await loadFeed();
  } catch (err) {
    setStatus(`Network error signing in: ${String(err)}`, "error");
  } finally {
    state.loading = false;
    renderAll();
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
  state.notificationsMenuOpen = false;
  setStatus("Signed out successfully.", "info");
  renderAll();
}

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
    setStatus("Contact profile updated successfully! Private settlement details saved.", "success");
  } catch (err) {
    setStatus(`Error updating profile: ${String(err)}`, "error");
  } finally {
    state.loading = false;
    updateProfileUI();
  }
}

async function createListing(item: string, startPrice: number, increment: number, buyout: number | null) {
  if (!state.session) {
    setStatus("Please sign in to post a listing.", "error");
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
    elements.createListingForm.reset();
    await loadFeed();
  } catch (err) {
    setStatus(`Error posting listing: ${String(err)}`, "error");
  } finally {
    state.loading = false;
  }
}

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
  }
}

async function closeAuction(auction: string, item: string) {
  if (!state.session) {
    setStatus("Please sign in first.", "error");
    return;
  }

  state.loading = true;
  try {
    const res = await client["/auctions/close"]({
      session: state.session,
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

    setStatus("Auction closed successfully! Settlement notifications dispatched to both seller and winning buyer.", "success");
    await loadFeed();
    await loadNotifications();
  } catch (err) {
    setStatus(`Error closing auction: ${String(err)}`, "error");
  } finally {
    state.loading = false;
  }
}

async function loadFeed(silent = false) {
  try {
    const res = await client["/marketplace/feed"]({});
    if ("error" in res) {
      if (!silent) setStatus(`Failed to load feed: ${String(res.error)}`, "error");
      return;
    }
    const fresh = res.feed.listings;
    const changed =
      fresh.length !== state.listings.length ||
      fresh.some(
        (l, i) =>
          l.auction !== state.listings[i]?.auction ||
          l.price !== state.listings[i]?.price ||
          l.highestBidder !== state.listings[i]?.highestBidder,
      );
    state.listings = fresh;
    if (changed || !silent) {
      updateFeedUI();
    }
  } catch (err) {
    if (!silent) setStatus(`Error loading feed: ${String(err)}`, "error");
  }
}

// ==========================================
// Permanent Event Listener Registration (Bound Once)
// ==========================================

// 1. User Switcher Presets
elements.loginPresetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const username = btn.getAttribute("data-login-preset");
    if (username) login(username);
  });
});

// 2. Custom Login Form
elements.customLoginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = elements.customUsernameInput.value.trim();
  if (username) {
    elements.customUsernameInput.value = "";
    login(username);
  }
});

// 3. Logout Button
elements.btnLogout.addEventListener("click", () => logout());

// 4. Profile Form
elements.profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = elements.profileNameInput.value.trim();
  const contact = elements.profileContactInput.value.trim();
  if (name && contact) {
    updateProfile(name, contact);
  }
});

// 5. Create Listing Form
elements.createListingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const item = elements.listingItemInput.value.trim();
  const startPrice = parseFloat(elements.listingStartPriceInput.value);
  const increment = parseFloat(elements.listingIncrementInput.value);
  const buyoutRaw = elements.listingBuyoutInput.value.trim();
  const buyout = buyoutRaw !== "" ? parseFloat(buyoutRaw) : null;
  createListing(item, startPrice, increment, buyout);
});

// 6. Notifications Toggle & Refresh
elements.btnNotifMenuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  state.notificationsMenuOpen = !state.notificationsMenuOpen;
  updateNotificationsUI();
});

elements.btnRefreshNotifications.addEventListener("click", (e) => {
  e.stopPropagation();
  loadNotifications();
});

// 7. Refresh Feed Button
elements.btnRefreshFeed.addEventListener("click", () => {
  loadFeed();
  loadNotifications();
});

// 8. Outside Click Listener for Notifications Dropdown
window.addEventListener("click", (e) => {
  if (state.notificationsMenuOpen) {
    const target = e.target as HTMLElement;
    if (!target.closest(".notifications-menu-wrapper")) {
      state.notificationsMenuOpen = false;
      updateNotificationsUI();
    }
  }
});

// 9. Periodic Background Polling (3s interval) to silently keep notifications and feed fresh
setInterval(() => {
  if (state.session && !state.loading) {
    loadNotifications(true);
    loadFeed(true);
  }
}, 3000);

// ==========================================
// Bootstrap
// ==========================================
async function init() {
  await login("alice@mit.edu");
}

init();
