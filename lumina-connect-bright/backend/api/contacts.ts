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

export const searchUsers = createServerFn({ method: "GET" })
  .validator((data: { query: string }) => {
    if (!data.query || data.query.length < 2) throw new Error("Query must be at least 2 characters");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();
    const q = data.query.replace(/^@/, "");

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: me.id } },
          {
            OR: [
              { username: { contains: q } },
              { fullName: { contains: q } },
              { email: { contains: q } },
            ],
          },
        ],
      },
      select: { id: true, username: true, fullName: true, avatarUrl: true },
      take: 20,
    });

    return users;
  });

export const getContacts = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();

  const contacts = await prisma.contact.findMany({
    where: { userId: me.id },
    include: {
      contact: {
        select: { id: true, username: true, fullName: true, avatarUrl: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return contacts.map((c) => c.contact);
});

export const addContact = createServerFn({ method: "POST" })
  .validator((data: { contactId: string }) => {
    if (!data.contactId) throw new Error("contactId is required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();
    if (data.contactId === me.id) throw new Error("Cannot add yourself");

    const target = await prisma.user.findUnique({ where: { id: data.contactId } });
    if (!target) throw new Error("User not found");

    // Upsert to avoid duplicates
    await prisma.contact.upsert({
      where: { userId_contactId: { userId: me.id, contactId: data.contactId } },
      create: { userId: me.id, contactId: data.contactId },
      update: {},
    });

    return { ok: true };
  });

export const removeContact = createServerFn({ method: "POST" })
  .validator((data: { contactId: string }) => {
    if (!data.contactId) throw new Error("contactId is required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    await prisma.contact.deleteMany({
      where: { userId: me.id, contactId: data.contactId },
    });

    return { ok: true };
  });
