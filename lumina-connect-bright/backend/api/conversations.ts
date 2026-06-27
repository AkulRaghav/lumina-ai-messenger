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

/** Get or create a 1:1 conversation between current user and another */
export const getOrCreateDM = createServerFn({ method: "POST" })
  .validator((data: { otherUserId: string }) => {
    if (!data.otherUserId) throw new Error("otherUserId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    // Find existing 1:1 conversation between these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: me.id } } },
          { participants: { some: { userId: data.otherUserId } } },
        ],
      },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, username: true, avatarUrl: true, status: true } } } },
      },
    });

    if (existing) return existing;

    // Create new conversation
    const conv = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: me.id },
            { userId: data.otherUserId },
          ],
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, username: true, avatarUrl: true, status: true } } } },
      },
    });

    return conv;
  });

/** List all conversations for the current user */
export const listConversations = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: me.id } } },
    include: {
      participants: {
        include: {
          user: { select: { id: true, fullName: true, username: true, avatarUrl: true, status: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true, fullName: true } } },
      },
    },
    orderBy: { lastAt: "desc" },
  });

  return conversations.map((c) => {
    const otherParticipants = c.participants.filter((p) => p.userId !== me.id);
    const lastMsg = c.messages[0] ?? null;

    return {
      id: c.id,
      isGroup: c.isGroup,
      name: c.isGroup ? (c.name ?? "Group") : (otherParticipants[0]?.user.fullName ?? "Unknown"),
      username: c.isGroup ? null : otherParticipants[0]?.user.username ?? null,
      avatarUrl: c.isGroup ? null : otherParticipants[0]?.user.avatarUrl ?? null,
      lastMessage: lastMsg
        ? {
            text: lastMsg.text ?? lastMsg.emoji ?? (lastMsg.sticker ? "Sticker" : ""),
            senderName: lastMsg.sender.fullName,
            isMe: lastMsg.senderId === me.id,
            time: lastMsg.createdAt.toISOString(),
          }
        : null,
      unreadCount: 0,
      participants: otherParticipants.map((p) => p.user),
    };
  });
});

/** Mark conversation as read */
export const markRead = createServerFn({ method: "POST" })
  .validator((data: { conversationId: string }) => {
    if (!data.conversationId) throw new Error("conversationId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: data.conversationId, userId: me.id },
      data: { lastReadAt: new Date() },
    });
    return { ok: true };
  });
