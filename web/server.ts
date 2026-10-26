import homepage from "./index.html";

const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";

// Pass API requests and health checks on to the backend.
function proxy(request: Request) {
  const url = new URL(request.url);
  return fetch(new URL(url.pathname + url.search, backend), request).catch(
    () => Response.json({ error: "UNAVAILABLE" }, { status: 503 }),
  );
}

const PETROCK_AUTHORITY = process.env.PETROCK_AUTHORITY ?? "https://petrock.mit.edu";
const PETROCK_CLIENT_ID = process.env.PETROCK_CLIENT_ID ?? "";
const PETROCK_CLIENT_SECRET = process.env.PETROCK_CLIENT_SECRET ?? "";
const PETROCK_REDIRECT_URI = process.env.PETROCK_REDIRECT_URI ?? "http://127.0.0.1:8080/auth/petrock/callback";

// Helper to parse cookies from request
function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [k, ...v] = pair.trim().split("=");
    if (k) cookies[k] = decodeURIComponent(v.join("="));
  }
  return cookies;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' http: https:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
};

function htmlResponse(html: string, extraHeaders?: HeadersInit): Response {
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    ...SECURITY_HEADERS,
    ...extraHeaders,
  });
  return new Response(html, { headers });
}

// Petrock OIDC Login handler
async function handlePetrockLogin(request: Request): Promise<Response> {
  const state = crypto.randomUUID();

  if (!PETROCK_CLIENT_ID) {
    return Response.json(
      {
        configured: false,
        message: "Petrock client ID not configured. Please set PETROCK_CLIENT_ID in your environment.",
      },
      { status: 400 },
    );
  }

  const authUrl = new URL(`${PETROCK_AUTHORITY}/touchstone/oidc/authorization`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", PETROCK_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", PETROCK_REDIRECT_URI);
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);

  const headers = new Headers();
  headers.set("Location", authUrl.toString());
  headers.set("Set-Cookie", `petrock_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  return new Response(null, { status: 302, headers });
}

// Petrock OIDC Callback handler
async function handlePetrockCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const cookies = parseCookies(request);
  const expectedState = cookies.petrock_state;

  if (error) {
    const safeError = escapeHtml(error);
    const safeDesc = errorDescription ? escapeHtml(errorDescription) : "";
    return htmlResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Touchstone Authentication Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fdfbf7; color: #3c2a18; }
    .card { background: white; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 480px; width: 100%; border: 1px solid #ebd9c3; }
    h2 { color: #8b1e1e; margin-top: 0; }
    p { line-height: 1.5; color: #5a4635; }
    .btn { display: inline-block; background: #8b1e1e; color: white; padding: 0.65rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Authentication Error</h2>
    <p>MIT Touchstone reported an authorization issue: <strong>${safeError}</strong></p>
    ${safeDesc ? `<p style="font-size:0.9rem; color:#766555;">${safeDesc}</p>` : ""}
    <a href="/" class="btn">Return to BeaverBazaar</a>
  </div>
</body>
</html>`,
    );
  }

  if (expectedState && state && expectedState !== state) {
    console.warn("Petrock state mismatch: expected", expectedState, "got", state);
  }

  if (!code) {
    return htmlResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Missing Authorization Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fdfbf7; color: #3c2a18; }
    .card { background: white; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 480px; width: 100%; border: 1px solid #ebd9c3; }
    h2 { color: #8b1e1e; margin-top: 0; }
    .btn { display: inline-block; background: #8b1e1e; color: white; padding: 0.65rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Missing Authorization Code</h2>
    <p>The callback request did not contain an authorization code from Touchstone.</p>
    <a href="/" class="btn">Return to BeaverBazaar</a>
  </div>
</body>
</html>`,
    );
  }

  try {
    // 1. Exchange code at Petrock token endpoint
    // Standard RFC 6749 Section 2.3.1: Use HTTP Basic Auth for client credentials;
    // do not duplicate client_id in the body when using Basic auth to prevent SATOSA/oauthlib errors.
    let tokenRes = await fetch(`${PETROCK_AUTHORITY}/oidc/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(PETROCK_CLIENT_SECRET
          ? {
              Authorization: `Basic ${Buffer.from(
                `${encodeURIComponent(PETROCK_CLIENT_ID)}:${encodeURIComponent(PETROCK_CLIENT_SECRET)}`,
              ).toString("base64")}`,
            }
          : {}),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: PETROCK_REDIRECT_URI,
        ...(!PETROCK_CLIENT_SECRET ? { client_id: PETROCK_CLIENT_ID } : {}),
      }),
    });

    // Fallback to client_secret_post if Basic Auth receives 401
    if (!tokenRes.ok && PETROCK_CLIENT_SECRET && tokenRes.status === 401) {
      tokenRes = await fetch(`${PETROCK_AUTHORITY}/oidc/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: PETROCK_REDIRECT_URI,
          client_id: PETROCK_CLIENT_ID,
          client_secret: PETROCK_CLIENT_SECRET,
        }),
      });
    }

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      const safeErrText = escapeHtml(errText);
      return htmlResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Token Exchange Failed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fdfbf7; color: #3c2a18; }
    .card { background: white; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 520px; width: 100%; border: 1px solid #ebd9c3; }
    h2 { color: #8b1e1e; margin-top: 0; }
    pre { background: #f5ede2; padding: 1rem; border-radius: 8px; font-size: 0.85rem; overflow-x: auto; }
    .btn { display: inline-block; background: #8b1e1e; color: white; padding: 0.65rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Touchstone Token Exchange Failed</h2>
    <p>Petrock rejected the authorization code exchange (Status ${tokenRes.status}):</p>
    <pre>${safeErrText}</pre>
    <a href="/" class="btn">Return to BeaverBazaar</a>
  </div>
</body>
</html>`,
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Extract identity claims from id_token and/or UserInfo endpoint
    let email = "";
    let name = "";

    // 2a. Decode id_token JWT payload if present
    if (tokenData.id_token && typeof tokenData.id_token === "string") {
      try {
        const parts = tokenData.id_token.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          if (payload.email) email = payload.email;
          else if (payload.sub) email = payload.sub;
          if (payload.name) name = payload.name;
          else if (payload.given_name || payload.family_name) {
            name = `${payload.given_name ?? ""} ${payload.family_name ?? ""}`.trim();
          }
        }
      } catch (jwtErr) {
        console.warn("Failed to decode id_token:", jwtErr);
      }
    }

    // 2b. Query UserInfo endpoint if access_token is present
    if (accessToken) {
      try {
        const userRes = await fetch(`${PETROCK_AUTHORITY}/oidc/userinfo`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (userRes.ok) {
          const userInfo = await userRes.json();
          if (userInfo.email) email = userInfo.email;
          else if (!email && userInfo.preferred_username) email = userInfo.preferred_username;
          else if (!email && userInfo.sub) email = userInfo.sub;

          if (userInfo.name) {
            name = userInfo.name;
          } else if (userInfo.given_name || userInfo.family_name) {
            name = `${userInfo.given_name ?? ""} ${userInfo.family_name ?? ""}`.trim();
          }
        }
      } catch (uiErr) {
        console.warn("UserInfo endpoint fetch failed:", uiErr);
      }
    }

    email = email.trim().toLowerCase();
    if (email && !email.includes("@")) {
      email = `${email}@mit.edu`;
    }

    if (!email) {
      return htmlResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Identity Extraction Failed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fdfbf7; color: #3c2a18; }
    .card { background: white; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 480px; width: 100%; border: 1px solid #ebd9c3; }
    h2 { color: #8b1e1e; margin-top: 0; }
    .btn { display: inline-block; background: #8b1e1e; color: white; padding: 0.65rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Identity Extraction Failed</h2>
    <p>Could not extract a verified Kerberos email or subject identity from the Touchstone response.</p>
    <a href="/" class="btn">Return to BeaverBazaar</a>
  </div>
</body>
</html>`,
      );
    }

    if (!name) {
      name = email.split("@")[0];
    }

    // 3. Create active session in backend
    const sessionRes = await fetch(`${backend}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email }),
    });

    if (!sessionRes.ok) {
      const safeEmail = escapeHtml(email);
      return htmlResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Session Creation Failed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fdfbf7; color: #3c2a18; }
    .card { background: white; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 480px; width: 100%; border: 1px solid #ebd9c3; }
    h2 { color: #8b1e1e; margin-top: 0; }
    .btn { display: inline-block; background: #8b1e1e; color: white; padding: 0.65rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Session Creation Failed</h2>
    <p>Could not establish an active session in the BeaverBazaar backend for <strong>${safeEmail}</strong>.</p>
    <a href="/" class="btn">Return to BeaverBazaar</a>
  </div>
</body>
</html>`,
      );
    }

    const sessionData = await sessionRes.json();

    // 4. Initialize profile if user does not already have one
    try {
      const getProfileRes = await fetch(`${backend}/api/profile/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionData.session }),
      });
      const profileData = await getProfileRes.json();
      if (!profileData?.profile?.name || !profileData?.profile?.contact) {
        await fetch(`${backend}/api/profile/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session: sessionData.session,
            name: name || email.split("@")[0],
            contact: email,
          }),
        });
      }
    } catch {
      // Profile initialization is non-blocking
    }

    // 5. Return success page that populates localStorage and redirects into app
    const safeEmail = escapeHtml(email);
    const clearCookieHeader = "petrock_state=; Path=/; HttpOnly; Max-Age=0";
    return htmlResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Touchstone Login Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #fdfbf7;
      color: #3c2a18;
    }
    .card {
      background: white;
      padding: 2.25rem 2.5rem;
      border-radius: 14px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      text-align: center;
      max-width: 400px;
      border: 1px solid #ebd9c3;
    }
    .spinner {
      margin: 1.25rem auto;
      width: 28px;
      height: 28px;
      border: 3px solid #ebd9c3;
      border-top-color: #8b1e1e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🦫</div>
    <h2 style="margin: 0.25rem 0 0.5rem; font-size: 1.4rem;">Touchstone Verified</h2>
    <p style="margin: 0.25rem 0; color: #5a4635;">Signed in as <strong>${safeEmail}</strong>.</p>
    <div class="spinner"></div>
    <p style="font-size: 0.85rem; color: #766555; margin-bottom: 0;">Redirecting to BeaverBazaar...</p>
  </div>
  <script>
    try {
      localStorage.setItem("beaverbazaar_session", ${JSON.stringify(sessionData.session)});
      localStorage.setItem("beaverbazaar_user", ${JSON.stringify(email)});
    } catch (e) {
      console.error("Failed to store session in localStorage:", e);
    }
    window.location.href = "/";
  </script>
</body>
</html>`,
      {
        "Set-Cookie": clearCookieHeader,
      },
    );
  } catch (err) {
    const safeErr = escapeHtml(String(err));
    return htmlResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Unexpected Authentication Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fdfbf7; color: #3c2a18; }
    .card { background: white; padding: 2.5rem; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 480px; width: 100%; border: 1px solid #ebd9c3; }
    h2 { color: #8b1e1e; margin-top: 0; }
    .btn { display: inline-block; background: #8b1e1e; color: white; padding: 0.65rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Unexpected Authentication Error</h2>
    <p>${safeErr}</p>
    <a href="/" class="btn">Return to BeaverBazaar</a>
  </div>
</body>
</html>`,
    );
  }
}

// Endpoint to inspect petrock configuration status for frontend
function getPetrockConfig() {
  return Response.json({
    configured: Boolean(PETROCK_CLIENT_ID && PETROCK_CLIENT_SECRET),
    clientId: PETROCK_CLIENT_ID ? `${PETROCK_CLIENT_ID.substring(0, 4)}...` : null,
    authority: PETROCK_AUTHORITY,
    redirectUri: PETROCK_REDIRECT_URI,
  });
}

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 8080),
  routes: {
    "/": homepage,
    "/api/*": proxy,
    "/health": proxy,
    "/auth/petrock/login": handlePetrockLogin,
    "/auth/petrock/callback": handlePetrockCallback,
    "/auth/petrock/config": getPetrockConfig,
  },
});

console.log(`Frontend listening on ${server.url}`);

