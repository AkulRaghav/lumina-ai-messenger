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

/**
 * Simple local AI response generator.
 * In production, replace with an actual LLM API call (OpenAI, Anthropic, etc.)
 */
function generateAiResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  // Rewrite requests
  if (lower.includes("rewrite") || lower.includes("softer") || lower.includes("tone")) {
    return `Here's a softer version: "${userMessage.replace(/rewrite|softer|tone|please|can you/gi, "").trim()}" → "Hey, no rush at all — whenever you have a moment, I'd love to catch up. ✨"`;
  }

  // Translation requests
  if (lower.includes("translate") || lower.includes("japanese") || lower.includes("jp") || lower.includes("spanish")) {
    if (lower.includes("jp") || lower.includes("japanese")) {
      return "Here's the translation: 「こんにちは、お元気ですか？」✨";
    }
    if (lower.includes("spanish")) {
      return "Here's the translation: \"¡Hola! ¿Cómo estás?\" ✨";
    }
    return "I can translate to 60+ languages. Which language would you like? Just say something like \"translate to Japanese\" or \"translate to French\".";
  }

  // Summarize requests
  if (lower.includes("summarize") || lower.includes("summary") || lower.includes("catch up")) {
    return "Here's a quick summary: 3 new messages in Studio Lumen (Eli is shipping v3.2 tonight), 1 missed call from June, and Nori sent you a voice note. Want me to draft a reply to any of these?";
  }

  // Sticker / imagine
  if (lower.includes("sticker") || lower.includes("imagine") || lower.includes("generate")) {
    return "I'd love to generate that! ✨ Imagine a glowing aurora-themed sticker with soft gradients. In the full version, I'd create a custom 3D sticker right here. For now, try the sticker panel in any chat!";
  }

  // Schedule
  if (lower.includes("schedule") || lower.includes("calendar") || lower.includes("meeting") || lower.includes("time")) {
    return "Based on your recent chats, a good time to connect would be tomorrow around 2pm — both you and the other person seem free then. Want me to suggest this?";
  }

  // Code
  if (lower.includes("code") || lower.includes("function") || lower.includes("program")) {
    return "I can help with code! Here's a quick example:\n\n```ts\nconst greet = (name: string) => `Hello ${name} ✨`;\n```\n\nWhat would you like me to write or explain?";
  }

  // Greeting
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hey there! ✨ I'm your Lumina AI companion. I can rewrite messages, translate, summarize threads, imagine stickers, help with scheduling, or write code. What would you like?";
  }

  // Help
  if (lower.includes("help") || lower.includes("what can you")) {
    return "I can help with:\n• ✍️ Rewrite — soften, sharpen, or change the tone\n• 🌍 Translate — 60+ languages\n• 📋 Summarize — catch up on threads\n• 🎨 Imagine — generate sticker ideas\n• 📅 Schedule — find smart times\n• 💻 Code — write or explain\n\nJust ask!";
  }

  // Default contextual response
  const responses = [
    "That's interesting! Let me think about that... Here's what I'd suggest: try approaching it from a different angle. Want me to elaborate?",
    "Got it ✨ — I've noted that. Is there anything specific I can help you refine or work on?",
    "Great question! Based on your recent activity, I think the best next step would be to follow up with a quick message. Want me to draft one?",
    "I'm on it! Here's a thought: keep it concise and add a personal touch. Something like \"Hey, just thinking of you — hope all's well! ✨\"",
    "Noted! If you need me to rewrite, translate, or summarize anything, just say the word. I'm here whenever you need me.",
  ];
  return responses[Math.floor(Math.random() * responses.length)]!;
}

/** Send a message to Lumina AI and get a response */
export const sendAiMessage = createServerFn({ method: "POST" })
  .validator((data: { message: string }) => {
    if (!data.message?.trim()) throw new Error("Message required");
    return data;
  })
  .handler(async ({ data }) => {
    const me = await requireUser();

    // Save user message
    await prisma.aiMessage.create({
      data: { userId: me.id, role: "user", content: data.message },
    });

    // Generate response
    const response = generateAiResponse(data.message);

    // Save assistant message
    const aiMsg = await prisma.aiMessage.create({
      data: { userId: me.id, role: "assistant", content: response },
    });

    return {
      id: aiMsg.id,
      content: response,
      createdAt: aiMsg.createdAt.toISOString(),
    };
  });

/** Get AI chat history */
export const getAiHistory = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireUser();

  const messages = await prisma.aiMessage.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));
});

/** Clear AI chat history */
export const clearAiHistory = createServerFn({ method: "POST" }).handler(async () => {
  const me = await requireUser();
  await prisma.aiMessage.deleteMany({ where: { userId: me.id } });
  return { ok: true };
});
