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

/** Send a message to a conversation */
export const sendMessage = createServerFn({ method: "POST" })
  .validator(
    (data: {
      conversationId: string;
      text?: string;
      emoji?: string;
      sticker?: string;
      replyToId?: string;
    }) => {
      if (!data.conversationId) throw new Error("conversationId required");
      if (!data.text && !data.emoji && !data.sticker) throw new Error("Message content required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const me = await requireUser();

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: data.conversationId, userId: me.id } },
    });
    if (!participant) throw new Error("Not a participant in this conversation");

    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: me.id,
        text: data.text,
        emoji: data.emoji,
        sticker: data.sticker,
        replyToId: data.replyToId,
      },
      include: {
        sender: { select: { id: true, fullName: true, username: true } },
      },
    });

    // Update conversation lastAt and lastMessage preview
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: {
        lastAt: new Date(),
        lastMessage: data.text ?? data.emoji ?? (data.sticker ? "Sticker" : null),
      },
    });

    // Update sender's lastReadAt
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: data.conversationId, userId: me.id } },
      data: { lastReadAt: new Date() },
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender.fullName,
      text: message.text,
      emoji: message.emoji,
      sticker: message.sticker,
      replyToId: message.replyToId,
      createdAt: message.createdAt.toISOString(),
    };
  });

/** Get messages for a conversation (paginated, newest first) */
export const getMessages = createServerFn({ method: "GET" })
  .validator(
    (data: { conversationId: string; cursor?: string; limit?: number }) => {
      if (!data.conversationId) throw new Error("conversationId required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const me = await requireUser();

    // Verify participation
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: data.conversationId, userId: me.id } },
    });
    if (!participant) throw new Error("Not a participant in this conversation");

    const limit = data.limit ?? 50;
    const messages = await prisma.message.findMany({
      where: { conversationId: data.conversationId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(data.cursor && { cursor: { id: data.cursor }, skip: 1 }),
      include: {
        sender: { select: { id: true, fullName: true, username: true } },
      },
    });

    const hasMore = messages.length > limit;
    const items = (hasMore ? messages.slice(0, limit) : messages).reverse();

    return {
      messages: items.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender.fullName,
        senderUsername: m.sender.username,
        text: m.text,
        emoji: m.emoji,
        sticker: m.sticker,
        replyToId: m.replyToId,
        createdAt: m.createdAt.toISOString(),
        isMe: m.senderId === me.id,
      })),
      nextCursor: hasMore ? messages[messages.length - 1]?.id : null,
    };
  });

/** Poll for new messages since a given message ID */
export const pollMessages = createServerFn({ method: "GET" })
  .validator(
    (data: { conversationId: string; afterId: string }) => {
      if (!data.conversationId || !data.afterId) throw new Error("conversationId and afterId required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const me = await requireUser();

    // Get the timestamp of the reference message
    const refMsg = await prisma.message.findUnique({ where: { id: data.afterId } });
    if (!refMsg) return { messages: [] };

    const newMessages = await prisma.message.findMany({
      where: {
        conversationId: data.conversationId,
        createdAt: { gt: refMsg.createdAt },
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, fullName: true, username: true } },
      },
    });

    return {
      messages: newMessages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender.fullName,
        senderUsername: m.sender.username,
        text: m.text,
        emoji: m.emoji,
        sticker: m.sticker,
        replyToId: m.replyToId,
        createdAt: m.createdAt.toISOString(),
        isMe: m.senderId === me.id,
      })),
    };
  });
