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

interface AppState {
  user: string | null;
  session: string | null;
  name: string;
  contact: string;
  listings: ListingItem[];
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
  statusMessage: null,
  statusType: "info",
  loading: false,
};

// Preset users for quick switching
const PRESETS = [
  { label: "Alice", username: "alice@mit.edu", defaultName: "Alice Doe", defaultContact: "617-555-0101" },
  { label: "Bob", username: "bob@mit.edu", defaultName: "Bob Smith", defaultContact: "bob@mit.edu" },
];

function setStatus(message: string | null, type: "success" | "error" | "info" = "info") {
  state.statusMessage = message;
  state.statusType = type;
  render();
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

    // Autofill default profile fields if known preset
    const preset = PRESETS.find((p) => p.username === state.user);
    if (preset && !state.name) {
      state.name = preset.defaultName;
      state.contact = preset.defaultContact;
    }

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
    setStatus("Contact profile updated successfully! (Kept private until auction closes)", "success");
  } catch (err) {
    setStatus(`Error updating profile: ${String(err)}`, "error");
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
 * Pure DOM render function that paints UI components 1, 2, and 3
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
          ? `<div class="alert alert-${state.statusType}">${state.statusMessage}</div>`
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
              <span class="user-badge">${state.user ?? "Not Signed In"}</span>
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
                data-login-preset="${p.username}">
                ${p.label} (${p.username})
              </button>
            `,
            ).join("")}
          </div>

          <form id="custom-login-form" class="custom-login-form">
            <input
              type="text"
              id="custom-username"
              placeholder="Or enter custom Kerberos email (e.g. charlie@mit.edu)"
              value="${state.user ? "" : ""}" />
            <button type="submit" class="btn btn-primary btn-sm">Sign In</button>
          </form>
        </div>
      </section>

      <!-- Component 2: Profile Settings Card -->
      <section class="card">
        <div class="card-title">
          <span>2. My Contact Profile</span>
        </div>
        ${
          state.session
            ? `
          <form id="profile-form">
            <div class="input-group">
              <label class="input-label" for="profile-name">Display Name</label>
              <input
                type="text"
                id="profile-name"
                placeholder="e.g. Alice Doe"
                value="${state.name}"
                required />
            </div>
            <div class="input-group">
              <label class="input-label" for="profile-contact">Preferred Contact (Phone or Email)</label>
              <input
                type="text"
                id="profile-contact"
                placeholder="e.g. 617-555-0101 or alice@mit.edu"
                value="${state.contact}"
                required />
              <div class="form-help">
                🔒 Privacy Protected: Your contact info is strictly hidden while auctions are active, and only disclosed privately to the winning counterparty upon settlement.
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

      <!-- Component 3: Marketplace Feed -->
      <section class="card">
        <div class="feed-header">
          <div class="card-title" style="margin-bottom: 0;">
            <span>3. Active Marketplace Feed (${state.listings.length})</span>
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
                <div class="listing-title">${item.item}</div>

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
                    <span class="pseudonym-tag">${item.sellerAlias}</span>
                    <span class="session-badge">(Masked Alias)</span>
                  </div>
                  <div class="meta-pill">
                    <span>Highest Bidder:</span>
                    <span>${
                      item.highestBidder
                        ? `<strong class="pseudonym-tag">${item.highestBidder}</strong>`
                        : "<em>No bids placed yet</em>"
                    }</span>
                  </div>
                </div>
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

  document.getElementById("btn-refresh-feed")?.addEventListener("click", () => {
    loadFeed();
  });
}

// Initial bootstrap: auto-login as Alice to provide immediate friendly interactive view
async function init() {
  await login("alice@mit.edu");
}

init();
