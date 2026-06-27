import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";

const SESSION_COOKIE = "lumina_session";

// Google OAuth config — set these in your environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:5173/api/auth/google/callback";

/** Get Google OAuth URL to redirect the user to */
export const getGoogleAuthUrl = createServerFn({ method: "GET" }).handler(async () => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth not configured. Set GOOGLE_CLIENT_ID environment variable.");
  }

  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    state,
  };
});

/** Exchange Google OAuth code for user info and create session */
export const handleGoogleCallback = createServerFn({ method: "POST" })
  .validator((data: { code: string }) => {
    if (!data.code) throw new Error("Authorization code required");
    return data;
  })
  .handler(async ({ data }) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error("Google OAuth not configured");
    }

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: data.code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenRes.json() as { access_token: string; id_token: string };

    // Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      throw new Error("Failed to get user info from Google");
    }

    const googleUser = await userInfoRes.json() as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Import DB and auth lazily to avoid import-protection
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      // Find or create user
      let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

      if (!user) {
        // Create new user with Google info
        const username = googleUser.email.split("@")[0] + "_" + randomBytes(3).toString("hex");
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            username,
            fullName: googleUser.name,
            passwordHash: "oauth_google", // No password for OAuth users
            avatarUrl: googleUser.picture,
          },
        });
      }

      // Create session
      const { createSession } = await import("../auth");
      const { token, expiresAt } = await createSession(user.id);

      setCookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      });

      return { id: user.id, email: user.email, username: user.username, fullName: user.fullName };
    } finally {
      await prisma.$disconnect();
    }
  });
