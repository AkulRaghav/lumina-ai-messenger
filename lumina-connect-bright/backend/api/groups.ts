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

/** Create a new group conversation */
export const createGroup = createServerFn({ method: "POST" })
  .validator(
    (data: { name: string; memberIds: string[] }) => {
      if (!data.name) throw new Error("Group name required");
      if (!data.memberIds || data.memberIds.length === 0) throw new Error("At least one member required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const me = await requireUser();

    // Include the creator in participant list
    const allIds = Array.from(new Set([me.id, ...data.memberIds]));

    const group = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: data.name,
        participants: {
          create: allIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, username: true, avatarUrl: true } } },
        },
      },
    });

    return group;
  });

/** Get group details (participants, name) */
export const getGroupDetails = createServerFn({ method: "GET" })
  .validator((data: { conversationId: string }) => {
    if (!data.conversationId) throw new Error("conversationId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    const conv = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, username: true, avatarUrl: true, status: true } } },
        },
      },
    });

    if (!conv) throw new Error("Conversation not found");
    if (!conv.participants.some((p) => p.userId === me.id)) throw new Error("Not a member");

    return {
      id: conv.id,
      name: conv.name ?? "Group",
      isGroup: conv.isGroup,
      members: conv.participants.map((p) => ({
        id: p.user.id,
        fullName: p.user.fullName,
        username: p.user.username,
        avatarUrl: p.user.avatarUrl,
        status: p.user.status,
        isMe: p.userId === me.id,
      })),
      memberCount: conv.participants.length,
    };
  });

/** Add a member to a group */
export const addMember = createServerFn({ method: "POST" })
  .validator((data: { conversationId: string; userId: string }) => {
    if (!data.conversationId || !data.userId) throw new Error("conversationId and userId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    const conv = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: { participants: true },
    });
    if (!conv || !conv.isGroup) throw new Error("Group not found");
    if (!conv.participants.some((p) => p.userId === me.id)) throw new Error("Not a member");

    // Check if already a member
    if (conv.participants.some((p) => p.userId === data.userId)) {
      return { ok: true, alreadyMember: true };
    }

    await prisma.conversationParticipant.create({
      data: { conversationId: data.conversationId, userId: data.userId },
    });

    return { ok: true, alreadyMember: false };
  });

/** Remove a member from a group */
export const removeMember = createServerFn({ method: "POST" })
  .validator((data: { conversationId: string; userId: string }) => {
    if (!data.conversationId || !data.userId) throw new Error("conversationId and userId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    const conv = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: { participants: true },
    });
    if (!conv || !conv.isGroup) throw new Error("Group not found");
    if (!conv.participants.some((p) => p.userId === me.id)) throw new Error("Not a member");

    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: data.conversationId, userId: data.userId },
    });

    return { ok: true };
  });

/** Leave a group */
export const leaveGroup = createServerFn({ method: "POST" })
  .validator((data: { conversationId: string }) => {
    if (!data.conversationId) throw new Error("conversationId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: data.conversationId, userId: me.id },
    });

    return { ok: true };
  });

/** Rename a group */
export const renameGroup = createServerFn({ method: "POST" })
  .validator((data: { conversationId: string; name: string }) => {
    if (!data.conversationId || !data.name) throw new Error("conversationId and name required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    const conv = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: { participants: true },
    });
    if (!conv || !conv.isGroup) throw new Error("Group not found");
    if (!conv.participants.some((p) => p.userId === me.id)) throw new Error("Not a member");

    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { name: data.name },
    });

    return { ok: true };
  });
