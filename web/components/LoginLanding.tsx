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

          <div class="login-banner">
            <span class="login-lock-icon">🔒</span>
            <div>
              <strong>MIT Touchstone Authentication Required</strong>
              <p class="login-banner-text">
                BeaverBazaar is restricted to verified MIT community members. Sign in with MIT Touchstone via Petrock, or choose a test account below.
              </p>
            </div>
          </div>

          <div class="login-actions">
            <button
              type="button"
              id="btn-login-touchstone-primary"
              class="btn btn-primary login-btn-large"
              onClick={() => store.loginWithPetrock()}
            >
              🔐 Log In with MIT Touchstone (Petrock OIDC)
            </button>

            <div class="test-accounts-section">
              <span class="test-accounts-label">Quick Testing Accounts:</span>
              <div class="test-accounts-buttons">
                <button
                  type="button"
                  id="btn-login-alice-primary"
                  class="btn login-btn-test"
                  onClick={() => store.loginAsAlice()}
                >
                  🧪 Test Account: Alice (alice@mit.edu)
                </button>
                <button
                  type="button"
                  id="btn-login-bob-primary"
                  class="btn login-btn-test"
                  onClick={() => store.loginAsBob()}
                >
                  🧪 Test Account: Bob (bob@mit.edu)
                </button>
              </div>
            </div>
          </div>

          <div class="login-footer-info">
            <p>
              <strong>Petrock OIDC Integration:</strong> Integrates directly with <a href="https://petrock.mit.edu/" target="_blank" rel="noreferrer">petrock.mit.edu</a>, MIT's student-run OpenID Connect identity provider for Touchstone authentication.
            </p>
            <p style={{ marginTop: "0.4rem" }}>
              <strong>Pseudonymity Guaranteed:</strong> Your real email and contact information remain hidden behind context-scoped aliases until an auction successfully closes.
            </p>
          </div>
        </div>
      </div>
    );
  },
});
