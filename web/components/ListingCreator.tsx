import { defineComponent, ref, nextTick } from "vue";
import { store } from "../store.ts";

const MAX_DESC_CHARS = 1000;
const MAX_DESC_LINES = 12;
const MAX_IMAGES = 5;

export const ListingCreator = defineComponent({
  name: "ListingCreator",
  setup() {
    const title = ref("");
    const description = ref("");
    const images = ref<string[]>([]);
    const startPrice = ref<number | null>(0);
    const increment = ref<number | null>(1);
    const buyout = ref<number | null>(null);
    const isDragging = ref(false);
    const fileInputRef = ref<HTMLInputElement | null>(null);
    const descriptionTextareaRef = ref<HTMLTextAreaElement | null>(null);

    function adjustTextareaHeight() {
      const el = descriptionTextareaRef.value;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.max(84, el.scrollHeight)}px`;
    }

    function handleFiles(fileList: FileList | null) {
      if (!fileList || fileList.length === 0) return;
      const remainingSlots = MAX_IMAGES - images.value.length;
      if (remainingSlots <= 0) {
        store.setStatus(`Maximum of ${MAX_IMAGES} photos allowed per listing.`, "error");
        return;
      }

      const files = Array.from(fileList);
      if (files.length > remainingSlots) {
        store.setStatus(
          `Only ${remainingSlots} photo(s) added (capped at ${MAX_IMAGES} photos per listing).`,
          "info",
        );
      }

      files.slice(0, remainingSlots).forEach((file) => {
        const lowerName = file.name.toLowerCase();
        // Reject GIFs explicitly as requested
        if (file.type === "image/gif" || lowerName.endsWith(".gif")) {
          store.setStatus("GIFs are not supported. Please upload PNG, JPG, or WEBP photos.", "error");
          return;
        }

        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
          store.setStatus(`Skipped ${file.name}: only PNG, JPG, and WEBP image files are supported.`, "error");
          return;
        }

        // Max 5MB per image safeguard
        if (file.size > 5 * 1024 * 1024) {
          store.setStatus(`Skipped ${file.name}: file exceeds 5MB size limit.`, "error");
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result && !images.value.includes(result)) {
            if (images.value.length < MAX_IMAGES) {
              images.value.push(result);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }

    function onDragOver(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
      isDragging.value = true;
    }

    function onDragLeave(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
      isDragging.value = false;
    }

    function onDrop(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
      isDragging.value = false;
      if (e.dataTransfer?.files) {
        handleFiles(e.dataTransfer.files);
      }
    }

    function onFileInputChange(e: Event) {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleFiles(target.files);
        target.value = ""; // Reset so same file can be re-selected if removed
      }
    }

    function removeImage(index: number) {
      images.value.splice(index, 1);
    }

    function setAsCover(index: number) {
      if (index <= 0 || index >= images.value.length) return;
      const [selected] = images.value.splice(index, 1);
      images.value.unshift(selected);
      store.setStatus("Selected photo set as cover.", "info");
    }

    async function onSubmitListing(e: Event) {
      e.preventDefault();
      if (!title.value.trim() || startPrice.value === null || increment.value === null) {
        return;
      }

      const rawDesc = description.value.trim();
      if (rawDesc.length > MAX_DESC_CHARS) {
        store.setStatus(`Description exceeds the ${MAX_DESC_CHARS} character limit.`, "error");
        return;
      }

      const lines = rawDesc.split("\n");
      if (lines.length > MAX_DESC_LINES) {
        store.setStatus(
          `Description cannot have more than ${MAX_DESC_LINES} lines. Please consolidate paragraph breaks.`,
          "error",
        );
        return;
      }

      // Normalize excessive consecutive blank lines (limit to double newline)
      const sanitizedDesc = rawDesc.replace(/\n{3,}/g, "\n\n");

      if (images.value.length > MAX_IMAGES) {
        store.setStatus(`Maximum of ${MAX_IMAGES} photos allowed per listing.`, "error");
        return;
      }

      const success = await store.createListing(
        title.value.trim(),
        sanitizedDesc,
        images.value,
        startPrice.value,
        increment.value,
        buyout.value !== null && !isNaN(buyout.value) ? buyout.value : null,
      );

      if (success) {
        title.value = "";
        description.value = "";
        images.value = [];
        startPrice.value = 0;
        increment.value = 1;
        buyout.value = null;
        nextTick(() => {
          adjustTextareaHeight();
        });
      }
    }

    return () => (
      <section class="card">
        <div class="card-title">
          <span>➕ Post a New Auction Listing</span>
        </div>
        <p class="card-subtitle">
          Publish an item to the campus marketplace with photos and item details. Set an opening price, minimum bid increment, and optional instant buyout price.
        </p>

        {!store.state.session ? (
          <div class="empty-state">
            <p>Please sign in on the Account page to post an auction listing.</p>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              style={{ marginTop: "0.75rem" }}
              onClick={() => store.setPage("account")}
            >
              Go to Account Sign In →
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmitListing}>
            <div class="input-group">
              <label class="input-label" for="listing-title">
                Item Title
              </label>
              <input
                id="listing-title"
                type="text"
                placeholder="e.g. Vintage Fuji Road Bike (54cm)"
                required
                value={title.value}
                onInput={(e: Event) => {
                  title.value = (e.target as HTMLInputElement).value;
                }}
              />
            </div>

            <div class="input-group">
              <label class="input-label" for="listing-description">
                Item Description
              </label>
              <textarea
                ref={descriptionTextareaRef}
                id="listing-description"
                class="auto-resize-textarea"
                rows={3}
                maxlength={MAX_DESC_CHARS}
                placeholder="Describe condition, sizing details, or try-on rules..."
                value={description.value}
                onInput={(e: Event) => {
                  description.value = (e.target as HTMLTextAreaElement).value;
                  adjustTextareaHeight();
                }}
              />
              <div class="description-meta-row">
                <span class="desc-hint">Max {MAX_DESC_CHARS} characters, up to {MAX_DESC_LINES} lines.</span>
                <span class={`desc-counter ${description.value.length > 900 ? "char-counter-warn" : ""}`}>
                  {description.value.length} / {MAX_DESC_CHARS}
                </span>
              </div>
            </div>

            {/* Drag & Drop Photo Upload Zone (PNG, JPG, WEBP - Max 5) */}
            <div class="input-group">
              <label class="input-label">
                Photos (Drag & Drop or Select) — {images.value.length}/{MAX_IMAGES}
              </label>
              {images.value.length >= MAX_IMAGES ? (
                <div class="dropzone dropzone-disabled">
                  <div class="dropzone-content">
                    <span class="dropzone-icon" aria-hidden="true">📸</span>
                    <div class="dropzone-text">
                      <strong>Maximum limit of {MAX_IMAGES} photos reached</strong>
                    </div>
                    <span class="dropzone-hint">
                      Remove a photo below if you want to upload a different one.
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  class={`dropzone ${isDragging.value ? "dropzone-active" : ""}`}
                  onDragover={onDragOver}
                  onDragenter={onDragOver}
                  onDragleave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.value?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    style={{ display: "none" }}
                    onChange={onFileInputChange}
                  />
                  <div class="dropzone-content">
                    <span class="dropzone-icon" aria-hidden="true">📸</span>
                    <div class="dropzone-text">
                      <strong>Drag and drop images here</strong>, or <span class="dropzone-link">browse files</span>
                    </div>
                    <span class="dropzone-hint">
                      PNG, JPG, or WEBP up to 5MB (up to {MAX_IMAGES} photos)
                    </span>
                  </div>
                </div>
              )}

              {/* Uploaded Image Previews with Click-to-Set-Cover */}
              {images.value.length > 0 && (
                <>
                  <div class="image-preview-grid">
                    {images.value.map((img, idx) => (
                      <div
                        class={`image-preview-card ${idx === 0 ? "is-cover" : ""}`}
                        key={idx}
                        onClick={() => setAsCover(idx)}
                        title={idx === 0 ? "Cover photo" : "Click to set as cover photo"}
                        role="button"
                        tabindex="0"
                        onKeydown={(e: KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setAsCover(idx);
                          }
                        }}
                      >
                        <img src={img} alt={`Preview ${idx + 1}`} class="image-preview-thumb" />
                        <button
                          type="button"
                          class="btn-image-remove"
                          title="Remove photo"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                        >
                          ✕
                        </button>
                        {idx === 0 ? (
                          <span class="image-cover-badge">★ Cover</span>
                        ) : (
                          <span class="image-set-cover-hint">Set Cover</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {images.value.length > 1 && (
                    <div class="form-help" style={{ marginTop: "0.4rem" }}>
                      💡 Click any photo to set it as the primary cover photo.
                    </div>
                  )}
                </>
              )}
            </div>

            <div class="form-row">
              <div class="input-group">
                <label class="input-label" for="listing-start-price">
                  Starting Price ($)
                </label>
                <input
                  id="listing-start-price"
                  type="number"
                  placeholder=">= 0"
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
                  placeholder=">= 1"
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
                  Buyout Price ($)
                </label>
                <input
                  id="listing-buyout"
                  type="number"
                  placeholder="None (optional)"
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

            <div class="form-help" style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              ⚡ Your auction will instantly end if someone offers at or above the buyout price. (optional)
            </div>

            <div class="form-help" style={{ marginBottom: "1rem" }}>
              🎭 Your listing is initialized behind a pseudonym. Your identity is only disclosed privately to the winning counterparty.
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
