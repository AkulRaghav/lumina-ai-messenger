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

/** Start/log a call */
export const startCall = createServerFn({ method: "POST" })
  .validator(
    (data: { receiverId: string; type?: "voice" | "video" }) => {
      if (!data.receiverId) throw new Error("receiverId required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const me = await requireUser();

    const call = await prisma.call.create({
      data: {
        callerId: me.id,
        receiverId: data.receiverId,
        type: data.type ?? "voice",
        status: "completed",
        direction: "outgoing",
        duration: 0,
        startedAt: new Date(),
      },
    });

    return { callId: call.id };
  });

/** End a call (update duration) */
export const endCall = createServerFn({ method: "POST" })
  .validator(
    (data: { callId: string; duration: number }) => {
      if (!data.callId) throw new Error("callId required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    await requireUser();

    await prisma.call.update({
      where: { id: data.callId },
      data: {
        duration: data.duration,
        endedAt: new Date(),
        status: "completed",
      },
    });

    return { ok: true };
  });

/** Get call history for current user */
export const getCallHistory = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();

  const calls = await prisma.call.findMany({
    where: {
      OR: [{ callerId: me.id }, { receiverId: me.id }],
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  // Collect user IDs for name lookup
  const userIds = new Set<string>();
  calls.forEach((c) => {
    userIds.add(c.callerId);
    userIds.add(c.receiverId);
  });

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, fullName: true, username: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return calls.map((c) => {
    const isOutgoing = c.callerId === me.id;
    const otherUserId = isOutgoing ? c.receiverId : c.callerId;
    const otherUser = userMap.get(otherUserId);

    return {
      id: c.id,
      name: otherUser?.fullName ?? "Unknown",
      username: otherUser?.username ?? null,
      type: c.type as "voice" | "video",
      status: c.status as "completed" | "missed" | "declined",
      direction: isOutgoing ? "outgoing" : "incoming",
      duration: c.duration,
      startedAt: c.startedAt.toISOString(),
      hue: (otherUser?.fullName ?? "U").charCodeAt(0) % 360,
    };
  });
});
