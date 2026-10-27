import { defineComponent } from "vue";
import { store, type Page } from "../store.ts";
import { parseNotification } from "../api.ts";

export const HeaderBar = defineComponent({
  name: "HeaderBar",
  setup() {
    function toggleMenu(e: Event) {
      e.stopPropagation();
      store.toggleNotificationsMenu();
    }

    function refreshNotifs(e: Event) {
      e.stopPropagation();
      store.loadNotifications();
    }

    function dismiss(notification: string) {
      store.dismissNotification(notification);
    }

    function navTo(page: Page) {
      store.setPage(page);
    }

    function goToInbox() {
      store.closeNotificationsMenu();
      store.setPage("inbox");
    }

    async function onViewListing(listingId: string | null) {
      store.closeNotificationsMenu();
      store.setPage("marketplace");

      if (!listingId) {
        store.setStatus("Listing reference not specified.", "info");
        return;
      }

      // 1. Try finding in current marketplace feed
      let target = store.state.listings.find((l) => l.listing === listingId);

      // 2. If not found in memory, refresh feed to check if active
      if (!target) {
        await store.loadFeed(true);
        target = store.state.listings.find((l) => l.listing === listingId);
      }

      if (target) {
        store.setSelectedListing(target);
      } else {
        store.setStatus("This listing is no longer active or the auction has ended.", "info");
      }
    }

    return () => (
      <header class="header-container">
        <div class="header-bar">
          <div class="header-brand" onClick={() => navTo("marketplace")} style={{ cursor: "pointer" }}>
            <h1>BeaverBazaar 🦫</h1>
            <p>MIT Dormspam Companion • Anonymous Peer Auctions</p>
          </div>

          <div class="header-right-actions">
            {/* Notifications Menu (Notifying concept) */}
            <div class="notifications-menu-wrapper">
              <button
                type="button"
                id="btn-notif-menu-toggle"
                class={`btn-notif-menu ${store.state.notificationsMenuOpen ? "btn-active" : ""}`}
                aria-label="Toggle notifications menu"
                onClick={toggleMenu}
              >
                <span>🔔</span>
                <span class="notif-label">Inbox</span>
                <span
                  class={`notif-badge ${store.state.notifications.length > 0 ? "notif-badge-active" : ""}`}
                >
                  {store.state.notifications.length}
                </span>
              </button>

              {store.state.notificationsMenuOpen && (
                <div id="notifications-dropdown" class="notifications-dropdown">
                  <div class="notifications-dropdown-header">
                    <div class="notifications-dropdown-header-title">
                      <span>🔔 Notifications</span>
                      {store.state.notifications.length > 0 && (
                        <span class="notification-count">
                          {store.state.notifications.length} Unread
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      <button
                        type="button"
                        class="btn btn-xs"
                        title="Refresh Notifications"
                        onClick={refreshNotifs}
                      >
                        ↻
                      </button>
                    </div>
                  </div>

                  <div class="notifications-dropdown-body">
                    {!store.state.session ? (
                      <div class="empty-state" style={{ padding: "1.5rem 0.5rem" }}>
                        <p>Sign in to view your notifications.</p>
                      </div>
                    ) : store.state.notifications.length === 0 ? (
                      <div class="empty-state" style={{ padding: "1.5rem 0.5rem" }}>
                        <p>No new notifications.</p>
                        <p class="form-help">
                          When you are outbid or an auction closes, notifications appear here.
                        </p>
                      </div>
                    ) : (
                      <div class="notification-list">
                        {store.state.notifications.map((n) => {
                          const parsed = parseNotification(n.message);
                          const isOutbid = parsed.type === "outbid";
                          const isWon = parsed.type === "settlement_won";
                          const isSold = parsed.type === "settlement_sold";

                          return (
                            <div key={n.notification} class="notif-dropdown-item">
                              <div class="notif-dropdown-header-row">
                                <span class={`notif-type-tag ${isOutbid ? "outbid" : isWon ? "won" : isSold ? "sold" : "general"}`}>
                                  {isOutbid ? "⚠️ Outbid" : isWon ? "🏆 Won" : isSold ? "🏁 Sold" : "🔔 Notice"}
                                </span>
                                <strong class="notif-item-name">
                                  "{parsed.title}"
                                  {parsed.price !== null && ` ($${parsed.price})`}
                                </strong>
                              </div>
                              <div class="notif-dropdown-msg">
                                <span>{parsed.displayMessage}</span>
                              </div>
                              <div class="notif-dropdown-footer">
                                {isOutbid ? (
                                  <button
                                    type="button"
                                    class="btn-link-action"
                                    onClick={() => onViewListing(parsed.listingId)}
                                  >
                                    View Listing →
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    class="btn-link-action"
                                    onClick={goToInbox}
                                  >
                                    View Settlement Log →
                                  </button>
                                )}
                                <button
                                  type="button"
                                  class="btn btn-xs btn-dismiss"
                                  onClick={() => dismiss(n.notification)}
                                  title="Dismiss notification"
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User / Account Pill (Rightmost button) */}
            <button
              type="button"
              class={`btn-account-pill ${store.state.currentPage === "profile" || store.state.currentPage === "account" ? "btn-active" : ""}`}
              onClick={() => navTo("profile")}
              title="Touchstone Account & Profile"
            >
              <span class="account-icon">👤</span>
              <span class="account-label">
                {store.state.session ? store.state.user : "Sign In"}
              </span>
              {store.state.session && <span class="account-dot" aria-label="Active"></span>}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav class="nav-tabs" aria-label="Main Navigation">
          <button
            type="button"
            class={`nav-tab ${store.state.currentPage === "marketplace" ? "active" : ""}`}
            onClick={() => navTo("marketplace")}
          >
            <span class="nav-tab-icon">🏷️</span>
            <span>Marketplace</span>
            <span class="nav-tab-count">{store.state.listings.length}</span>
          </button>

          <button
            type="button"
            class={`nav-tab ${store.state.currentPage === "create" ? "active" : ""}`}
            onClick={() => navTo("create")}
          >
            <span class="nav-tab-icon">➕</span>
            <span>Post Listing</span>
          </button>

          <button
            type="button"
            class={`nav-tab ${store.state.currentPage === "inbox" ? "active" : ""}`}
            onClick={() => navTo("inbox")}
          >
            <span class="nav-tab-icon">📥</span>
            <span>Settlement Inbox</span>
          </button>

          <button
            type="button"
            class={`nav-tab ${store.state.currentPage === "profile" || store.state.currentPage === "account" ? "active" : ""}`}
            onClick={() => navTo("profile")}
          >
            <span class="nav-tab-icon">👤</span>
            <span>Profile & Account</span>
          </button>
        </nav>
      </header>
    );
  },
});
