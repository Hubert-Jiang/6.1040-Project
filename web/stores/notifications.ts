import { reactive } from "vue";
import { client, type NotificationItem } from "../api.ts";
import { setStatus } from "./ui.ts";

export interface NotificationsState {
  notifications: NotificationItem[];
  notificationsMenuOpen: boolean;
}

export const notificationsState = reactive<NotificationsState>({
  notifications: [],
  notificationsMenuOpen: false,
});

export function toggleNotificationsMenu(): void {
  notificationsState.notificationsMenuOpen = !notificationsState.notificationsMenuOpen;
}

export function closeNotificationsMenu(): void {
  notificationsState.notificationsMenuOpen = false;
}

export async function loadNotifications(session: string | null, silent = false): Promise<void> {
  if (!session) {
    notificationsState.notifications = [];
    return;
  }

  try {
    const res = await client["/notifications/list"]({ session });
    if (!("error" in res) && res.notifications) {
      notificationsState.notifications = res.notifications.notifications;
    }
  } catch (err) {
    if (!silent) console.warn("Could not query notifications:", err);
  }
}

export async function dismissNotification(session: string | null, notification: string): Promise<void> {
  if (!session) return;
  try {
    const res = await client["/notifications/dismiss"]({
      session,
      notification,
    });
    if ("error" in res) {
      setStatus(`Failed to dismiss notification: ${String(res.error)}`, "error");
      return;
    }
    setStatus("Notification dismissed.", "info");
    await loadNotifications(session);
  } catch (err) {
    setStatus(`Error dismissing notification: ${String(err)}`, "error");
  }
}

export function clearNotifications(): void {
  notificationsState.notifications = [];
  notificationsState.notificationsMenuOpen = false;
}

export function useNotificationsStore() {
  return {
    state: notificationsState,
    loadNotifications,
    dismissNotification,
    toggleNotificationsMenu,
    closeNotificationsMenu,
    clearNotifications,
  };
}
