import { defineComponent } from "vue";
import { HeaderBar } from "./components/HeaderBar.tsx";
import { StatusAlert } from "./components/StatusAlert.tsx";
import { UserSwitcher } from "./components/UserSwitcher.tsx";
import { ProfileSettings } from "./components/ProfileSettings.tsx";
import { ListingCreator } from "./components/ListingCreator.tsx";
import { SettlementInbox } from "./components/SettlementInbox.tsx";
import { MarketplaceFeed } from "./components/MarketplaceFeed.tsx";

export const AppLayout = defineComponent({
  name: "AppLayout",
  setup() {
    return () => (
      <div class="container">
        <HeaderBar />
        <StatusAlert />
        <UserSwitcher />
        <ProfileSettings />
        <ListingCreator />
        <SettlementInbox />
        <MarketplaceFeed />
      </div>
    );
  },
});
