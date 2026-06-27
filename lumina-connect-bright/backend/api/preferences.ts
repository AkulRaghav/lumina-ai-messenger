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

/** Get user preferences (creates defaults if none exist) */
export const getPreferences = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();

  let prefs = await prisma.userPreferences.findUnique({
    where: { userId: me.id },
  });

  if (!prefs) {
    prefs = await prisma.userPreferences.create({
      data: { userId: me.id },
    });
  }

  return {
    pushEnabled: prefs.pushEnabled,
    callsEnabled: prefs.callsEnabled,
    mentionsEnabled: prefs.mentionsEnabled,
    aiSuggestions: prefs.aiSuggestions,
    notifSound: prefs.notifSound,
    doNotDisturb: prefs.doNotDisturb,
    language: prefs.language,
    theme: prefs.theme,
    accent: prefs.accent,
  };
});

/** Update user preferences */
export const updatePreferences = createServerFn({ method: "POST" })
  .validator(
    (data: {
      pushEnabled?: boolean;
      callsEnabled?: boolean;
      mentionsEnabled?: boolean;
      aiSuggestions?: boolean;
      notifSound?: string;
      doNotDisturb?: boolean;
      language?: string;
      theme?: string;
      accent?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const me = await requireUser();

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: me.id },
      create: { userId: me.id, ...data },
      update: data,
    });

    return {
      pushEnabled: prefs.pushEnabled,
      callsEnabled: prefs.callsEnabled,
      mentionsEnabled: prefs.mentionsEnabled,
      aiSuggestions: prefs.aiSuggestions,
      notifSound: prefs.notifSound,
      doNotDisturb: prefs.doNotDisturb,
      language: prefs.language,
      theme: prefs.theme,
      accent: prefs.accent,
    };
  });
