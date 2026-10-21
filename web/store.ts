import { client, type ListingItem, type NotificationItem } from "./api.ts";
import { type Page, uiState, setPage, setStatus, setLoading, useUIStore } from "./stores/ui.ts";
import {
  authState,
  loadProfile,
  updateProfile,
  login,
  loginAsAlice,
  loginAsBob,
  loginWithPetrock,
  logout,
  useAuthStore,
} from "./stores/auth.ts";
import {
  marketplaceState,
  loadFeed,
  createListing,
  submitBid,
  closeAuction,
  cancelAuction,
  useMarketplaceStore,
} from "./stores/marketplace.ts";
import {
  notificationsState,
  loadNotifications,
  dismissNotification,
  toggleNotificationsMenu,
  closeNotificationsMenu,
  useNotificationsStore,
} from "./stores/notifications.ts";

export type { Page, ListingItem, NotificationItem };
export { useUIStore, useAuthStore, useMarketplaceStore, useNotificationsStore };

export interface AppState {
  user: string | null;
  session: string | null;
  name: string;
  contact: string;
  currentPage: Page;
  listings: ListingItem[];
  notifications: NotificationItem[];
  notificationsMenuOpen: boolean;
  statusMessage: string | null;
  statusType: "success" | "error" | "info";
  loading: boolean;
}

const aggregatedState: AppState = {
  get user() {
    return authState.user;
  },
  set user(v: string | null) {
    authState.user = v;
  },
  get session() {
    return authState.session;
  },
  set session(v: string | null) {
    authState.session = v;
  },
  get name() {
    return authState.name;
  },
  set name(v: string) {
    authState.name = v;
  },
  get contact() {
    return authState.contact;
  },
  set contact(v: string) {
    authState.contact = v;
  },
  get currentPage() {
    return uiState.currentPage;
  },
  set currentPage(v: Page) {
    uiState.currentPage = v;
  },
  get listings() {
    return marketplaceState.listings;
  },
  set listings(v: ListingItem[]) {
    marketplaceState.listings = v;
  },
  get notifications() {
    return notificationsState.notifications;
  },
  set notifications(v: NotificationItem[]) {
    notificationsState.notifications = v;
  },
  get notificationsMenuOpen() {
    return notificationsState.notificationsMenuOpen;
  },
  set notificationsMenuOpen(v: boolean) {
    notificationsState.notificationsMenuOpen = v;
  },
  get statusMessage() {
    return uiState.statusMessage;
  },
  set statusMessage(v: string | null) {
    uiState.statusMessage = v;
  },
  get statusType() {
    return uiState.statusType;
  },
  set statusType(v: "success" | "error" | "info") {
    uiState.statusType = v;
  },
  get loading() {
    return uiState.loading;
  },
  set loading(v: boolean) {
    uiState.loading = v;
  },
};

export const store = {
  state: aggregatedState,

  setPage,
  setStatus,
  setLoading,

  toggleNotificationsMenu,
  closeNotificationsMenu,

  loadProfile,
  updateProfile,

  login,
  loginAsAlice,
  loginAsBob,
  loginWithPetrock,
  logout,

  loadNotifications(silent = false) {
    return loadNotifications(authState.session, silent);
  },

  dismissNotification(notification: string) {
    return dismissNotification(authState.session, notification);
  },

  loadFeed(silent = false) {
    return loadFeed(authState.session, silent);
  },

  createListing(item: string, startPrice: number, increment: number, buyout: number | null) {
    return createListing(authState.session, item, startPrice, increment, buyout);
  },

  submitBid(auction: string, item: string, amount: number) {
    return submitBid(authState.session, auction, item, amount, async () => {
      await loadNotifications(authState.session, true);
    });
  },

  closeAuction(auction: string, item: string) {
    return closeAuction(authState.session, auction, item, async () => {
      await loadNotifications(authState.session, true);
    });
  },

  cancelAuction(auction: string, item: string) {
    return cancelAuction(authState.session, auction, item);
  },

  async init(): Promise<void> {
    const resolvePageFromHash = (): Page => {
      const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#\/?/, "") : "";
      if (hash === "create" || hash === "inbox" || hash === "profile" || hash === "account") {
        return hash;
      }
      return "marketplace";
    };

    uiState.currentPage = resolvePageFromHash();

    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", () => {
        uiState.currentPage = resolvePageFromHash();
      });

      // Dismiss notification dropdown on click outside
      window.addEventListener("click", (e) => {
        if (notificationsState.notificationsMenuOpen) {
          const target = e.target as HTMLElement;
          if (!target.closest(".notifications-menu-wrapper")) {
            closeNotificationsMenu();
          }
        }
      });
    }

    // 3s background polling to keep feed and notifications fresh
    setInterval(() => {
      if (authState.session && !uiState.loading) {
        loadNotifications(authState.session, true);
        loadFeed(authState.session, true);
      }
    }, 3000);

    // Check if session exists in localStorage
    if (typeof window !== "undefined") {
      const savedSession = localStorage.getItem("beaverbazaar_session");
      const savedUser = localStorage.getItem("beaverbazaar_user");

      if (savedSession && savedUser) {
        try {
          const check = await client["/auth/me"]({ session: savedSession });
          if (!("error" in check) && check.user) {
            authState.session = savedSession;
            authState.user = check.user;
            await loadProfile();
            await loadNotifications(savedSession);
            await loadFeed(savedSession, true);
            return;
          }
        } catch {
          // If session expired or invalid, clear localStorage
        }
        localStorage.removeItem("beaverbazaar_session");
        localStorage.removeItem("beaverbazaar_user");
      }
    }
  },
};
