import { defineComponent } from "vue";
import { store } from "../store.ts";
import { PRESETS } from "../api.ts";

export const UserSwitcher = defineComponent({
  name: "UserSwitcher",
  setup() {
    return () => (
      <section class="card">
        <div class="card-title">
          <span>🔑 Touchstone Authentication</span>
          {store.state.session && <span class="session-badge">Session Active</span>}
        </div>
        <p class="card-subtitle">
          Touchstone manages authenticated sessions for MIT community members. Switch to verified Touchstone login or toggle between test accounts.
        </p>

        <div class="auth-bar">
          <div class="auth-status">
            <div>
              <span>Current User: </span>
              <span class="user-badge">{store.state.user ?? "Not Signed In"}</span>
            </div>
            {store.state.session && (
              <button
                type="button"
                id="btn-logout"
                class="btn btn-sm"
                onClick={() => store.logout()}
              >
                Sign Out
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", margin: "0.75rem 0" }}>
            <button
              type="button"
              class="btn btn-primary"
              id="btn-touchstone-oidc"
              onClick={() => store.loginWithPetrock()}
            >
              🔐 Authenticate with MIT Touchstone (Petrock)
            </button>
          </div>

          <div class="user-switcher-actions">
            <span>Testing & Development Accounts:</span>
            {PRESETS.map((p) => (
              <button
                key={p.username}
                type="button"
                id={`btn-switch-${p.username.split("@")[0]}`}
                class={`btn btn-sm ${store.state.user === p.username ? "btn-active" : ""}`}
                onClick={() => (p.username === "alice@mit.edu" ? store.loginAsAlice() : store.loginAsBob())}
              >
                🧪 Switch to {p.label} ({p.username})
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  },
});
