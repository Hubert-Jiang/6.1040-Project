import { defineComponent, computed } from "vue";
import { store, type SearchScope, type RoleFilter } from "../store.ts";
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

    const counts = computed(() => {
      const all = store.state.listings;
      return {
        all: all.length,
        mine: all.filter((l) => l.isSeller).length,
        winning: all.filter((l) => l.isHighestBidder).length,
        hasBids: all.filter((l) => l.highestBidder !== null).length,
        unbid: all.filter((l) => l.highestBidder === null).length,
        buyout: all.filter((l) => l.buyout !== null).length,
      };
    });

    const hasActiveFilters = computed(() => {
      return (
        store.state.searchQuery.trim().length > 0 ||
        store.state.searchScope !== "both" ||
        store.state.roleFilter !== "all"
      );
    });

    const scopeLabel = computed(() => {
      switch (store.state.searchScope) {
        case "title":
          return "Title only";
        case "desc":
          return "Description only";
        default:
          return "Title & Description";
      }
    });

    return () => {
      const totalCount = store.state.listings.length;
      const filtered = filteredListings.value;
      const c = counts.value;
      const currentQuery = store.state.searchQuery;
      const currentScope = store.state.searchScope;
      const currentRole = store.state.roleFilter;

      return (
        <section class="card">
          <div class="feed-header">
            <div>
              <div class="card-title" style={{ marginBottom: "0.25rem" }}>
                <span>🏷️ Active Marketplace ({totalCount})</span>
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

          {/* Search Bar & Filter Controls */}
          {totalCount > 0 && (
            <div class="marketplace-search-box">
              {/* Row 1: Search Keyword Input & Scope Selector */}
              <div class="search-input-row">
                <div class="search-input-wrapper">
                  <span class="search-icon" aria-hidden="true">
                    🔍
                  </span>
                  <input
                    id="marketplace-search-input"
                    type="text"
                    class="search-input-field"
                    placeholder="Search listings by title or description..."
                    value={currentQuery}
                    onInput={(e: Event) => {
                      store.setSearchQuery((e.target as HTMLInputElement).value);
                    }}
                    aria-label="Search listings"
                  />
                  {currentQuery.length > 0 && (
                    <button
                      type="button"
                      class="btn-clear-search"
                      onClick={() => store.setSearchQuery("")}
                      title="Clear search text"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div class="search-scope-wrapper">
                  <label class="scope-dropdown-label" for="search-scope-select">
                    In:
                  </label>
                  <select
                    id="search-scope-select"
                    class="scope-select-dropdown"
                    value={currentScope}
                    onChange={(e: Event) => {
                      store.setSearchScope((e.target as HTMLSelectElement).value as SearchScope);
                    }}
                    aria-label="Select search scope"
                  >
                    <option value="both">Title & Description</option>
                    <option value="title">Title only</option>
                    <option value="desc">Description only</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Status & Role Filter Pills */}
              <div
                class="filter-pills-container"
                role="tablist"
                aria-label="Filter listings by role or status"
              >
                <button
                  type="button"
                  class={`filter-pill ${currentRole === "all" ? "filter-pill-active" : ""}`}
                  onClick={() => store.setRoleFilter("all")}
                >
                  All Items <span class="pill-count">{c.all}</span>
                </button>
                <button
                  type="button"
                  class={`filter-pill ${currentRole === "mine" ? "filter-pill-active" : ""}`}
                  onClick={() => store.setRoleFilter("mine")}
                >
                  🏷️ My Listings <span class="pill-count">{c.mine}</span>
                </button>
                <button
                  type="button"
                  class={`filter-pill ${currentRole === "winning" ? "filter-pill-active" : ""}`}
                  onClick={() => store.setRoleFilter("winning")}
                >
                  🏆 Leading Bidder <span class="pill-count">{c.winning}</span>
                </button>
                <button
                  type="button"
                  class={`filter-pill ${currentRole === "has_bids" ? "filter-pill-active" : ""}`}
                  onClick={() => store.setRoleFilter("has_bids")}
                >
                  🔥 Has Bids <span class="pill-count">{c.hasBids}</span>
                </button>
                <button
                  type="button"
                  class={`filter-pill ${currentRole === "unbid" ? "filter-pill-active" : ""}`}
                  onClick={() => store.setRoleFilter("unbid")}
                >
                  ✨ No Bids <span class="pill-count">{c.unbid}</span>
                </button>
                <button
                  type="button"
                  class={`filter-pill ${currentRole === "buyout" ? "filter-pill-active" : ""}`}
                  onClick={() => store.setRoleFilter("buyout")}
                >
                  ⚡ Instant Buyout <span class="pill-count">{c.buyout}</span>
                </button>
              </div>

              {/* Row 3: Active Filters Summary & Reset Action */}
              {hasActiveFilters.value && (
                <div class="filter-results-bar">
                  <span class="filter-results-text">
                    Showing <strong>{filtered.length}</strong> of <strong>{totalCount}</strong> listings
                    {currentQuery.trim() && (
                      <span>
                        {" "}matching "<strong>{currentQuery.trim()}</strong>" (<em>{scopeLabel.value}</em>)
                      </span>
                    )}
                    {currentRole !== "all" && (
                      <span>
                        {" "}with filter: <strong>{currentRole.replace("_", " ")}</strong>
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    class="btn-reset-filters"
                    onClick={() => store.resetFilters()}
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Listings Grid or Empty States */}
          {totalCount === 0 ? (
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
              <h3 style={{ color: "var(--text-primary)", margin: "0.5rem 0 0.25rem" }}>
                No listings match your search
              </h3>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 1rem" }}>
                {currentQuery.trim() ? (
                  <span>
                    No items found for "<strong>{currentQuery.trim()}</strong>" within{" "}
                    <em>{scopeLabel.value}</em>.
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
                Clear Filters & Show All ({totalCount})
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
