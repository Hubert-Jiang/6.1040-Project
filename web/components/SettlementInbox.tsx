import { defineComponent } from "vue";
import { store } from "../store.ts";
import { parseSettlementNotification } from "../api.ts";

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📥 Private Settlement Inbox</span>
            {store.state.session && store.state.notifications.length > 0 && (
              <span class="notification-count">
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
            <p>Please sign in on the Profile & Account page to view your private settlement notifications.</p>
          </div>
        ) : store.state.notifications.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">📫</div>
            <p>Your settlement inbox is empty.</p>
            <p class="form-help">
              When an auction you created closes with bids, or an auction you won concludes, private settlement details with your counterparty's contact information will be dispatched here.
            </p>
          </div>
        ) : (
          <div class="settlement-list">
            {store.state.notifications.map((n) => {
              const parsed = parseSettlementNotification(n.message);
              return (
                <div key={n.notification} class="settlement-card">
                  <div class="settlement-header">
                    <div class="settlement-title-row">
                      <span class={parsed.type === "won" ? "settlement-badge-won" : "settlement-badge-sold"}>
                        {parsed.type === "won" ? "🏆 Auction Won" : parsed.type === "sold" ? "🏁 Auction Concluded" : "🔔 Notice"}
                      </span>
                      <h3 class="settlement-item-name">
                        "{parsed.item}"
                        {parsed.price !== null && <span class="settlement-price-tag"> (${parsed.price})</span>}
                      </h3>
                    </div>
                    <button
                      type="button"
                      class="btn btn-sm btn-dismiss"
                      onClick={() => dismiss(n.notification)}
                    >
                      Dismiss
                    </button>
                  </div>

                  <div class="settlement-details-grid">
                    {parsed.price !== null && (
                      <div class="settlement-field">
                        <span class="settlement-label">Concluded Price</span>
                        <strong class="settlement-value settlement-price-val">
                          ${parsed.price}
                        </strong>
                      </div>
                    )}

                    <div class="settlement-field">
                      <span class="settlement-label">Counterparty Alias</span>
                      <strong class="pseudonym-tag settlement-value">{parsed.alias || "Anonymous"}</strong>
                    </div>

                    <div class="settlement-field">
                      <span class="settlement-label">Verified MIT Identity</span>
                      <strong class="settlement-value">{parsed.identity || "Unknown"}</strong>
                    </div>

                    <div class="settlement-field">
                      <span class="settlement-label">Preferred Contact Method</span>
                      <strong class="settlement-value contact-highlight">
                        {parsed.contact || "Contact not specified"}
                      </strong>
                    </div>
                  </div>

                  <div class="settlement-instruction">
                    <span>💬 <strong>Next Steps:</strong> {parsed.instruction}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  },
});
