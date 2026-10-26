import { defineComponent, computed } from "vue";
import { store } from "../store.ts";
import { MarketplaceSearch } from "./MarketplaceSearch.tsx";
import { ListingCard } from "./ListingCard.tsx";
import { ListingDetailDrawer } from "./ListingDetailDrawer.tsx";

export const MarketplaceFeed = defineComponent({
  name: "MarketplaceFeed",
  setup() {
    function onRefresh() {
      store.loadFeed();
      store.loadNotifications();
    }

    const filteredListings = computed(() => store.getFilteredListings());
    const totalCount = computed(() => store.state.listings.length);
    const currentQuery = computed(() => store.state.searchQuery);

    return () => {
      const total = totalCount.value;
      const filtered = filteredListings.value;
      const query = currentQuery.value.trim();

      return (
        <section class="card">
          <div class="feed-header">
            <div>
              <div class="card-title" style={{ marginBottom: "0.25rem" }}>
                <span>🏷️ Active Marketplace ({total})</span>
              </div>
              <p class="card-subtitle" style={{ marginBottom: "0" }}>
                Live campus auctions. Bidding and selling are protected behind pseudonyms. Click to view photos, inspect details, and bid.
              </p>
            </div>
            <div class="feed-header-actions">
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

          {/* Dedicated Search & Filter Controls */}
          <MarketplaceSearch />

          {/* Listings Grid or Contextual Empty States */}
          {total === 0 ? (
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
          ) : filtered.length === 0 ? (
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3 style={{ color: "var(--text-main)", margin: "0.5rem 0 0.25rem" }}>
                No listings match your search
              </h3>
              <p style={{ color: "var(--text-muted)", margin: "0 0 1rem" }}>
                {query ? (
                  <span>
                    No items found for "<strong>{query}</strong>".
                  </span>
                ) : (
                  <span>No items found matching the selected filter.</span>
                )}
              </p>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                onClick={() => store.resetFilters()}
              >
                Clear Filters & Show All ({total})
              </button>
            </div>
          ) : (
            <div class="feed-grid">
              {filtered.map((item) => (
                <ListingCard key={item.auction} item={item} />
              ))}
            </div>
          )}

          <ListingDetailDrawer />
        </section>
      );
    };
  },
});
