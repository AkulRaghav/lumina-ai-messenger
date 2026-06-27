import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/api/auth/google/callback")({
  component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        setStatus("error");
        setError("No authorization code received from Google");
        return;
      }

      try {
        const { handleGoogleCallback } = await import("../../../../../backend/api/google");
        await handleGoogleCallback({ data: { code } });
        setStatus("success");
        // Redirect to home
        window.location.href = "/";
      } catch (e: any) {
        setStatus("error");
        setError(e?.message ?? "Google sign-in failed");
      }
    })();
  }, []);

  if (status === "processing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[oklch(0.13_0.04_285)]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="mt-4 text-white/70">Signing in with Google…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[oklch(0.13_0.04_285)]">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
          <a href="/" className="mt-4 inline-block text-white/70 underline">Go back</a>
        </div>
      </div>
    );
  }

  return null;
}
