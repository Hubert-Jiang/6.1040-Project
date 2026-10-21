import { reactive } from "vue";

export type Page = "marketplace" | "create" | "inbox" | "profile" | "account";

export interface UIState {
  currentPage: Page;
  statusMessage: string | null;
  statusType: "success" | "error" | "info";
  loading: boolean;
}

export const uiState = reactive<UIState>({
  currentPage: "marketplace",
  statusMessage: null,
  statusType: "info",
  loading: false,
});

export function setPage(page: Page): void {
  uiState.currentPage = page;
  const targetHash = page === "marketplace" ? "#/" : `#/${page}`;
  if (
    typeof window !== "undefined" &&
    window.location.hash !== targetHash &&
    !(page === "marketplace" && (!window.location.hash || window.location.hash === "#" || window.location.hash === "#/"))
  ) {
    window.location.hash = targetHash;
  }
}

export function setStatus(message: string | null, type: "success" | "error" | "info" = "info"): void {
  uiState.statusMessage = message;
  uiState.statusType = type;
  if (message && typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function setLoading(loading: boolean): void {
  uiState.loading = loading;
}

export function useUIStore() {
  return {
    state: uiState,
    setPage,
    setStatus,
    setLoading,
  };
}
