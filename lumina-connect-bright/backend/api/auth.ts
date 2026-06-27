import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { prisma } from "../db";
import { hashPassword, verifyPassword, createSession, validateSession, deleteSession } from "../auth";

const SESSION_COOKIE = "lumina_session";

export const register = createServerFn({ method: "POST" })
  .validator(
    (data: { email: string; username: string; fullName: string; password: string; phone?: string }) => {
      if (!data.email || !data.username || !data.fullName || !data.password) {
        throw new Error("All fields are required");
      }
      if (data.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) {
      throw new Error("A user with that email or username already exists");
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        passwordHash,
        phone: data.phone,
      },
    });

    // Auto-login after register
    const { token, expiresAt } = await createSession(user.id);
    setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return { id: user.id, email: user.email, username: user.username, fullName: user.fullName };
  });

export const login = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const { token, expiresAt } = await createSession(user.id);
    setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return { id: user.id, email: user.email, username: user.username, fullName: user.fullName };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    await deleteSession(token);
    deleteCookie(SESSION_COOKIE);
  }
  return { ok: true };
});

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return { user: null };

  const session = await validateSession(token);
  if (!session) {
    deleteCookie(SESSION_COOKIE);
    return { user: null };
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      fullName: session.user.fullName,
    },
  };
});
