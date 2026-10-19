import { defineComponent, ref } from "vue";
import { store } from "../store.ts";
import { PRESETS } from "../api.ts";

export const UserSwitcher = defineComponent({
  name: "UserSwitcher",
  setup() {
    const customUsername = ref("");

    function onCustomLogin(e: Event) {
      e.preventDefault();
      const val = customUsername.value.trim();
      if (val) {
        customUsername.value = "";
        store.login(val);
      }
    }

    return () => (
      <section class="card">
        <div class="card-title">
          <span>🔑 Touchstone Authentication</span>
          {store.state.session && <span class="session-badge">Session Active</span>}
        </div>
        <p class="card-subtitle">
          Touchstone manages authenticated sessions for MIT community members. Switching accounts simulates authenticating as different students.
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

          <div class="user-switcher-actions">
            <span>Quick Switch Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.username}
                type="button"
                class={`btn btn-sm ${store.state.user === p.username ? "btn-active" : ""}`}
                onClick={() => store.login(p.username)}
              >
                {p.label} ({p.username})
              </button>
            ))}
          </div>

          <form class="custom-login-form" onSubmit={onCustomLogin}>
            <input
              type="text"
              placeholder="Or enter custom Kerberos email (e.g. charlie@mit.edu)"
              value={customUsername.value}
              onInput={(e: Event) => {
                customUsername.value = (e.target as HTMLInputElement).value;
              }}
            />
            <button type="submit" class="btn btn-primary btn-sm">
              Sign In
            </button>
          </form>
        </div>
      </section>
    );
  },
});
