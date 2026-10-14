import { defineComponent, ref } from "vue";
import { store } from "../store.ts";

export const ListingCreator = defineComponent({
  name: "ListingCreator",
  setup() {
    const item = ref("");
    const startPrice = ref<number | null>(0);
    const increment = ref<number | null>(1);
    const buyout = ref<number | null>(1);

    async function onSubmitListing(e: Event) {
      e.preventDefault();
      if (!item.value.trim() || startPrice.value === null || increment.value === null) {
        return;
      }
      const success = await store.createListing(
        item.value.trim(),
        startPrice.value,
        increment.value,
        buyout.value !== null && !isNaN(buyout.value) ? buyout.value : null,
      );
      if (success) {
        item.value = "";
        startPrice.value = 0;
        increment.value = 1;
        buyout.value = 1;
      }
    }

    return () => (
      <section class="card">
        <div class="card-title">
          <span>3. Post a New Auction Listing</span>
        </div>

        {!store.state.session ? (
          <div class="empty-state">
            <p>Please sign in above to post an auction listing.</p>
          </div>
        ) : (
          <form onSubmit={onSubmitListing}>
            <div class="input-group">
              <label class="input-label" for="listing-item">
                Item Title / Description
              </label>
              <input
                id="listing-item"
                type="text"
                placeholder="e.g. Vintage Road Bike (Great Condition)"
                required
                value={item.value}
                onInput={(e: Event) => {
                  item.value = (e.target as HTMLInputElement).value;
                }}
              />
            </div>

            <div class="form-row">
              <div class="input-group">
                <label class="input-label" for="listing-start-price">
                  Starting Price ($)
                </label>
                <input
                  id="listing-start-price"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                  value={startPrice.value ?? ""}
                  onInput={(e: Event) => {
                    const val = (e.target as HTMLInputElement).value;
                    startPrice.value = val === "" ? null : Number(val);
                  }}
                />
              </div>
              <div class="input-group">
                <label class="input-label" for="listing-increment">
                  Min Increment ($)
                </label>
                <input
                  id="listing-increment"
                  type="number"
                  placeholder="1"
                  min="1"
                  step="1"
                  required
                  value={increment.value ?? ""}
                  onInput={(e: Event) => {
                    const val = (e.target as HTMLInputElement).value;
                    increment.value = val === "" ? null : Number(val);
                  }}
                />
              </div>
              <div class="input-group">
                <label class="input-label" for="listing-buyout">
                  Buyout Price ($ optional, 0 for giveaway)
                </label>
                <input
                  id="listing-buyout"
                  type="number"
                  placeholder="1 (or 0)"
                  min="0"
                  step="1"
                  value={buyout.value ?? ""}
                  onInput={(e: Event) => {
                    const val = (e.target as HTMLInputElement).value;
                    buyout.value = val === "" ? null : Number(val);
                  }}
                />
              </div>
            </div>

            <div class="form-help" style={{ marginBottom: "0.75rem" }}>
              🎭 Anonymity Notice: Your listing is posted under a unique contextual pseudonym
              to shield your identity from public campus dormspam feeds.
            </div>

            <button
              type="submit"
              class="btn btn-primary"
              disabled={store.state.loading}
            >
              Post Auction Listing
            </button>
          </form>
        )}
      </section>
    );
  },
});
