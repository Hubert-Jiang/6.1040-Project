import { defineComponent } from "vue";
import { store } from "../store.ts";

export const SettlementInbox = defineComponent({
  name: "SettlementInbox",
  setup() {
    function dismiss(notification: string) {
      store.dismissNotification(notification);
    }

    return () => (
      <section class="card">
        <div class="card-title">
          <span>4. Private Settlement Inbox</span>
          {store.state.session && store.state.notifications.length > 0 && (
            <span class="notification-count">
              {store.state.notifications.length} New
            </span>
          )}
        </div>

        {!store.state.session ? (
          <div class="empty-state">
            <p>Please sign in above to view your settlement notifications.</p>
          </div>
        ) : store.state.notifications.length === 0 ? (
          <div class="empty-state">
            <p>
              No new notifications. If you win or close an auction,
              contact exchange details will appear here.
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
