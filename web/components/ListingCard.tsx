import { defineComponent, computed, type PropType } from "vue";
import { store } from "../store.ts";
import { filterSafeImages, type ListingItem } from "../api.ts";

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
    const hasBids = computed(() => props.item.highestBidder !== null);

    const coverPhoto = computed(() => {
      const safeImages = filterSafeImages(props.item.images);
      return safeImages.length > 0 ? safeImages[0] : null;
    });

    function onClickCard() {
      store.setSelectedListing(props.item);
    }

    return () => (
      <article
        class="listing-card listing-card-clickable"
        onClick={onClickCard}
        role="button"
        tabindex="0"
        onKeydown={(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClickCard();
          }
        }}
        aria-label={`View details for ${props.item.title}`}
      >
        {/* Thumbnail Cover Image */}
        <div class="card-image-wrapper">
          {coverPhoto.value ? (
            <img
              src={coverPhoto.value}
              alt={props.item.title}
              class="card-cover-image"
              loading="lazy"
            />
          ) : (
            <div class="card-image-placeholder">
              <span class="placeholder-icon">🏷️</span>
            </div>
          )}

          {props.item.buyout !== null && (
            <span class="card-buyout-badge">
              ⚡ Buyout: ${props.item.buyout}
            </span>
          )}

          {isSeller.value && (
            <span class="card-role-badge card-role-seller">Your Listing</span>
          )}

          {isHighestBidder.value && (
            <span class="card-role-badge card-role-winning">🏆 Leading Bidder</span>
          )}
        </div>

        <div class="card-content">
          <h3 class="listing-title" title={props.item.title}>
            {props.item.title}
          </h3>

          <div class="card-seller-row">
            <span class="seller-label">Seller:</span>
            <span class="pseudonym-tag">{props.item.sellerAlias}</span>
          </div>

          {/* Pricing Row: Headline Current Price */}
          <div class="card-pricing-row">
            <div class="card-price-block">
              <span class="card-price-val">${props.item.price}</span>
              <span class="card-price-label">
                {hasBids.value ? "Current Bid" : "Starting Price"}
              </span>
            </div>

            {!hasBids.value && (
              <span class="price-unbid-badge">No bids</span>
            )}
          </div>

          <div class="card-footer-action">
            <span class="card-action-hint">
              {isSeller.value
                ? "Manage Listing →"
                : hasBids.value
                  ? "View & Bid →"
                  : "Place Opening Bid →"}
            </span>
          </div>
        </div>
      </article>
    );
  },
});
