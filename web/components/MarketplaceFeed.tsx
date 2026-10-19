import { defineComponent } from "vue";
import { store } from "../store.ts";
import { ListingCard } from "./ListingCard.tsx";

export const MarketplaceFeed = defineComponent({
  name: "MarketplaceFeed",
  setup() {
    function onRefresh() {
      store.loadFeed();
      store.loadNotifications();
    }

    return () => (
      <section class="card">
        <div class="feed-header">
          <div>
            <div class="card-title" style={{ marginBottom: "0.25rem" }}>
              <span>🏷️ Active Marketplace ({store.state.listings.length})</span>
            </div>
            <p class="card-subtitle" style={{ marginBottom: "0" }}>
              Live campus auctions. Bidding and selling are protected behind pseudonyms.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" class="btn btn-sm" onClick={onRefresh}>
              ↻ Refresh
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              onClick={() => store.setPage("create")}
            >
              + Sell Item
            </button>
          </div>
        </div>

        {store.state.listings.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <p>No active listings found in the marketplace feed.</p>
            <p class="form-help">Items will appear here once posted by sellers.</p>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              style={{ marginTop: "0.75rem" }}
              onClick={() => store.setPage("create")}
            >
              Post the First Listing →
            </button>
          </div>
        ) : (
          <div class="feed-grid">
            {store.state.listings.map((item) => (
              <ListingCard key={item.auction} item={item} />
            ))}
          </div>
        )}
      </section>
    );
  },
});
