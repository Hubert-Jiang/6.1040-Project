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

    return () => (
      <div class="listing-card">
        <div class="listing-title">{props.item.item}</div>

        <div class="listing-price-row">
          <span class="listing-current-price">${props.item.price}</span>
          <span class="listing-increment">(+${props.item.increment} min increment)</span>
          {props.item.buyout !== null ? (
            <span class="listing-buyout">
              ⚡ ${props.item.buyout} Instant Buyout
            </span>
          ) : (
            <span class="listing-increment">No buyout set</span>
          )}
        </div>

        <div class="listing-meta">
          <div class="meta-pill">
            <span>Seller:</span>
            <span class="pseudonym-tag">{props.item.sellerAlias}</span>
            <span class="session-badge">(Masked Alias)</span>
          </div>
          <div class="meta-pill">
            <span>Highest Bidder:</span>
            {props.item.highestBidder ? (
              <strong class="pseudonym-tag">
                {props.item.highestBidder}
                {isHighestBidder.value && " (you)"}
              </strong>
            ) : (
              <em>No bids placed yet</em>
            )}
          </div>
        </div>

        {/* Bidding Actions */}
        {!store.state.session ? (
          <div class="form-help" style={{ marginTop: "0.5rem" }}>
            Sign in above to place bids or buy out this item.
          </div>
        ) : (
          <div class="listing-actions">
            <div class="bid-controls">
              {/* Seller Actions: Sellers always see the end or cancel button on their own auctions */}
              {isSeller.value ? (
                <>
                  <span class="session-badge">Your Listing</span>
                  {props.item.highestBidder !== null ? (
                    <button
                      type="button"
                      class="btn btn-sm btn-close-auction"
                      id={`btn-end-auction-${props.item.auction}`}
                      title="End and finalize auction early with current highest bidder (Seller action)"
                      onClick={onCloseAuction}
                    >
                      🏁 End & Finalize (${props.item.price})
                    </button>
                  ) : (
                    <button
                      type="button"
                      class="btn btn-sm btn-close-auction"
                      id={`btn-cancel-auction-${props.item.auction}`}
                      title="Cancel and withdraw this unbid auction (Seller action)"
                      onClick={onCancelAuction}
                    >
                      🏁 Cancel Auction
                    </button>
                  )}
                </>
              ) : (
                /* Buyer Actions: Min bid button removed, input defaults to minBid */
                <>
                  <form
                    class="custom-bid-form"
                    style={{
                      display: "inline-flex",
                      gap: "0.35rem",
                      alignItems: "center",
                    }}
                    onSubmit={onSubmitBid}
                  >
                    <input
                      type="number"
                      placeholder="$"
                      min={minBid.value}
                      step="1"
                      required
                      value={customBid.value}
                      onInput={(e: Event) => {
                        const val = (e.target as HTMLInputElement).value;
                        customBid.value = Number(val);
                      }}
                    />
                    <button type="submit" class="btn btn-sm">
                      Bid
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
});
