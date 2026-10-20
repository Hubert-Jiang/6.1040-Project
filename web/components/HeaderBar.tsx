import { defineComponent } from "vue";
import { store, type Page } from "../store.ts";
import { parseSettlementNotification } from "../api.ts";

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

    return () => (
      <header class="header-container">
        <div class="header-bar">
          <div class="header-brand" onClick={() => navTo("marketplace")} style={{ cursor: "pointer" }}>
            <h1>BeaverBazaar 🦫</h1>
            <p>MIT Dormspam Companion • Anonymous Peer Auctions</p>
          </div>

          <div class="header-right-actions">
            {/* Quick Account Pill */}
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

            {/* Top-Right Notifications Menu (Notifying concept) */}
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
                      <span>🔔 Settlement Inbox</span>
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
                      <button
                        type="button"
                        class="btn btn-xs"
                        title="Open Full Inbox Page"
                        onClick={goToInbox}
                      >
                        Full Page →
                      </button>
                    </div>
                  </div>

                  <div class="notifications-dropdown-body">
                    {!store.state.session ? (
                      <div class="empty-state" style={{ padding: "1.5rem 0.5rem" }}>
                        <p>Sign in to view your settlement notifications.</p>
                      </div>
                    ) : store.state.notifications.length === 0 ? (
                      <div class="empty-state" style={{ padding: "1.5rem 0.5rem" }}>
                        <p>No new notifications.</p>
                        <p class="form-help">
                          When an auction closes, private contact exchange details appear here.
                        </p>
                      </div>
                    ) : (
                      <div class="notification-list">
                        {store.state.notifications.map((n) => {
                          const parsed = parseSettlementNotification(n.message);
                          return (
                            <div key={n.notification} class="notif-dropdown-item">
                              <div class="notif-dropdown-header-row">
                                <span class={`notif-type-tag ${parsed.type === "won" ? "won" : "sold"}`}>
                                  {parsed.type === "won" ? "🏆 Won" : parsed.type === "sold" ? "🏁 Sold" : "🔔 Update"}
                                </span>
                                <strong class="notif-item-name">
                                  "{parsed.item}"
                                  {parsed.price !== null && ` ($${parsed.price})`}
                                </strong>
                              </div>
                              <div class="notif-dropdown-msg">
                                {parsed.alias ? (
                                  <>
                                    <span>Counterparty: </span>
                                    <strong class="pseudonym-tag">{parsed.alias}</strong>
                                    {parsed.identity && <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}> ({parsed.identity})</span>}
                                  </>
                                ) : (
                                  <span>{n.message}</span>
                                )}
                              </div>
                              <div class="notif-dropdown-footer">
                                <button
                                  type="button"
                                  class="btn-link-action"
                                  onClick={goToInbox}
                                >
                                  View Details →
                                </button>
                                <button
                                  type="button"
                                  class="btn btn-xs btn-dismiss"
                                  onClick={() => dismiss(n.notification)}
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
            {store.state.notifications.length > 0 && (
              <span class="nav-tab-badge">{store.state.notifications.length}</span>
            )}
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
