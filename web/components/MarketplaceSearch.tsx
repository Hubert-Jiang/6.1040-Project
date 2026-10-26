import { defineComponent, computed } from "vue";
import { store, type SearchScope, type RoleFilter } from "../store.ts";

export const MarketplaceSearch = defineComponent({
  name: "MarketplaceSearch",
  setup() {
    const totalCount = computed(() => store.state.listings.length);
    const filteredCount = computed(() => store.getFilteredListings().length);

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
      const currentTotal = totalCount.value;
      if (currentTotal === 0) return null;

      const c = counts.value;
      const currentQuery = store.state.searchQuery;
      const currentScope = store.state.searchScope;
      const currentRole = store.state.roleFilter;

      return (
        <div class="marketplace-search-box">
          {/* Row 1: Search Keyword Input & Scope Selector */}
          <div class="search-input-row">
            <div class="search-input-wrapper">
              <span
                class="search-icon"
                aria-hidden="true"
                onClick={() => document.getElementById("marketplace-search-input")?.focus()}
              >
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
                Showing <strong>{filteredCount.value}</strong> of <strong>{currentTotal}</strong> listings
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
      );
    };
  },
});
