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

/** Get notifications for the current user */
export const getNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    data: n.data ? JSON.parse(n.data) : null,
    createdAt: n.createdAt.toISOString(),
  }));
});

/** Get unread count */
export const getUnreadCount = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();
  const count = await prisma.notification.count({
    where: { userId: me.id, read: false },
  });
  return { count };
});

/** Mark all notifications as read */
export const markAllRead = createServerFn({ method: "POST" }).handler(async () => {
  const me = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: me.id, read: false },
    data: { read: true },
  });
  return { ok: true };
});

/** Mark a single notification as read */
export const markRead = createServerFn({ method: "POST" })
  .validator((data: { notificationId: string }) => {
    if (!data.notificationId) throw new Error("notificationId required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();
    await prisma.notification.updateMany({
      where: { id: data.notificationId, userId: me.id },
      data: { read: true },
    });
    return { ok: true };
  });

/** Create a notification (used internally by other server functions) */
export const createNotification = createServerFn({ method: "POST" })
  .validator(
    (data: { userId: string; type: string; title: string; body?: string; data?: Record<string, unknown> }) => {
      if (!data.userId || !data.type || !data.title) throw new Error("userId, type, title required");
      return data;
    },
  )
  .handler(async ({ data }) => {
    await requireUser();
    const notif = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data ? JSON.stringify(data.data) : null,
      },
    });
    return notif;
  });

/** Delete all notifications */
export const clearNotifications = createServerFn({ method: "POST" }).handler(async () => {
  const me = await requireUser();
  await prisma.notification.deleteMany({ where: { userId: me.id } });
  return { ok: true };
});
