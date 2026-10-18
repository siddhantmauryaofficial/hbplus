import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookie from "cookie";
import express from "express";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import jwt from "jsonwebtoken";
import { saveUserProfile } from "./database.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const apiHost = process.env.API_HOST || "0.0.0.0";
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || (!isProduction ? crypto.randomBytes(32).toString("hex") : "");
const allowedDomain = (process.env.ALLOWED_DOMAIN || "hbplus.fit").toLowerCase();
const skipEmailDomainCheck = !isProduction
  && process.env.SKIP_EMAIL_DOMAIN_CHECK?.trim().toLowerCase() === "true";
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "auth-hbplus";
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const cookieName = "hbplus_session";
const sessionDuration = 8 * 60 * 60 * 1000;
const issuer = "hbplus-access";
const audience = "hbplus-web";
const webOrigins = new Set(
  (process.env.WEB_ORIGINS || "http://localhost:8081,http://127.0.0.1:8081")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

if (isProduction && sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters.");
}

let firebaseAdminAuth;
const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

function isAllowedEmail(email) {
  return skipEmailDomainCheck || email.split("@").at(-1) === allowedDomain;
}

app.disable("x-powered-by");
app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (origin && webOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});
app.use(express.json({ limit: "16kb" }));

function signInSession(profile) {
  const token = jwt.sign(
    {
      email: profile.email,
      name: profile.name || "",
      picture: profile.picture || "",
      role: "user",
    },
    sessionSecret,
    {
      algorithm: "HS256",
      subject: profile.sub,
      expiresIn: "8h",
      issuer,
      audience,
    },
  );

  return token;
}

function getFirebaseAdminAuth() {
  if (firebaseAdminAuth) return firebaseAdminAuth;

  let credential;
  if (serviceAccountJson) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch {
      const error = new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.");
      error.code = "app/invalid-credential";
      throw error;
    }
    if (serviceAccount.project_id !== firebaseProjectId) {
      const error = new Error("Firebase service account project_id does not match FIREBASE_PROJECT_ID.");
      error.code = "app/invalid-credential";
      throw error;
    }
    credential = cert(serviceAccount);
  } else {
    credential = applicationDefault();
  }

  const adminApp = getApps().find((item) => item.name === "hbplus-access")
    || initializeApp({ credential, projectId: firebaseProjectId }, "hbplus-access");
  firebaseAdminAuth = getAuth(adminApp);
  return firebaseAdminAuth;
}

function requireSession(req, res, next) {
  const bearer = req.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearer || cookie.parse(req.headers.cookie || "")[cookieName];
  if (!token) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  try {
    const session = jwt.verify(token, sessionSecret, {
      algorithms: ["HS256"],
      issuer,
      audience,
    });
    if (typeof session.email !== "string" || !isAllowedEmail(session.email.toLowerCase())) {
      res.clearCookie(cookieName, sessionCookieOptions);
      return res.status(401).json({
        error: "Access restricted. Please login using your official domain email.",
      });
    }
    req.user = {
      id: session.sub,
      email: session.email,
      name: session.name,
      picture: session.picture,
      role: session.role,
    };
    return next();
  } catch (error) {
    if (!(error instanceof jwt.JsonWebTokenError) && !(error instanceof jwt.TokenExpiredError)) {
      return next(error);
    }
    res.clearCookie(cookieName, sessionCookieOptions);
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

app.post("/api/auth/firebase", async (req, res, next) => {
  if (!isProduction && !serviceAccountJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return res.status(503).json({
      error: "Firebase Admin credentials are not configured. Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON file.",
    });
  }

  const { idToken, clientType = "web" } = req.body || {};
  if (typeof idToken !== "string" || !idToken) {
    return res.status(400).json({ error: "A Firebase ID token is required." });
  }
  if (clientType !== "web" && clientType !== "native") {
    return res.status(400).json({ error: "clientType must be either web or native." });
  }

  let profile;
  try {
    profile = await getFirebaseAdminAuth().verifyIdToken(idToken);
  } catch (error) {
    if (error.code === "app/invalid-credential") {
      console.error("Firebase Admin credentials are invalid:", error.message);
      return res.status(503).json({ error: "Firebase Admin credentials are invalid. Check the server configuration." });
    }
    if (["auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired", "auth/id-token-revoked"].includes(error.code)) {
      return res.status(401).json({ error: "Firebase sign-in could not be verified. Please sign in again." });
    }
    return next(error);
  }

  const email = profile?.email?.toLowerCase();
  if (!profile?.uid || !email || profile.email_verified !== true || profile.firebase?.sign_in_provider !== "google.com") {
    return res.status(401).json({ error: "Google could not verify this email address." });
  }
  // The bypass is only honored outside production for local dashboard testing.
  if (!isAllowedEmail(email)) {
    return res.status(403).json({
      error: "Access restricted. Please login using your official domain email.",
    });
  }

  let user;
  try {
    user = await saveUserProfile({
      uid: profile.uid,
      email,
      name: profile.name || "",
      picture: profile.picture || "",
      emailVerified: profile.email_verified,
    });
  } catch (error) {
    console.error("MongoDB profile persistence failed:", error.code || error.name);
    const notConfigured = error.code === "app/mongodb-not-configured";
    const authenticationFailed = error.code === 8000 || error.codeName === "AtlasError";
    return res.status(503).json({
      error: notConfigured
        ? "MongoDB Atlas is not configured. Set MONGODB_URI in the server environment."
        : authenticationFailed
          ? "MongoDB Atlas rejected the database credentials. Check the database user in Atlas Database Access and update MONGODB_URI. URL-encode any special characters in the password."
        : "Your profile could not be saved. Check the MongoDB Atlas connection and try again.",
    });
  }

  try {
    const sessionToken = signInSession({ ...profile, sub: profile.uid, email, role: user.role });
    if (clientType === "web") {
      res.cookie(cookieName, sessionToken, {
        ...sessionCookieOptions,
        maxAge: sessionDuration,
      });
    }
    return res.json({
      user: {
        email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
      ...(clientType === "native" ? { sessionToken } : {}),
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/auth/me", requireSession, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(cookieName, sessionCookieOptions);
  res.status(204).end();
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found." });
});

const distDir = path.join(rootDir, "dist");
app.use(express.static(distDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"), (error) => {
    if (error) {
      res.status(404).send("App not built. Run npm run build first.");
    }
  });
});

app.use((error, _req, res, _next) => {
  console.error("Request failed:", error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(port, () => {
  console.log(`HB+ Access server listening on http://0.0.0.0:${port}`);
  console.log(
    skipEmailDomainCheck
      ? "Email domain restriction is disabled for local testing."
      : `Email domain restriction is enforced for @${allowedDomain}.`,
  );
});
