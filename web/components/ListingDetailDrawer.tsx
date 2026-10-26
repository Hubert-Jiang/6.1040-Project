import { defineComponent, computed, ref, watch, onMounted, onUnmounted } from "vue";
import { store } from "../store.ts";

export const ListingDetailDrawer = defineComponent({
  name: "ListingDetailDrawer",
  setup() {
    const item = computed(() => store.state.selectedListing);
    const activeImageIndex = ref(0);

    // Reset active photo index when opened listing changes
    watch(
      () => item.value?.listing,
      () => {
        activeImageIndex.value = 0;
      },
    );

    const isSeller = computed(() => item.value?.isSeller ?? false);
    const isHighestBidder = computed(() => item.value?.isHighestBidder ?? false);

    const minBid = computed(() => {
      if (!item.value) return 0;
      return item.value.highestBidder !== null
        ? item.value.price + item.value.increment
        : item.value.price;
    });

    const customBid = ref<number>(0);

    // Keep bid input synchronized with minBid
    watch(
      minBid,
      (newMin) => {
        customBid.value = newMin;
      },
      { immediate: true },
    );

    function closeDrawer() {
      store.setSelectedListing(null);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && store.state.selectedListing) {
        closeDrawer();
      }
    }

    onMounted(() => {
      if (typeof window !== "undefined") {
        window.addEventListener("keydown", onKeyDown);
      }
    });

    onUnmounted(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", onKeyDown);
      }
    });

    function onSubmitBid(e: Event) {
      e.preventDefault();
      if (!item.value) return;
      if (customBid.value !== null && !isNaN(customBid.value) && customBid.value >= 0) {
        store.submitBid(item.value.auction, item.value.listing, customBid.value);
      }
    }

    function onBuyout() {
      if (!item.value || item.value.buyout === null) return;
      store.submitBid(item.value.auction, item.value.listing, item.value.buyout);
    }

    function onCloseAuction() {
      if (!item.value) return;
      store.closeAuction(item.value.auction, item.value.listing);
    }

    function onCancelAuction() {
      if (!item.value) return;
      store.cancelAuction(item.value.auction, item.value.listing);
    }

    return () => {
      const listing = item.value;
      if (!listing) return null;

      const hasBids = listing.highestBidder !== null;
      const canBuyout = listing.buyout !== null && listing.buyout > listing.price;
      const photos = listing.images && listing.images.length > 0 ? listing.images : [];
      const currentPhoto = photos[activeImageIndex.value] || photos[0];

      return (
        <div class="drawer-overlay" onClick={closeDrawer}>
          <div
            class="drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            {/* Header */}
            <div class="drawer-header">
              <span class="drawer-title" id="drawer-title">
                🏷️ Auction Details
              </span>
              <button
                type="button"
                class="btn-drawer-close"
                onClick={closeDrawer}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div class="drawer-body">
              {/* Image Gallery */}
              <div class="drawer-gallery">
                {currentPhoto ? (
                  <div class="drawer-image-stage">
                    <img
                      src={currentPhoto}
                      alt={listing.title}
                      class="drawer-main-image"
                    />
                  </div>
                ) : (
                  <div class="drawer-image-placeholder">
                    <span class="placeholder-icon">📦</span>
                    <span class="placeholder-text">No photos uploaded for this listing</span>
                  </div>
                )}

                {photos.length > 1 && (
                  <div class="drawer-thumbnails-row">
                    {photos.map((photo, idx) => (
                      <button
                        type="button"
                        key={idx}
                        class={`drawer-thumb-btn ${idx === activeImageIndex.value ? "drawer-thumb-active" : ""}`}
                        onClick={() => {
                          activeImageIndex.value = idx;
                        }}
                      >
                        <img src={photo} alt={`Thumbnail ${idx + 1}`} class="drawer-thumb-img" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div class="drawer-section">
                <h2 class="drawer-listing-title">{listing.title}</h2>
                <div class="drawer-description">
                  {listing.description ? (
                    <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                      {listing.description}
                    </p>
                  ) : (
                    <p class="text-muted"><em>No item description provided.</em></p>
                  )}
                </div>
              </div>

              {/* Masked Metadata */}
              <div class="drawer-meta-section">
                <div class="drawer-meta-row">
                  <span class="meta-label">Seller:</span>
                  <span class="pseudonym-tag">{listing.sellerAlias}</span>
                  {isSeller.value && <span class="pseudonym-you-tag"> (you)</span>}
                </div>
                <div class="drawer-meta-row">
                  <span class="meta-label">Highest Bidder:</span>
                  {listing.highestBidder ? (
                    <>
                      <strong class="pseudonym-tag">{listing.highestBidder}</strong>
                      {isHighestBidder.value && <span class="pseudonym-you-tag"> (you)</span>}
                    </>
                  ) : (
                    <em class="text-muted">No bids placed yet</em>
                  )}
                </div>
              </div>

              {/* Pricing Box */}
              <div class="price-highlight-box">
                <div class="price-primary">
                  <span class="price-label">
                    {hasBids ? "Current Highest Bid" : "Starting Price"}
                  </span>
                  <div class="price-amount-row">
                    <span class="price-amount">${listing.price}</span>
                    {!hasBids && (
                      <span class="price-unbid-badge">No bids placed yet</span>
                    )}
                  </div>
                </div>

                <div class="price-secondary-row">
                  <div class="price-pill min-bid-pill">
                    <span class="pill-label">
                      {hasBids ? "Next Minimum Bid:" : "Minimum Opening Bid:"}
                    </span>
                    <strong class="pill-value">${minBid.value}</strong>
                    {hasBids && (
                      <span class="pill-detail">(+${listing.increment} min increment)</span>
                    )}
                  </div>

                  {listing.buyout !== null ? (
                    <div class="price-pill buyout-pill">
                      <span class="pill-label">⚡ Instant Buyout:</span>
                      <strong class="pill-value">${listing.buyout}</strong>
                    </div>
                  ) : (
                    <div class="price-pill no-buyout-pill">
                      <span class="pill-detail">No buyout set</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bidding & Seller Actions */}
              <div class="drawer-actions-section">
                {!store.state.session ? (
                  <div class="form-help">
                    Sign in on the Account page to place bids or buy out this item.
                  </div>
                ) : isSeller.value ? (
                  <div class="seller-controls-box">
                    <div class="session-badge" style={{ marginBottom: "0.5rem" }}>
                      Your Listing
                    </div>
                    {hasBids ? (
                      <button
                        type="button"
                        class="btn btn-close-auction"
                        id={`btn-end-auction-${listing.auction}`}
                        title="End and finalize auction early with current highest bidder"
                        onClick={onCloseAuction}
                      >
                        🏁 End & Finalize Auction (${listing.price})
                      </button>
                    ) : (
                      <button
                        type="button"
                        class="btn btn-close-auction"
                        id={`btn-cancel-auction-${listing.auction}`}
                        title="Cancel and withdraw this unbid auction"
                        onClick={onCancelAuction}
                      >
                        🏁 Cancel & Delete Auction
                      </button>
                    )}
                  </div>
                ) : isHighestBidder.value ? (
                  <div class="highest-bidder-status-card">
                    <div class="highest-bidder-header">
                      <span class="trophy-badge" aria-hidden="true">🏆</span>
                      <div>
                        <strong>You are currently the highest bidder (${listing.price})!</strong>
                        <p class="highest-bidder-desc">
                          You hold the leading offer. You cannot place a bid against yourself.
                        </p>
                      </div>
                    </div>

                    {canBuyout && (
                      <div class="highest-bidder-buyout-row" style={{ marginTop: "0.75rem" }}>
                        <span class="buyout-note">
                          Guarantee the win and close immediately:
                        </span>
                        <button
                          type="button"
                          class="btn btn-sm btn-buyout"
                          onClick={onBuyout}
                        >
                          ⚡ Buyout Now for ${listing.buyout}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div class="buyer-controls-box">
                    <form class="custom-bid-form" onSubmit={onSubmitBid}>
                      <label
                        for={`drawer-bid-input-${listing.auction}`}
                        style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}
                      >
                        Bid (minimum ${minBid.value}):
                      </label>
                      <div class="bid-input-action-row">
                        <input
                          id={`drawer-bid-input-${listing.auction}`}
                          type="number"
                          placeholder={`$${minBid.value}`}
                          min={minBid.value}
                          step="1"
                          required
                          value={customBid.value}
                          onInput={(e: Event) => {
                            const val = (e.target as HTMLInputElement).value;
                            customBid.value = Number(val);
                          }}
                        />
                        <button type="submit" class="btn btn-primary">
                          Place Bid (${customBid.value})
                        </button>
                      </div>
                    </form>

                    {listing.buyout !== null && (
                      <div class="buyout-action-row">
                        <button
                          type="button"
                          class="btn btn-buyout"
                          onClick={onBuyout}
                        >
                          ⚡ Instant Buyout for ${listing.buyout}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };
  },
});
