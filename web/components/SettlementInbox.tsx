import { defineComponent } from "vue";
import { store } from "../store.ts";

export const SettlementInbox = defineComponent({
  name: "SettlementInbox",
  setup() {
    function onRefresh() {
      store.loadSettlements();
    }

    return () => (
      <section class="card">
        <div class="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📥 Private Settlement Log</span>
            {store.state.session && store.state.settlements.length > 0 && (
              <span class="notification-count">
                {store.state.settlements.length} Record{store.state.settlements.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {store.state.session && (
            <button type="button" class="btn btn-sm" onClick={onRefresh}>
              ↻ Refresh
            </button>
          )}
        </div>
        <p class="card-subtitle">
          Permanent readonly log of all your concluded auction transactions. When an auction ends, BeaverBazaar resolves both parties' pseudonyms and records private contact information here.
        </p>

        {!store.state.session ? (
          <div class="empty-state">
            <p>Please sign in on the Profile & Account page to view your settlement log.</p>
          </div>
        ) : store.state.settlements.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">📫</div>
            <p>Your settlement log is empty.</p>
            <p class="form-help">
              When an auction you created concludes with bids, or an auction you won ends, permanent settlement records with your counterparty's contact information will be logged here.
            </p>
          </div>
        ) : (
          <div class="settlement-list">
            {store.state.settlements.map((s) => {
              const isBuyer = s.buyer === store.state.user;
              const counterpartyAlias = isBuyer ? s.sellerAlias : s.buyerAlias;
              const counterpartyName = isBuyer
                ? (s.sellerName ? `${s.sellerName} (${s.seller})` : s.seller)
                : (s.buyerName ? `${s.buyerName} (${s.buyer})` : s.buyer);
              const counterpartyContact = isBuyer ? s.sellerContact : s.buyerContact;

              return (
                <div key={s.settlement} class="settlement-card">
                  <div class="settlement-header">
                    <div class="settlement-title-row">
                      <span class={isBuyer ? "settlement-badge-won" : "settlement-badge-sold"}>
                        {isBuyer ? "🏆 Auction Won" : "🏁 Auction Sold"}
                      </span>
                      <h3 class="settlement-item-name">
                        "{s.title}"
                      </h3>
                    </div>
                  </div>

                  <div class="settlement-details-grid">
                    <div class="settlement-field">
                      <span class="settlement-label">Concluded Price</span>
                      <strong class="settlement-value settlement-price-val">
                        ${s.price}
                      </strong>
                    </div>

                    <div class="settlement-field">
                      <span class="settlement-label">Counterparty Alias</span>
                      <strong class="pseudonym-tag settlement-value">{counterpartyAlias || "Anonymous"}</strong>
                    </div>

                    <div class="settlement-field">
                      <span class="settlement-label">Verified MIT Identity</span>
                      <strong class="settlement-value">{counterpartyName || "Unknown"}</strong>
                    </div>

                    <div class="settlement-field">
                      <span class="settlement-label">Preferred Contact Method</span>
                      <strong class="settlement-value contact-highlight">
                        {counterpartyContact || "Contact not specified"}
                      </strong>
                    </div>
                  </div>

                  <div class="settlement-instruction">
                    <span>💬 <strong>Next Steps:</strong> Reach out to coordinate physical pickup and payment.</span>
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
