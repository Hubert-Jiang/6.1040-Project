import { reactive } from "vue";
import { client, type SettlementItem } from "../api.ts";

export interface SettlementsState {
  settlements: SettlementItem[];
  loading: boolean;
}

export const settlementsState = reactive<SettlementsState>({
  settlements: [],
  loading: false,
});

export async function loadSettlements(session: string | null, silent = false): Promise<void> {
  if (!session) {
    settlementsState.settlements = [];
    return;
  }

  settlementsState.loading = true;
  try {
    const res = await client["/settlements/list"]({ session });
    if (!("error" in res) && res.settlements) {
      settlementsState.settlements = res.settlements.settlements;
    }
  } catch (err) {
    if (!silent) console.warn("Could not query settlements:", err);
  } finally {
    settlementsState.loading = false;
  }
}

export function clearSettlements(): void {
  settlementsState.settlements = [];
  settlementsState.loading = false;
}

export function useSettlementsStore() {
  return {
    state: settlementsState,
    loadSettlements,
    clearSettlements,
  };
}
