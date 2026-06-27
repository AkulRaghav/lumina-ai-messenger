import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { prisma } from "../db";
import { validateSession } from "../auth";

const SESSION_COOKIE = "lumina_session";

/** Get the authenticated user or throw */
async function requireUser() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Not authenticated");
  const session = await validateSession(token);
  if (!session) throw new Error("Session expired");
  return session.user;
}

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    bio: user.bio ?? null,
    status: user.status ?? null,
    avatarUrl: user.avatarUrl ?? null,
    interests: user.interests ? JSON.parse(user.interests) : [],
  };
});

export const updateProfile = createServerFn({ method: "POST" })
  .validator(
    (data: {
      fullName?: string;
      username?: string;
      bio?: string;
      status?: string;
      avatarUrl?: string;
      interests?: string[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireUser();

    // If username is being changed, check uniqueness
    if (data.username && data.username !== user.username) {
      const existing = await prisma.user.findUnique({ where: { username: data.username } });
      if (existing) throw new Error("Username already taken");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.interests !== undefined && { interests: JSON.stringify(data.interests) }),
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      fullName: updated.fullName,
      bio: updated.bio,
      status: updated.status,
      avatarUrl: updated.avatarUrl,
      interests: updated.interests ? JSON.parse(updated.interests) : [],
    };
  });
