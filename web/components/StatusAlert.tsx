import { defineComponent } from "vue";
import { store } from "../store.ts";

export const StatusAlert = defineComponent({
  name: "StatusAlert",
  setup() {
    function onDismiss() {
      store.setStatus(null);
    }

    return () => {
      if (!store.state.statusMessage) {
        return null;
      }

      const icon =
        store.state.statusType === "success"
          ? "✅"
          : store.state.statusType === "error"
            ? "⚠️"
            : "ℹ️";

      return (
        <aside
          class={`alert alert-${store.state.statusType}`}
          role="status"
          aria-live="polite"
        >
          <div class="alert-content">
            <span class="alert-icon" aria-hidden="true">
              {icon}
            </span>
            <span class="alert-message">{store.state.statusMessage}</span>
          </div>
          <button
            type="button"
            class="alert-dismiss-btn"
            aria-label="Dismiss alert"
            onClick={onDismiss}
          >
            ×
          </button>
        </aside>
      );
    };
  },
});
