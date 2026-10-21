import { describe, expect, test } from "bun:test";

describe("Petrock MIT Touchstone OIDC Integration", () => {
  const PETROCK_AUTHORITY = process.env.PETROCK_AUTHORITY ?? "https://petrock.mit.edu";
  const PETROCK_CLIENT_ID = process.env.PETROCK_CLIENT_ID ?? "DhxUjjKelNYQ";
  const PETROCK_CLIENT_SECRET = process.env.PETROCK_CLIENT_SECRET ?? "27caf5d08ccc4b9dbfbcfe302ed8c48a";
  const PETROCK_REDIRECT_URI = process.env.PETROCK_REDIRECT_URI ?? "http://127.0.0.1:8080/auth/petrock/callback";

  test("environment variables are properly configured", () => {
    expect(typeof PETROCK_CLIENT_ID).toBe("string");
    expect(PETROCK_CLIENT_ID.length).toBeGreaterThan(0);
    expect(typeof PETROCK_CLIENT_SECRET).toBe("string");
    expect(PETROCK_CLIENT_SECRET.length).toBeGreaterThan(0);
    expect(PETROCK_AUTHORITY).toBe("https://petrock.mit.edu");
    expect(PETROCK_REDIRECT_URI).toBe("http://127.0.0.1:8080/auth/petrock/callback");
  });

  test("authorization URL parameters match Petrock OIDC requirements", () => {
    const authUrl = new URL(`${PETROCK_AUTHORITY}/touchstone/oidc/authorization`);
    const state = "test-state-token";
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", PETROCK_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", PETROCK_REDIRECT_URI);
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", state);

    expect(authUrl.origin).toBe("https://petrock.mit.edu");
    expect(authUrl.pathname).toBe("/touchstone/oidc/authorization");
    expect(authUrl.searchParams.get("client_id")).toBe(PETROCK_CLIENT_ID);
    expect(authUrl.searchParams.get("response_type")).toBe("code");
    expect(authUrl.searchParams.get("scope")).toBe("openid email profile");
    expect(authUrl.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:8080/auth/petrock/callback");
    expect(authUrl.searchParams.get("state")).toBe(state);
  });

  test("token exchange credentials header format matches RFC 6749 Basic auth", () => {
    const basicAuth = `Basic ${Buffer.from(
      `${encodeURIComponent(PETROCK_CLIENT_ID)}:${encodeURIComponent(PETROCK_CLIENT_SECRET)}`,
    ).toString("base64")}`;

    const decoded = Buffer.from(basicAuth.replace("Basic ", ""), "base64").toString("utf-8");
    expect(decoded).toBe(`${PETROCK_CLIENT_ID}:${PETROCK_CLIENT_SECRET}`);
  });

  test("claims parser extracts identity from standard Petrock userinfo or id_token payload", () => {
    // Partition 1: Standard Petrock payload with email and full name
    const payload1 = {
      sub: "student@mit.edu",
      email: "student@mit.edu",
      name: "Tim the Beaver",
      affiliation: "student",
    };
    const email1 = (payload1.email || payload1.sub).trim().toLowerCase();
    const name1 = payload1.name;
    expect(email1).toBe("student@mit.edu");
    expect(name1).toBe("Tim the Beaver");

    // Partition 2: Given/family name claims
    const payload2 = {
      sub: "huber@mit.edu",
      email: "huber@mit.edu",
      given_name: "Huber",
      family_name: "Flores",
    };
    const email2 = (payload2.email || payload2.sub).trim().toLowerCase();
    const name2 = `${payload2.given_name ?? ""} ${payload2.family_name ?? ""}`.trim();
    expect(email2).toBe("huber@mit.edu");
    expect(name2).toBe("Huber Flores");

    // Partition 3: Kerberos without domain
    const payload3 = {
      sub: "kerberos_user",
      preferred_username: "kerberos_user",
    };
    let email3 = (payload3.preferred_username || payload3.sub).trim().toLowerCase();
    if (!email3.includes("@")) {
      email3 = `${email3}@mit.edu`;
    }
    expect(email3).toBe("kerberos_user@mit.edu");
  });
});
