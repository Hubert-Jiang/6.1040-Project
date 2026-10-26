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
          <span>👤 Profile & Account</span>
        </div>
        <p class="card-subtitle">
          🔒 Your information is hidden while auctions are active, and only disclosed privately to the winning counterparty.
        </p>

        {!store.state.session ? (
          <div class="empty-state">
            <p>Please sign in to view and manage your profile.</p>
          </div>
        ) : (
          <>
            <div class="session-info-bar">
              <div>
                <span class="session-label">Current Kerberos: </span>
                <strong class="user-badge session-user">{store.state.user}</strong>
              </div>
              <button
                type="button"
                id="btn-logout"
                class="btn btn-sm"
                onClick={() => store.logout()}
              >
                Sign Out
              </button>
            </div>

            <form onSubmit={onSaveProfile} class="profile-form">
              <div class="input-group">
                <label class="input-label" for="profile-name">
                  Full / Display Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  placeholder="e.g. Alice Doe"
                  maxlength={60}
                  required
                  value={name.value}
                  onInput={(e: Event) => {
                    name.value = (e.target as HTMLInputElement).value;
                  }}
                />
              </div>

              <div class="input-group">
                <label class="input-label" for="profile-contact">
                  Preferred Contact Method (Phone or Email)
                </label>
                <input
                  id="profile-contact"
                  type="text"
                  placeholder="e.g. (617) 555-0101 or alice@mit.edu"
                  maxlength={80}
                  required
                  value={contact.value}
                  onInput={(e: Event) => {
                    contact.value = (e.target as HTMLInputElement).value;
                  }}
                />
              </div>

              <button
                type="submit"
                class="btn btn-primary"
                disabled={store.state.loading}
              >
                Save Contact Details
              </button>
            </form>
          </>
        )}
      </section>
    );
  },
});
