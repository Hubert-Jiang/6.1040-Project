import { defineComponent } from "vue";
import { store } from "../store.ts";

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

    return () => (
      <header class="header-bar">
        <div class="header-brand">
          <h1>BeaverBazaar 🦫</h1>
          <p>MIT Dormspam Marketplace with Pseudonymous Bidding</p>
        </div>

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
            <span>Notifications</span>
            <span
              class={`notif-badge ${store.state.notifications.length > 0 ? "notif-badge-active" : ""}`}
            >
              {store.state.notifications.length}
            </span>
          </button>

          {store.state.notificationsMenuOpen && (
            <div id="notifications-dropdown" class="notifications-dropdown">
              <div class="notifications-dropdown-header">
                <div>
                  <span>🔔 Inbox ({store.state.user ?? "Not Signed In"})</span>
                  <span class="notification-count">
                    {store.state.notifications.length} unread
                  </span>
                </div>
                <button
                  type="button"
                  class="btn btn-xs"
                  title="Refresh Notifications"
                  onClick={refreshNotifs}
                >
                  ↻
                </button>
              </div>

              <div class="notifications-dropdown-body">
                {!store.state.session ? (
                  <div class="empty-state" style={{ padding: "1.5rem 0.5rem" }}>
                    <p>Sign in to view your settlement notifications.</p>
                  </div>
                ) : store.state.notifications.length === 0 ? (
                  <div class="empty-state" style={{ padding: "1.5rem 0.5rem" }}>
                    <p>No notifications.</p>
                    <p class="form-help">
                      When an auction closes, private contact exchange details appear here.
                    </p>
                  </div>
                ) : (
                  <div class="notification-list">
                    {store.state.notifications.map((n) => (
                      <div key={n.notification} class="notif-dropdown-item">
                        <div class="notif-dropdown-msg">🔔 {n.message}</div>
                        <div class="notif-dropdown-footer">
                          <button
                            type="button"
                            class="btn btn-xs btn-dismiss"
                            onClick={() => dismiss(n.notification)}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    );
  },
});
