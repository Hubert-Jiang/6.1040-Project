import { reactive } from "vue";
import { client, PRESETS } from "../api.ts";
import { setStatus, setLoading } from "./ui.ts";
import { loadNotifications, clearNotifications } from "./notifications.ts";
import { loadSettlements, clearSettlements } from "./settlements.ts";
import { loadFeed, clearMarketplace } from "./marketplace.ts";

export interface AuthState {
  user: string | null;
  session: string | null;
  name: string;
  contact: string;
}

export const authState = reactive<AuthState>({
  user: null,
  session: null,
  name: "",
  contact: "",
});

export async function loadProfile(): Promise<void> {
  if (!authState.session) {
    authState.name = "";
    authState.contact = "";
    return;
  }

  try {
    const res = await client["/profile/get"]({ session: authState.session });
    if (!("error" in res) && res.profile) {
      authState.name = res.profile.name;
      authState.contact = res.profile.contact;
      return;
    }
  } catch (err) {
    console.warn("Could not query active profile:", err);
  }

  const preset = PRESETS.find((p) => p.username === authState.user);
  if (preset) {
    authState.name = preset.defaultName;
    authState.contact = preset.defaultContact;
  } else {
    authState.name = "";
    authState.contact = "";
  }
}

export async function updateProfile(name: string, contact: string): Promise<void> {
  if (!authState.session) {
    setStatus("Please sign in first.", "error");
    return;
  }
  if (!name.trim() || !contact.trim()) {
    setStatus("Please provide both name and contact method.", "error");
    return;
  }
  if (name.trim().length > 60) {
    setStatus("Name cannot exceed 60 characters.", "error");
    return;
  }
  if (contact.trim().length > 80) {
    setStatus("Contact method cannot exceed 80 characters.", "error");
    return;
  }

  setLoading(true);
  try {
    const res = await client["/profile/update"]({
      session: authState.session,
      name: name.trim(),
      contact: contact.trim(),
    });

    if ("error" in res) {
      setStatus(`Failed to update profile: ${String(res.error)}`, "error");
      return;
    }

    authState.name = name.trim();
    authState.contact = contact.trim();
    setStatus("Contact profile updated successfully! Private settlement details saved.", "success");
  } catch (err) {
    setStatus(`Error updating profile: ${String(err)}`, "error");
  } finally {
    setLoading(false);
  }
}

export async function login(username: string): Promise<void> {
  if (!username.trim()) return;
  if (username.trim().length > 100) {
    setStatus("Username cannot exceed 100 characters.", "error");
    return;
  }
  setLoading(true);
  setStatus(`Signing in as ${username}...`, "info");

  try {
    const res = await client["/auth/login"]({ username: username.trim() });
    if ("error" in res) {
      setStatus(`Sign-in failed: ${String(res.error)}`, "error");
      return;
    }

    authState.user = username.trim();
    authState.session = res.session;

    if (typeof window !== "undefined") {
      localStorage.setItem("beaverbazaar_session", res.session);
      localStorage.setItem("beaverbazaar_user", authState.user);
    }

    await loadProfile();
    await loadNotifications(res.session);
    await loadSettlements(res.session);
    setStatus(`Signed in as ${authState.user}`, "success");
    await loadFeed(res.session);
  } catch (err) {
    setStatus(`Network error signing in: ${String(err)}`, "error");
  } finally {
    setLoading(false);
  }
}

export async function loginAsAlice(): Promise<void> {
  setLoading(true);
  setStatus("Signing in as Alice (alice@mit.edu)...", "info");
  try {
    const res = await client["/auth/login"]({ username: "alice@mit.edu" });
    if ("error" in res) {
      setStatus(`Sign-in failed: ${String(res.error)}`, "error");
      return;
    }
    authState.user = "alice@mit.edu";
    authState.session = res.session;

    if (typeof window !== "undefined") {
      localStorage.setItem("beaverbazaar_session", res.session);
      localStorage.setItem("beaverbazaar_user", "alice@mit.edu");
    }

    // Initialize Alice profile
    try {
      await client["/profile/update"]({
        session: res.session,
        name: "Alice Doe",
        contact: "617-555-0101",
      });
    } catch {
      // ignore profile update error if already set
    }

    await loadProfile();
    await loadNotifications(res.session);
    await loadSettlements(res.session);
    setStatus("Signed in as Alice (alice@mit.edu)", "success");
    await loadFeed(res.session);
  } catch (err) {
    setStatus(`Error signing in as Alice: ${String(err)}`, "error");
  } finally {
    setLoading(false);
  }
}

export async function loginAsBob(): Promise<void> {
  setLoading(true);
  setStatus("Signing in as Bob (bob@mit.edu)...", "info");
  try {
    const res = await client["/auth/login"]({ username: "bob@mit.edu" });
    if ("error" in res) {
      setStatus(`Sign-in failed: ${String(res.error)}`, "error");
      return;
    }
    authState.user = "bob@mit.edu";
    authState.session = res.session;

    if (typeof window !== "undefined") {
      localStorage.setItem("beaverbazaar_session", res.session);
      localStorage.setItem("beaverbazaar_user", "bob@mit.edu");
    }

    // Initialize Bob profile
    try {
      await client["/profile/update"]({
        session: res.session,
        name: "Bob Smith",
        contact: "bob@mit.edu",
      });
    } catch {
      // ignore profile update error if already set
    }

    await loadProfile();
    await loadNotifications(res.session);
    await loadSettlements(res.session);
    setStatus("Signed in as Bob (bob@mit.edu)", "success");
    await loadFeed(res.session);
  } catch (err) {
    setStatus(`Error signing in as Bob: ${String(err)}`, "error");
  } finally {
    setLoading(false);
  }
}

export async function loginWithPetrock(): Promise<void> {
  try {
    const cfgRes = await fetch("/auth/petrock/config");
    const cfg = await cfgRes.json();
    if (cfg.configured) {
      window.location.href = "/auth/petrock/login";
    } else {
      setStatus(
        "Petrock OIDC credentials not configured on server (PETROCK_CLIENT_ID). Please use 'Quick Test: Log In as Bob' or enter your Kerberos email below.",
        "info",
      );
    }
  } catch (err) {
    setStatus(`Error checking Petrock OIDC: ${String(err)}`, "error");
  }
}

export async function logout(): Promise<void> {
  if (authState.session) {
    try {
      await client["/auth/logout"]({ session: authState.session });
    } catch {
      // Ignore logout transport errors
    }
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("beaverbazaar_session");
    localStorage.removeItem("beaverbazaar_user");
  }
  authState.user = null;
  authState.session = null;
  authState.name = "";
  authState.contact = "";
  clearNotifications();
  clearSettlements();
  clearMarketplace();
  setStatus("Signed out successfully. Touchstone session closed.", "info");
}

export function useAuthStore() {
  return {
    state: authState,
    loadProfile,
    updateProfile,
    login,
    loginAsAlice,
    loginAsBob,
    loginWithPetrock,
    logout,
  };
}
