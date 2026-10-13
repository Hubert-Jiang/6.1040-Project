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
          <div class="card-title" style={{ marginBottom: "0" }}>
            <span>5. Active Marketplace Feed ({store.state.listings.length})</span>
          </div>
          <button type="button" class="btn btn-sm" onClick={onRefresh}>
            ↻ Refresh Feed
          </button>
        </div>

        {store.state.listings.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <p>No active listings found in the marketplace feed.</p>
            <p class="form-help">Items will appear here once posted by sellers.</p>
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
