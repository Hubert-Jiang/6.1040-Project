import { defineComponent } from "vue";
import { store } from "./store.ts";
import { HeaderBar } from "./components/HeaderBar.tsx";
import { StatusAlert } from "./components/StatusAlert.tsx";
import { UserSwitcher } from "./components/UserSwitcher.tsx";
import { ProfileSettings } from "./components/ProfileSettings.tsx";
import { ListingCreator } from "./components/ListingCreator.tsx";
import { SettlementInbox } from "./components/SettlementInbox.tsx";
import { MarketplaceFeed } from "./components/MarketplaceFeed.tsx";
import { LoginLanding } from "./components/LoginLanding.tsx";

export const AppLayout = defineComponent({
  name: "AppLayout",
  setup() {
    return () => (
      <div class="container">
        <StatusAlert />

        {!store.state.session ? (
          <LoginLanding />
        ) : (
          <>
            <HeaderBar />
            <main class="page-content" role="main">
              {store.state.currentPage === "marketplace" && <MarketplaceFeed />}
              {store.state.currentPage === "create" && <ListingCreator />}
              {store.state.currentPage === "inbox" && <SettlementInbox />}
              {(store.state.currentPage === "profile" || store.state.currentPage === "account") && (
                <ProfileSettings />
              )}
            </main>
          </>
        )}
      </div>
    );
  },
});

