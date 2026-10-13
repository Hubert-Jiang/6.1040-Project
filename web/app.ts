import { createApp } from "vue";
import { AppLayout } from "./AppLayout.tsx";
import { store } from "./store.ts";

// Instantiate and mount Vue application
const app = createApp(AppLayout);
app.mount("#app");

// Bootstrap application state and auto-login as Alice
store.init();
