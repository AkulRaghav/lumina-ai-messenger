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

/** Register a media file upload (metadata) */
export const registerUpload = createServerFn({ method: "POST" })
  .validator(
    (data: {
      filename: string;
      mimeType: string;
      sizeBytes: number;
      type: "photo" | "video" | "document" | "voice" | "gif";
      conversationId?: string;
      messageId?: string;
      url: string;
    }) => {
      if (!data.filename || !data.mimeType || !data.url) {
        throw new Error("filename, mimeType, and url are required");
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const me = await requireUser();

    const media = await prisma.mediaFile.create({
      data: {
        userId: me.id,
        filename: data.filename,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        type: data.type,
        conversationId: data.conversationId,
        messageId: data.messageId,
        url: data.url,
      },
    });

    return media;
  });

/** List media for a conversation (shared media view) */
export const getConversationMedia = createServerFn({ method: "GET" })
  .validator(
    (data: { conversationId: string; type?: string }) => {
      if (!data.conversationId) throw new Error("conversationId required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    await requireUser();

    const media = await prisma.mediaFile.findMany({
      where: {
        conversationId: data.conversationId,
        ...(data.type && { type: data.type }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return media;
  });

/** List all media for the current user */
export const getMyMedia = createServerFn({ method: "GET" })
  .validator(
    (data?: { type?: string }) => data ?? {},
  )
  .handler(async ({ data }) => {
    const me = await requireUser();

    const media = await prisma.mediaFile.findMany({
      where: {
        userId: me.id,
        ...(data?.type && { type: data.type }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return media;
  });

/** Get storage stats for the current user */
export const getStorageStats = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();

  // Total media storage
  const allMedia = await prisma.mediaFile.findMany({
    where: { userId: me.id },
    select: { sizeBytes: true, type: true },
  });

  const totalBytes = allMedia.reduce((sum, m) => sum + m.sizeBytes, 0);
  const photoBytes = allMedia.filter((m) => m.type === "photo" || m.type === "video").reduce((s, m) => s + m.sizeBytes, 0);
  const voiceBytes = allMedia.filter((m) => m.type === "voice").reduce((s, m) => s + m.sizeBytes, 0);
  const docBytes = allMedia.filter((m) => m.type === "document").reduce((s, m) => s + m.sizeBytes, 0);

  // Message count as proxy for "chat storage"
  const messageCount = await prisma.message.count({ where: { senderId: me.id } });
  const chatBytes = messageCount * 200; // ~200 bytes per message estimate

  return {
    totalBytes: totalBytes + chatBytes,
    mediaBytes: photoBytes,
    chatBytes,
    voiceBytes,
    docBytes,
    fileCount: allMedia.length,
    messageCount,
  };
});

/** Delete a media file */
export const deleteMedia = createServerFn({ method: "POST" })
  .validator((data: { mediaId: string }) => {
    if (!data.mediaId) throw new Error("mediaId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    const media = await prisma.mediaFile.findUnique({ where: { id: data.mediaId } });
    if (!media || media.userId !== me.id) throw new Error("Not found or not authorized");

    await prisma.mediaFile.delete({ where: { id: data.mediaId } });
    return { ok: true };
  });
