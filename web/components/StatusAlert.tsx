import { defineComponent } from "vue";
import { store } from "../store.ts";

export const StatusAlert = defineComponent({
  name: "StatusAlert",
  setup() {
    return () => {
      if (!store.state.statusMessage) {
        return null;
      }
      return (
        <div class={`alert alert-${store.state.statusType}`}>
          {store.state.statusMessage}
        </div>
      );
    };
  },
});
