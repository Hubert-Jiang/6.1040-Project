import { defineComponent, ref, watch } from "vue";
import { store } from "../store.ts";

export const ProfileSettings = defineComponent({
  name: "ProfileSettings",
  setup() {
    const name = ref(store.state.name);
    const contact = ref(store.state.contact);

    // Keep inputs synced with store state when active user changes
    watch(
      () => [store.state.name, store.state.contact],
      ([newName, newContact]) => {
        name.value = newName;
        contact.value = newContact;
      },
    );

    function onSaveProfile(e: Event) {
      e.preventDefault();
      store.updateProfile(name.value, contact.value);
    }

    return () => (
      <section class="card">
        <div class="card-title">
          <span>2. My Contact Profile</span>
          {store.state.user && (
            <span class="session-badge">Active: {store.state.user}</span>
          )}
        </div>

        {!store.state.session ? (
          <div class="empty-state">
            <p>Please sign in above to view and manage your contact profile.</p>
          </div>
        ) : (
          <form onSubmit={onSaveProfile}>
            <div class="form-help" style={{ marginBottom: "0.75rem" }}>
              Currently editing contact details for <strong>{store.state.user}</strong>.
            </div>
            <div class="input-group">
              <label class="input-label" for="profile-name">
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                placeholder="e.g. Alice Doe"
                required
                value={name.value}
                onInput={(e: Event) => {
                  name.value = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <div class="input-group">
              <label class="input-label" for="profile-contact">
                Preferred Contact (Phone or Email)
              </label>
              <input
                id="profile-contact"
                type="text"
                placeholder="e.g. 617-555-0101 or alice@mit.edu"
                required
                value={contact.value}
                onInput={(e: Event) => {
                  contact.value = (e.target as HTMLInputElement).value;
                }}
              />
              <div class="form-help">
                🔒 Your contact info is strictly hidden while auctions are active, and only
                disclosed privately to the winning counterparty.
              </div>
            </div>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={store.state.loading}
            >
              Save Contact Profile
            </button>
          </form>
        )}
      </section>
    );
  },
});
