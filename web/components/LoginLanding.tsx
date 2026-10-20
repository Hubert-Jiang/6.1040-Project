import { defineComponent } from "vue";
import { store } from "../store.ts";

export const LoginLanding = defineComponent({
  name: "LoginLanding",
  setup() {
    return () => (
      <div class="login-landing-container">
        <div class="login-landing-card">
          <div class="login-hero">
            <span class="login-brand-icon">🦫</span>
            <h1 class="login-title">BeaverBazaar</h1>
            <p class="login-subtitle">
              MIT Dormspam Companion • Anonymous Peer Auctions
            </p>
          </div>

          <div class="login-actions">
            <button
              type="button"
              id="btn-login-touchstone-primary"
              class="btn btn-primary login-btn-large"
              onClick={() => store.loginWithPetrock()}
            >
              🔐 Log In with MIT Touchstone
            </button>

            <div class="test-accounts-section">
              <span class="test-accounts-label">Testing Accounts:</span>
              <div class="test-accounts-buttons">
                <button
                  type="button"
                  id="btn-login-alice-primary"
                  class="btn login-btn-test"
                  onClick={() => store.loginAsAlice()}
                >
                  🧪 Alice (alice@mit.edu)
                </button>
                <button
                  type="button"
                  id="btn-login-bob-primary"
                  class="btn login-btn-test"
                  onClick={() => store.loginAsBob()}
                >
                  🧪 Bob (bob@mit.edu)
                </button>
              </div>
            </div>
          </div>

          <div class="login-footer-info">
            <p>BeaverBazaar is restricted to verified MIT community members.</p>
          </div>
        </div>
      </div>
    );
  },
});
