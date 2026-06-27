import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { prisma } from "../db";
import { validateSession } from "../auth";

const SESSION_COOKIE = "lumina_session";

async function requireUser() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Not authenticated");
  const session = await validateSession(token);
  if (!session) throw new Error("Session expired");
  return session.user;
}

/** Create a community */
export const createCommunity = createServerFn({ method: "POST" })
  .validator(
    (data: { name: string; description?: string; isPublic?: boolean }) => {
      if (!data.name) throw new Error("Community name required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const me = await requireUser();

    const community = await prisma.community.create({
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic ?? true,
        createdById: me.id,
        memberCount: 1,
        members: {
          create: { userId: me.id, role: "admin" },
        },
      },
    });

    return community;
  });

/** List public communities (discover) */
export const listCommunities = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();

  const communities = await prisma.community.findMany({
    where: { isPublic: true },
    orderBy: { memberCount: "desc" },
    take: 30,
  });

  return communities;
});

/** Get communities the current user has joined */
export const myCommunities = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();

  const memberships = await prisma.communityMember.findMany({
    where: { userId: me.id },
    include: { community: true },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.community,
    role: m.role,
  }));
});

/** Join a community */
export const joinCommunity = createServerFn({ method: "POST" })
  .validator((data: { communityId: string }) => {
    if (!data.communityId) throw new Error("communityId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    const community = await prisma.community.findUnique({ where: { id: data.communityId } });
    if (!community) throw new Error("Community not found");

    // Upsert membership
    await prisma.communityMember.upsert({
      where: { communityId_userId: { communityId: data.communityId, userId: me.id } },
      create: { communityId: data.communityId, userId: me.id },
      update: {},
    });

    // Increment member count
    await prisma.community.update({
      where: { id: data.communityId },
      data: { memberCount: { increment: 1 } },
    });

    return { ok: true };
  });

/** Leave a community */
export const leaveCommunity = createServerFn({ method: "POST" })
  .validator((data: { communityId: string }) => {
    if (!data.communityId) throw new Error("communityId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: data.communityId, userId: me.id } },
    });
    if (!membership) return { ok: true };

    await prisma.communityMember.delete({
      where: { id: membership.id },
    });

    await prisma.community.update({
      where: { id: data.communityId },
      data: { memberCount: { decrement: 1 } },
    });

    return { ok: true };
  });

/** Get community details */
export const getCommunityDetails = createServerFn({ method: "GET" })
  .validator((data: { communityId: string }) => {
    if (!data.communityId) throw new Error("communityId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    const community = await prisma.community.findUnique({
      where: { id: data.communityId },
      include: {
        members: {
          include: { community: false },
          take: 20,
          orderBy: { joinedAt: "asc" },
        },
      },
    });
    if (!community) throw new Error("Community not found");

    const isMember = community.members.some((m) => m.userId === me.id);
    const myRole = community.members.find((m) => m.userId === me.id)?.role ?? null;

    return {
      ...community,
      isMember,
      myRole,
    };
  });
