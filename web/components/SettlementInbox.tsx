import { defineComponent } from "vue";
import { store } from "../store.ts";

export const SettlementInbox = defineComponent({
  name: "SettlementInbox",
  setup() {
    function dismiss(notification: string) {
      store.dismissNotification(notification);
    }

    function onRefresh() {
      store.loadNotifications();
    }

    return () => (
      <section class="card">
        <div class="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span>📥 Private Settlement Inbox</span>
            {store.state.session && store.state.notifications.length > 0 && (
              <span class="notification-count" style={{ marginLeft: "0.5rem" }}>
                {store.state.notifications.length} Unread
              </span>
            )}
          </div>
          {store.state.session && (
            <button type="button" class="btn btn-sm" onClick={onRefresh}>
              ↻ Refresh Inbox
            </button>
          )}
        </div>
        <p class="card-subtitle">
          When an auction ends (via buyout, seller closure, or bidding expiration), BeaverBazaar resolves both parties' pseudonyms and privately exchanges contact information so you can coordinate physical pickup and payment.
        </p>

        {!store.state.session ? (
          <div class="empty-state">
            <p>Please sign in on the Account page to view your private settlement notifications.</p>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              style={{ marginTop: "0.75rem" }}
              onClick={() => store.setPage("account")}
            >
              Go to Account Sign In →
            </button>
          </div>
        ) : store.state.notifications.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">📫</div>
            <p>
              Your settlement inbox is empty.
            </p>
            <p class="form-help">
              When an auction you created closes with bids, or an auction you won concludes, private settlement details with your counterparty's contact information will be dispatched here.
            </p>
          </div>
        ) : (
          <div class="notification-list">
            {store.state.notifications.map((n) => (
              <div key={n.notification} class="notification-item">
                <div class="notification-message">🔔 {n.message}</div>
                <button
                  type="button"
                  class="btn btn-sm btn-dismiss"
                  onClick={() => dismiss(n.notification)}
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  },
});
