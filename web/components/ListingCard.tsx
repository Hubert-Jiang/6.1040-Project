import { defineComponent, computed, ref, watch, type PropType } from "vue";
import { store } from "../store.ts";
import type { ListingItem } from "../api.ts";

export const ListingCard = defineComponent({
  name: "ListingCard",
  props: {
    item: {
      type: Object as PropType<ListingItem>,
      required: true,
    },
  },
  setup(props) {
    const isSeller = computed(() => props.item.isSeller);
    const isHighestBidder = computed(() => props.item.isHighestBidder);

    const minBid = computed(() => {
      return props.item.highestBidder !== null
        ? props.item.price + props.item.increment
        : props.item.price;
    });

    const customBid = ref<number>(minBid.value);

    // Keep custom bid default updated when minimum bid advances
    watch(minBid, (newMin) => {
      customBid.value = newMin;
    });

    function onSubmitBid(e: Event) {
      e.preventDefault();
      if (customBid.value !== null && !isNaN(customBid.value) && customBid.value >= 0) {
        store.submitBid(props.item.auction, props.item.listing, customBid.value);
      }
    }

    function onBuyout() {
      if (props.item.buyout !== null) {
        store.submitBid(props.item.auction, props.item.listing, props.item.buyout);
      }
    }

    function onCloseAuction() {
      store.closeAuction(props.item.auction, props.item.listing);
    }

    function onCancelAuction() {
      store.cancelAuction(props.item.auction, props.item.listing);
    }

    return () => {
      const hasBids = props.item.highestBidder !== null;
      const canBuyout = props.item.buyout !== null && props.item.buyout > props.item.price;

      return (
        <article class="listing-card">
          <div class="listing-title">{props.item.item}</div>

          {/* Pricing Highlight Box: Shows Current Payout & Next Required Bid Clearly */}
          <div class="price-highlight-box">
            <div class="price-primary">
              <span class="price-label">
                {hasBids ? "Current Highest Bid" : "Starting Price"}
              </span>
              <div class="price-amount-row">
                <span class="price-amount">${props.item.price}</span>
                {hasBids ? (
                  <span class="price-payout-badge">
                    Seller payout if ended now: ${props.item.price}
                  </span>
                ) : (
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
                <span class="pill-detail">(+${props.item.increment} min increment)</span>
              </div>

              {props.item.buyout !== null ? (
                <div class="price-pill buyout-pill">
                  <span class="pill-label">⚡ Instant Buyout:</span>
                  <strong class="pill-value">${props.item.buyout}</strong>
                </div>
              ) : (
                <div class="price-pill no-buyout-pill">
                  <span class="pill-detail">No buyout set</span>
                </div>
              )}
            </div>
          </div>

          {/* Masked Participant Metadata */}
          <div class="listing-meta">
            <div class="meta-pill">
              <span>Seller:</span>
              <span class="pseudonym-tag">{props.item.sellerAlias}</span>
              {isSeller.value && <span class="pseudonym-you-tag"> (you)</span>}
            </div>
            <div class="meta-pill">
              <span>Highest Bidder:</span>
              {props.item.highestBidder ? (
                <>
                  <strong class="pseudonym-tag">{props.item.highestBidder}</strong>
                  {isHighestBidder.value && (
                    <span class="pseudonym-you-tag"> (you)</span>
                  )}
                </>
              ) : (
                <em>No bids placed yet</em>
              )}
            </div>
          </div>

          {/* Interaction & Bidding Actions */}
          {!store.state.session ? (
            <div class="form-help" style={{ marginTop: "0.5rem" }}>
              Sign in on the Account page to place bids or buy out this item.
            </div>
          ) : (
            <div class="listing-actions">
              {/* Seller Controls */}
              {isSeller.value ? (
                <div class="seller-controls">
                  <span class="session-badge" style={{ alignSelf: "center" }}>
                    Your Listing
                  </span>
                  {hasBids ? (
                    <button
                      type="button"
                      class="btn btn-sm btn-close-auction"
                      id={`btn-end-auction-${props.item.auction}`}
                      title="End and finalize auction early with current highest bidder"
                      onClick={onCloseAuction}
                    >
                      🏁 End & Finalize (${props.item.price})
                    </button>
                  ) : (
                    <button
                      type="button"
                      class="btn btn-sm btn-close-auction"
                      id={`btn-cancel-auction-${props.item.auction}`}
                      title="Cancel and withdraw this unbid auction"
                      onClick={onCancelAuction}
                    >
                      🏁 Cancel Auction
                    </button>
                  )}
                </div>
              ) : isHighestBidder.value ? (
                /* Highest Bidder State: Re-bidding is paused to prevent accidental self-harm, buyout preserved */
                <div class="highest-bidder-status-card">
                  <div class="highest-bidder-header">
                    <span class="trophy-badge" aria-hidden="true">🏆</span>
                    <div>
                      <strong>You are currently the highest bidder (${props.item.price})!</strong>
                      <p class="highest-bidder-desc">
                        You hold the leading offer. You cannot place another incremental bid against yourself.
                      </p>
                    </div>
                  </div>

                  {canBuyout && (
                    <div class="highest-bidder-buyout-row">
                      <span class="buyout-note">
                        Want to guarantee the win and close immediately?
                      </span>
                      <button
                        type="button"
                        class="btn btn-sm btn-buyout"
                        onClick={onBuyout}
                      >
                        ⚡ Buyout Now for ${props.item.buyout}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-Winning Buyer Actions: Standard bidding and buyout */
                <div class="bid-controls">
                  <form
                    class="custom-bid-form"
                    style={{
                      display: "inline-flex",
                      gap: "0.4rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                    onSubmit={onSubmitBid}
                  >
                    <label
                      for={`input-bid-${props.item.auction}`}
                      style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}
                    >
                      Bid (min ${minBid.value}):
                    </label>
                    <input
                      id={`input-bid-${props.item.auction}`}
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
                    <button type="submit" class="btn btn-sm btn-primary">
                      Place Bid (${customBid.value})
                    </button>
                  </form>

                  {props.item.buyout !== null && (
                    <button
                      type="button"
                      class="btn btn-sm btn-buyout"
                      onClick={onBuyout}
                    >
                      ⚡ Buyout ${props.item.buyout}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </article>
      );
    };
  },
});
