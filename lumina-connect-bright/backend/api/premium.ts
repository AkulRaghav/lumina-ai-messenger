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

/** Get premium status */
export const getPremiumStatus = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: me.id },
  });

  if (!prefs || !prefs.premiumPlan) {
    return { isPremium: false, plan: null, startedAt: null, trialUsed: prefs?.premiumTrialUsed ?? false };
  }

  return {
    isPremium: true,
    plan: prefs.premiumPlan,
    startedAt: prefs.premiumStartedAt,
    trialUsed: prefs.premiumTrialUsed,
  };
});

/** Start premium subscription (simulated — no real payment) */
export const startPremium = createServerFn({ method: "POST" })
  .validator((data: { plan: "month" | "year" }) => {
    if (!data.plan) throw new Error("plan required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    await prisma.userPreferences.upsert({
      where: { userId: me.id },
      create: {
        userId: me.id,
        premiumPlan: data.plan,
        premiumStartedAt: new Date().toISOString(),
        premiumTrialUsed: true,
      },
      update: {
        premiumPlan: data.plan,
        premiumStartedAt: new Date().toISOString(),
        premiumTrialUsed: true,
      },
    });

    return { ok: true, plan: data.plan };
  });

/** Cancel premium subscription */
export const cancelPremium = createServerFn({ method: "POST" }).handler(async () => {
  const me = await requireUser();

  await prisma.userPreferences.updateMany({
    where: { userId: me.id },
    data: { premiumPlan: null, premiumStartedAt: null },
  });

  return { ok: true };
});
