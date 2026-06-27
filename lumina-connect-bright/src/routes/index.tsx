import { createFileRoute } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Search, Plus, Bell, Settings as SettingsIcon, MessageCircle, Phone, Compass, Users, Sparkles,
  Camera, Image as ImageIcon, Mic, MapPin, Lock, Fingerprint, ScanFace, Eye, EyeOff, Check, ChevronRight,
  Pin, Archive, Smile, Send, Paperclip, MoreHorizontal, Video, PhoneOff, Volume2, ScreenShare, Hash, BellOff, Trash, Star as StarIcon, Reply as ReplyIcon,
  Shield, Crown, Bookmark, Globe, Languages, Wand2, FileText, Trash2, LogOut, KeyRound, Bluetooth, Contact,
  ChevronDown, X, Heart, Star, Reply, Forward, Copy, BellRing, UserPlus, Calendar, Music2, Folder,
  Cloud, Cpu, ShieldCheck, Headphones, PaintBucket, Type, Download, HelpCircle, Share2, Sun, Wifi, BatteryMedium,
  PanelLeft, Inbox, FolderClosed,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumina — Messaging, but luminous" },
      { name: "description", content: "Lumina is a premium spatial messaging app. Glassy chats, animated stickers, AI assistance, and post-quantum privacy." },
      { property: "og:title", content: "Lumina — Messaging, but luminous" },
      { property: "og:description", content: "A premium spatial messenger with glass, gradients, and AI." },
    ],
  }),
  component: LuminaApp,
});

/* =========================================================
   Navigation
   ========================================================= */

type Screen =
  | "splash" | "welcome" | "login" | "register" | "otp" | "permissions" | "profileSetup"
  | "home" | "chat" | "groupChat" | "ai" | "call" | "discover" | "settings"
  | "security" | "premium" | "profile" | "search" | "notifications" | "media"
  | "logout" | "delete" | "appearance"
  | "editProfile" | "account" | "privacy" | "chatSettings" | "dataStorage"
  | "savedMessages" | "voiceMessages" | "pinnedChats" | "storyView"
  | "language" | "accessibility" | "help" | "invite" | "storage"
  | "community" | "creator" | "notifSettings" | "archive" | "newChat";

type Tab = "chats" | "calls" | "communities" | "ai" | "explore" | "settings";

interface NavCtx {
  screen: Screen;
  params: Record<string, unknown>;
  tab: Tab;
  go: (s: Screen, params?: Record<string, unknown>) => void;
  back: () => void;
  setTab: (t: Tab) => void;
}
const Nav = createContext<NavCtx | null>(null);
const useNav = () => useContext(Nav)!;

/* ---------- Theme (mode + accent), live across the app ---------- */

type ThemeMode = "dark" | "light";
type AccentId = "aurora" | "sunset" | "ocean" | "forest";
const ACCENTS: Record<AccentId, { name: string; lavender: string; blush: string; sky: string; mint: string }> = {
  aurora: { name: "Aurora",  lavender: "oklch(0.62 0.22 290)", blush: "oklch(0.70 0.20 300)", sky: "oklch(0.60 0.18 270)", mint: "oklch(0.68 0.18 285)" },
  sunset: { name: "Sunset",  lavender: "oklch(0.80 0.16 25)",  blush: "oklch(0.86 0.12 350)", sky: "oklch(0.85 0.14 60)",  mint: "oklch(0.88 0.08 320)" },
  ocean:  { name: "Ocean",   lavender: "oklch(0.78 0.14 220)", blush: "oklch(0.86 0.10 195)", sky: "oklch(0.88 0.10 170)", mint: "oklch(0.88 0.12 145)" },
  forest: { name: "Forest",  lavender: "oklch(0.78 0.14 145)", blush: "oklch(0.88 0.12 110)", sky: "oklch(0.85 0.10 175)", mint: "oklch(0.88 0.10 90)" },
};
interface ThemeCtx { mode: ThemeMode; accent: AccentId; setMode: (m: ThemeMode) => void; setAccent: (a: AccentId) => void; }
const ThemeC = createContext<ThemeCtx | null>(null);
const useTheme = () => useContext(ThemeC)!;

function LuminaApp() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [tab, setTab] = useState<Tab>("chats");
  const [history, setHistory] = useState<Screen[]>([]);
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [accent, setAccent] = useState<AccentId>("aurora");
  const [sessionChecked, setSessionChecked] = useState(false);

  const go = (s: Screen, p: Record<string, unknown> = {}) => {
    setHistory((h) => [...h, screen]);
    setParams(p);
    setScreen(s);
  };
  const back = () => {
    setHistory((h) => {
      const prev = h[h.length - 1] ?? "home";
      setScreen(prev);
      return h.slice(0, -1);
    });
  };

  // Check session on mount — skip login if already authenticated
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getSession } = await import("../../backend/api/auth");
        const result = await getSession();
        if (!cancelled && result?.user) {
          setScreen("home");
          // Load persisted theme/accent
          try {
            const { getPreferences } = await import("../../backend/api/preferences");
            const prefs = await getPreferences();
            if (!cancelled) {
              if (prefs.theme === "light" || prefs.theme === "dark") setMode(prefs.theme);
              if (prefs.accent in ACCENTS) setAccent(prefs.accent as AccentId);
            }
          } catch { /* ignore */ }
        }
      } catch {
        // No valid session, continue normal flow
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-advance splash (only if no session)
  useEffect(() => {
    if (screen === "splash" && sessionChecked) {
      const t = setTimeout(() => { setScreen("welcome"); }, 2600);
      return () => clearTimeout(t);
    }
  }, [screen, sessionChecked]);

  const value = useMemo(() => ({ screen, params, tab, go, back, setTab }), [screen, params, tab]);
  const themeValue = useMemo(() => ({ mode, accent, setMode, setAccent }), [mode, accent]);
  const a = ACCENTS[accent];
  const cssVars = {
    "--lavender": a.lavender,
    "--blush": a.blush,
    "--sky": a.sky,
    "--mint": a.mint,
  } as React.CSSProperties;

  return (
    <ThemeC.Provider value={themeValue}>
      <Nav.Provider value={value}>
        <div
          data-theme={mode}
          style={cssVars}
          className="relative min-h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-500"
        >
          <AuroraBackdrop />
          {/* Mobile + tablet: phone-frame shell (<= lg) */}
          <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[480px] flex-col lg:hidden">
            <ScreenRouter />
          </main>
          {/* Desktop: sidebar + multi-column layout */}
          <div className="relative z-10 hidden min-h-screen w-full lg:flex">
            <DesktopShell />
          </div>
        </div>
      </Nav.Provider>
    </ThemeC.Provider>
  );
}

function ScreenRouter() {
  const { screen } = useNav();
  return (
    <div key={screen} className="lumi-fade flex flex-1 flex-col">
      {screen === "splash" && <SplashScreen />}
      {screen === "welcome" && <WelcomeScreen />}
      {screen === "login" && <LoginScreen />}
      {screen === "register" && <RegisterScreen />}
      {screen === "otp" && <OtpScreen />}
      {screen === "permissions" && <PermissionsScreen />}
      {screen === "profileSetup" && <ProfileSetupScreen />}
      {screen === "home" && <HomeScreen />}
      {screen === "chat" && <ChatScreen />}
      {screen === "groupChat" && <GroupChatScreen />}
      {screen === "ai" && <AiScreen />}
      {screen === "call" && <CallScreen />}
      {screen === "discover" && <DiscoverScreen />}
      {screen === "settings" && <SettingsScreen />}
      {screen === "security" && <SecurityScreen />}
      {screen === "premium" && <PremiumScreen />}
      {screen === "profile" && <ProfileScreen />}
      {screen === "search" && <SearchScreen />}
      {screen === "notifications" && <NotificationsScreen />}
      {screen === "media" && <MediaScreen />}
      {screen === "logout" && <LogoutScreen />}
      {screen === "delete" && <DeleteScreen />}
      {screen === "appearance" && <AppearanceScreen />}
      {screen === "editProfile" && <EditProfileScreen />}
      {screen === "account" && <AccountScreen />}
      {screen === "privacy" && <PrivacyScreen />}
      {screen === "chatSettings" && <ChatSettingsScreen />}
      {screen === "dataStorage" && <DataStorageScreen />}
      {screen === "savedMessages" && <SavedMessagesScreen />}
      {screen === "voiceMessages" && <VoiceMessagesScreen />}
      {screen === "pinnedChats" && <PinnedChatsScreen />}
      {screen === "storyView" && <StoryViewScreen />}
      {screen === "language" && <LanguageScreen />}
      {screen === "accessibility" && <AccessibilityScreen />}
      {screen === "help" && <HelpScreen />}
      {screen === "invite" && <InviteScreen />}
      {screen === "storage" && <StorageScreen />}
      {screen === "community" && <CommunityScreen />}
      {screen === "creator" && <CreatorScreen />}
      {screen === "notifSettings" && <NotifSettingsScreen />}
      {screen === "archive" && <ArchiveScreen />}
      {screen === "newChat" && <NewChatScreen />}
    </div>
  );
}

/* =========================================================
   Shared primitives
   ========================================================= */

function AuroraBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="aurora-blob -top-32 -left-24 h-[420px] w-[420px]" style={{ background: "var(--lavender)" }} />
      <div className="aurora-blob top-1/3 -right-32 h-[380px] w-[380px]" style={{ background: "var(--blush)", animationDelay: "-6s" }} />
      <div className="aurora-blob -bottom-24 left-1/4 h-[460px] w-[460px]" style={{ background: "var(--sky)", animationDelay: "-12s" }} />
      <div className="aurora-blob bottom-10 right-1/4 h-[300px] w-[300px]" style={{ background: "var(--mint)", animationDelay: "-3s" }} />
      <div className="absolute inset-0 bg-[color:var(--canvas-veil)]" />
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: "radial-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px)", backgroundSize: "3px 3px" }} />
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between px-6 pt-3 text-[13px] font-medium tabular-nums text-foreground/90">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-foreground/80" />
        <span className="h-2 w-2 rounded-full bg-foreground/60" />
        <span className="h-2 w-2 rounded-full bg-foreground/40" />
        <span className="ml-2 text-[11px]">5G</span>
        <span className="ml-2 h-2.5 w-5 rounded-sm border border-white/70" />
      </div>
    </div>
  );
}

function TopBar({ title, onBack, right, subtitle }: { title?: ReactNode; onBack?: () => void; right?: ReactNode; subtitle?: ReactNode }) {
  const { back } = useNav();
  return (
    <div className="flex h-14 shrink-0 items-center justify-between px-4">
      <button
        onClick={onBack ?? back}
        className="grid h-10 w-10 place-items-center rounded-full glass transition-transform active:scale-90"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="flex flex-col items-center">
        {title && <div className="text-[15px] font-semibold">{title}</div>}
        {subtitle && <div className="text-[11px] text-foreground/60">{subtitle}</div>}
      </div>
      <div className="grid h-10 w-10 place-items-center">{right}</div>
    </div>
  );
}

function GlassCard({ children, className = "", strong = false }: { children: ReactNode; className?: string; strong?: boolean }) {
  return <div className={`${strong ? "glass-strong" : "glass"} rounded-3xl ${className}`}>{children}</div>;
}

function PrimaryButton({ children, onClick, className = "", loading = false, icon }: { children: ReactNode; onClick?: () => void; className?: string; loading?: boolean; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[15px] font-semibold text-[oklch(0.16_0.04_285)] transition-all active:scale-[0.98] ${className}`}
      style={{ background: "linear-gradient(120deg, var(--lavender), var(--blush) 45%, var(--sky))" }}
    >
      <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,oklch(1_0_0/0.4),transparent)] bg-[length:200%_100%] opacity-0 transition-opacity group-hover:opacity-100" style={{ animation: "lumi-shimmer 1.4s linear infinite" }} />
      {loading ? <Spinner /> : icon}
      <span className="relative">{children}</span>
    </button>
  );
}

function GhostButton({ children, onClick, className = "", icon }: { children: ReactNode; onClick?: () => void; className?: string; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl glass text-[15px] font-medium text-foreground transition-all active:scale-[0.98] ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

function Input({ label, type = "text", icon, placeholder, value, onChange, right }: { label?: string; type?: string; icon?: ReactNode; placeholder?: string; value?: string; onChange?: (v: string) => void; right?: ReactNode }) {
  return (
    <label className="block">
      {label && <div className="mb-2 px-1 text-[12px] font-medium text-foreground/60">{label}</div>}
      <div className="flex h-14 items-center gap-3 rounded-2xl glass px-4">
        {icon && <span className="text-foreground/60">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-full flex-1 bg-transparent text-[15px] text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
        {right}
      </div>
    </label>
  );
}

function Avatar({ name, size = 44, hue = 295, src }: { name: string; size?: number; hue?: number; src?: string }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full text-[13px] font-semibold text-foreground shadow-[0_8px_24px_-8px_oklch(0_0_0/0.5)]"
      style={{
        width: size, height: size,
        background: src ? `center/cover url(${src})` : `linear-gradient(135deg, oklch(0.7 0.18 ${hue}), oklch(0.85 0.12 ${hue + 60}))`,
      }}
    >
      {!src && initials}
    </div>
  );
}

function Pill({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all ${active ? "bg-foreground text-background" : "glass text-foreground/80"}`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   1. Splash
   ========================================================= */

function LuminaMark({ size = 96 }: { size?: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-[28%] opacity-80 blur-2xl" style={{ background: "conic-gradient(from 0deg, var(--lavender), var(--blush), var(--sky), var(--mint), var(--lavender))" }} />
      <div className="relative grid h-full w-full place-items-center rounded-[28%] glass-strong">
        <div className="aurora-spin absolute h-[70%] w-[70%] rounded-full opacity-70" style={{ background: "conic-gradient(from 0deg, transparent, var(--lavender), transparent 40%, var(--blush), transparent 70%, var(--sky), transparent)" }} />
        <div className="relative h-[44%] w-[44%] rounded-full bg-foreground shadow-[0_8px_30px_oklch(1_0_0/0.4)]" />
      </div>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="lumi-rise"><LuminaMark size={128} /></div>
      <div className="lumi-rise text-center" style={{ animationDelay: "0.15s" }}>
        <div className="font-display text-5xl text-foreground">Lumina</div>
        <div className="mt-1 text-[13px] tracking-[0.3em] text-foreground/50 uppercase">Messaging, luminous</div>
      </div>
      <div className="lumi-rise absolute bottom-16 flex items-center gap-1.5" style={{ animationDelay: "0.4s" }}>
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/80 lumi-typing-dot" />
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/80 lumi-typing-dot" style={{ animationDelay: "0.2s" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/80 lumi-typing-dot" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

/* =========================================================
   2. Welcome
   ========================================================= */

function WelcomeScreen() {
  const { go } = useNav();
  const features = [
    { icon: <ShieldCheck className="h-5 w-5" />, title: "Post-quantum private", body: "End-to-end with Kyber-1024." },
    { icon: <Sparkles className="h-5 w-5" />, title: "AI that gets you", body: "Compose, translate, summarize." },
    { icon: <Cloud className="h-5 w-5" />, title: "Spatial calls", body: "Crystal voice, immersive video." },
  ];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % features.length), 2800); return () => clearInterval(t); }, []);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <button onClick={() => go("home")} className="absolute right-5 top-12 z-10 text-[13px] text-foreground/70">Skip</button>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <div className="relative mb-8 h-[300px] w-[170px] lumi-rise">
          <div className="absolute inset-0 -z-10 rounded-[3rem] blur-2xl opacity-70" style={{ background: "conic-gradient(from 0deg, var(--lavender), var(--blush), var(--sky), var(--mint), var(--lavender))" }} />
          <div className="relative h-full w-full rounded-[2.5rem] glass-strong p-2">
            <div className="flex h-full w-full flex-col gap-2 rounded-[2rem] bg-[oklch(0.14_0.04_285)] p-3">
              <div className="h-3 w-12 rounded-full bg-foreground/20 mx-auto" />
              <div className="lumi-bubble mr-auto rounded-2xl rounded-bl-md bg-foreground/10 px-3 py-2 text-[10px] text-foreground">Hey ✨</div>
              <div className="lumi-bubble ml-auto rounded-2xl rounded-br-md px-3 py-2 text-[10px] text-[oklch(0.16_0.04_285)]" style={{ background: "linear-gradient(120deg,var(--lavender),var(--blush))", animationDelay: "0.3s" }}>Welcome to Lumina</div>
              <div className="lumi-bubble mr-auto rounded-2xl rounded-bl-md bg-foreground/10 px-3 py-2 text-[10px] text-foreground" style={{ animationDelay: "0.6s" }}>🪩 looks unreal</div>
            </div>
          </div>
        </div>
        <h1 className="font-display text-center text-5xl leading-[1.05] text-foreground lumi-rise">
          Conversations,<br/><span className="aurora-text italic">luminous</span>.
        </h1>
        <p className="mt-3 max-w-[300px] text-center text-[14px] text-foreground/60 lumi-rise" style={{ animationDelay: "0.1s" }}>
          A premium messenger built for depth, intimacy, and zero compromise on privacy.
        </p>
        <div className="mt-6 flex h-12 items-center gap-3 rounded-2xl glass px-4 lumi-rise" style={{ animationDelay: "0.2s" }}>
          <span className="text-foreground/80">{features[i].icon}</span>
          <div className="text-left">
            <div className="text-[12px] font-semibold text-foreground">{features[i].title}</div>
            <div className="text-[11px] text-foreground/50">{features[i].body}</div>
          </div>
        </div>
        <div className="mt-auto flex w-full flex-col gap-3 pt-8">
          <PrimaryButton onClick={() => go("register")}>Get Started</PrimaryButton>
          <GhostButton onClick={() => go("login")}>I already have an account</GhostButton>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   3. Login
   ========================================================= */

function LoginScreen() {
  const { go } = useNav();
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const { login } = await import("../../backend/api/auth");
      await login({ data: { email, password } });
      go("home");
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar onBack={() => go("welcome")} />
      <div className="flex flex-1 flex-col px-6 pb-8">
        <div className="lumi-rise">
          <LuminaMark size={56} />
        </div>
        <h1 className="mt-5 font-display text-4xl text-foreground lumi-rise">Welcome back.</h1>
        <p className="mt-1 text-[13px] text-foreground/60 lumi-rise">Sign in to pick up where you left off.</p>

        <div className="mt-6 flex flex-col gap-3">
          <Input label="Email" placeholder="you@lumina.app" icon={<span>@</span>} value={email} onChange={setEmail} />
          <Input
            label="Password"
            type={show ? "text" : "password"}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={setPassword}
            right={
              <button onClick={() => setShow((s) => !s)} className="grid h-8 w-8 place-items-center rounded-full text-foreground/60 hover:bg-foreground/10">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          {error && <p className="px-1 text-[12px] text-red-400">{error}</p>}
          <div className="flex items-center justify-between px-1">
            <button onClick={() => setRemember((r) => !r)} className="flex items-center gap-2 text-[12px] text-foreground/70">
              <span className={`grid h-5 w-5 place-items-center rounded-md border ${remember ? "border-white bg-foreground" : "border-white/30"}`}>
                {remember && <Check className="h-3.5 w-3.5 text-[oklch(0.16_0.04_285)]" />}
              </span>
              Remember me
            </button>
            <button className="text-[12px] text-foreground/80 underline-offset-4 hover:underline">Forgot?</button>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl glass text-[13px] font-medium text-foreground">
            <ScanFace className="h-4 w-4" /> Face ID
          </button>
          <button className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl glass text-[13px] font-medium text-foreground">
            <Fingerprint className="h-4 w-4" /> Touch
          </button>
        </div>

        <div className="mt-5"><PrimaryButton loading={loading} onClick={submit}>Continue</PrimaryButton></div>

        <div className="my-5 flex items-center gap-3 text-[11px] text-foreground/40">
          <span className="h-px flex-1 bg-foreground/10" /> OR <span className="h-px flex-1 bg-foreground/10" />
        </div>

        <div className="grid grid-cols-4 gap-3">
          {["G","","gh","M"].map((label, idx) => (
            <button key={idx} onClick={label === "G" ? async () => {
              try {
                const { getGoogleAuthUrl } = await import("../../backend/api/google");
                const { url } = await getGoogleAuthUrl();
                window.location.href = url;
              } catch (e: any) {
                setError(e?.message ?? "Google sign-in not configured");
              }
            } : undefined} className="grid h-14 place-items-center rounded-2xl glass text-[15px] font-semibold text-foreground transition active:scale-95">
              {label === "" ? <span className="text-xl"></span> : label}
            </button>
          ))}
        </div>

        <p className="mt-auto pt-8 text-center text-[12px] text-foreground/50">
          New here? <button onClick={() => go("register")} className="text-foreground underline-offset-4 hover:underline">Create account</button>
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   4. Register
   ========================================================= */

function RegisterScreen() {
  const { go } = useNav();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = async () => {
    setError("");
    if (!fullName || !username || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms and Privacy policy");
      return;
    }
    setLoading(true);
    try {
      const { register } = await import("../../backend/api/auth");
      await register({
        data: {
          email,
          username: username.replace(/^@/, ""),
          fullName,
          password,
          phone: countryCode && phone ? `${countryCode} ${phone}` : undefined,
        },
      });
      go("home");
    } catch (e: any) {
      setError(e?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Create account" />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 pb-8 no-scrollbar">
        <div className="mx-auto mb-2 grid h-24 w-24 place-items-center rounded-full glass-strong">
          <Camera className="h-7 w-7 text-foreground/70" />
          <span className="absolute mt-20 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.16_0.04_285)]">Upload</span>
        </div>
        <Input label="Full name" placeholder="Ada Lovelace" value={fullName} onChange={setFullName} />
        <Input label="Username" placeholder="@ada" value={username} onChange={setUsername} />
        <Input label="Email" placeholder="ada@lumina.app" value={email} onChange={setEmail} />
        <div className="grid grid-cols-[100px_1fr] gap-3">
          <Input label="Country" placeholder="+1" value={countryCode} onChange={setCountryCode} />
          <Input label="Phone" placeholder="555 0100" value={phone} onChange={setPhone} />
        </div>
        <Input label="Password" type="password" placeholder="••••••••" icon={<Lock className="h-4 w-4" />} value={password} onChange={setPassword} />
        <Input label="Confirm password" type="password" placeholder="••••••••" icon={<Lock className="h-4 w-4" />} value={confirmPassword} onChange={setConfirmPassword} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Birthday" placeholder="MM / DD / YYYY" />
          <Input label="Gender" placeholder="Prefer not to say" />
        </div>
        <Input label="Referral (optional)" placeholder="LUMINA-2026" />

        <button onClick={() => setAgreed((a) => !a)} className="mt-1 flex items-start gap-3 text-left text-[12px] text-foreground/70">
          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${agreed ? "border-white bg-foreground" : "border-white/30"}`}>
            {agreed && <Check className="h-3.5 w-3.5 text-[oklch(0.16_0.04_285)]" />}
          </span>
          I agree to Lumina's <span className="text-foreground underline-offset-4">Terms</span> and <span className="text-foreground underline-offset-4">Privacy</span>.
        </button>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <button className="grid h-12 place-items-center rounded-2xl glass text-[13px] font-semibold text-foreground">G</button>
          <button className="grid h-12 place-items-center rounded-2xl glass text-[13px] font-semibold text-foreground"></button>
          <button className="grid h-12 place-items-center rounded-2xl glass text-[13px] font-semibold text-foreground">GH</button>
        </div>

        {error && <p className="px-1 text-[12px] text-red-400">{error}</p>}
        <div className="mt-3"><PrimaryButton loading={loading} onClick={submit}>Continue</PrimaryButton></div>
      </div>
    </div>
  );
}

/* =========================================================
   5. OTP
   ========================================================= */

function OtpScreen() {
  const { go } = useNav();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(45);
  const [verified, setVerified] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (code.every((c) => c) && !verified) {
      setVerified(true);
      setTimeout(() => go("permissions"), 1100);
    }
  }, [code, verified, go]);
  const set = (i: number, v: string) => {
    const next = [...code];
    next[i] = v.slice(-1);
    setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Verify number" />
      <div className="flex flex-1 flex-col items-center px-6 pb-8">
        <div className="mt-4 grid h-20 w-20 place-items-center rounded-[28%] glass-strong lumi-rise">
          {verified ? <Check className="h-8 w-8 text-foreground" /> : <KeyRound className="h-7 w-7 text-foreground/80" />}
        </div>
        <h2 className="mt-5 font-display text-3xl text-foreground lumi-rise">
          {verified ? "You're in." : "Check your messages."}
        </h2>
        <p className="mt-2 text-center text-[13px] text-foreground/60 lumi-rise">
          We sent a 6-digit code to <span className="text-foreground">+1 555 0100</span>.
        </p>

        <div className="mt-8 flex w-full justify-between gap-2">
          {code.map((c, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={c}
              onChange={(e) => set(i, e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={1}
              className={`h-14 w-12 rounded-2xl text-center font-display text-2xl text-foreground outline-none transition-all ${c ? "border border-white/40 bg-foreground/10" : "glass"} ${verified ? "lumi-glow-ring" : ""}`}
            />
          ))}
        </div>

        <div className="mt-6 text-[12px] text-foreground/60">
          {countdown > 0 ? (
            <>Resend in <span className="text-foreground tabular-nums">0:{countdown.toString().padStart(2, "0")}</span></>
          ) : (
            <button className="text-foreground underline-offset-4 hover:underline">Resend code</button>
          )}
        </div>

        <button className="mt-3 text-[12px] text-foreground/60">Paste from clipboard</button>
      </div>
    </div>
  );
}

/* =========================================================
   6. Permissions
   ========================================================= */

function PermissionsScreen() {
  const { go } = useNav();
  const items = [
    { icon: <Camera className="h-5 w-5" />, name: "Camera", why: "Take photos and video calls" },
    { icon: <ImageIcon className="h-5 w-5" />, name: "Photos", why: "Share moments from your library" },
    { icon: <Mic className="h-5 w-5" />, name: "Microphone", why: "Voice notes and calls" },
    { icon: <BellRing className="h-5 w-5" />, name: "Notifications", why: "Stay close to the people who matter" },
    { icon: <MapPin className="h-5 w-5" />, name: "Location", why: "Share where you are, only when you choose" },
    { icon: <Contact className="h-5 w-5" />, name: "Contacts", why: "Find friends already on Lumina" },
    { icon: <Bluetooth className="h-5 w-5" />, name: "Bluetooth", why: "Spatial audio + nearby devices" },
  ];
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Permissions" />
      <div className="flex flex-1 flex-col px-6 pb-8">
        <h2 className="font-display text-3xl text-foreground">A few things,<br/><span className="aurora-text italic">so you shine</span>.</h2>
        <p className="mt-2 text-[13px] text-foreground/60">Lumina asks for the minimum — and only when needed.</p>

        <div className="mt-6 flex flex-col gap-2.5 overflow-y-auto no-scrollbar">
          {items.map((it) => {
            const g = granted[it.name];
            return (
              <GlassCard key={it.name} className="flex items-center gap-4 p-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl glass-strong">{it.icon}</div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-foreground">{it.name}</div>
                  <div className="text-[11.5px] text-foreground/55">{it.why}</div>
                </div>
                <button
                  onClick={() => setGranted((s) => ({ ...s, [it.name]: !s[it.name] }))}
                  className={`grid h-8 min-w-[68px] place-items-center rounded-full text-[11.5px] font-semibold transition-all ${g ? "bg-foreground text-background" : "glass text-foreground/80"}`}
                >
                  {g ? "Granted" : "Allow"}
                </button>
              </GlassCard>
            );
          })}
        </div>

        <div className="mt-auto pt-5"><PrimaryButton onClick={() => go("profileSetup")} icon={<ArrowRight className="h-4 w-4" />}>Continue</PrimaryButton></div>
      </div>
    </div>
  );
}

/* =========================================================
   7. Profile Setup
   ========================================================= */

function ProfileSetupScreen() {
  const { go } = useNav();
  const { mode, accent, setMode, setAccent } = useTheme();
  const accentIds = Object.keys(ACCENTS) as AccentId[];
  const [displayName, setDisplayName] = useState("");
  const [uname, setUname] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const handleEnter = async () => {
    if (displayName || uname || bio || status) {
      setSaving(true);
      try {
        const { updateProfile } = await import("../../backend/api/profile");
        await updateProfile({
          data: {
            ...(displayName && { fullName: displayName }),
            ...(uname && { username: uname.replace(/^@/, "") }),
            ...(bio && { bio }),
            ...(status && { status }),
          },
        });
      } catch {
        // Non-blocking — proceed to home even if save fails
      } finally {
        setSaving(false);
      }
    }
    go("home");
  };

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Set up profile" />
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 no-scrollbar">
        <div className="relative mx-auto mt-2 grid h-28 w-28 place-items-center rounded-full">
          <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: `linear-gradient(135deg, var(--lavender), var(--blush))` }} />
          <div className="relative grid h-full w-full place-items-center rounded-full glass-strong">
            <Camera className="h-7 w-7 text-foreground/80" />
          </div>
          <button className="absolute -bottom-1 right-0 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background shadow-lg"><Plus className="h-4 w-4" /></button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Input label="Display name" placeholder="Ada" value={displayName} onChange={setDisplayName} />
          <Input label="Username" placeholder="@ada" value={uname} onChange={setUname} />
          <Input label="Bio" placeholder="Designing tiny universes." value={bio} onChange={setBio} />
          <Input label="Status" placeholder="✨ Building" value={status} onChange={setStatus} />
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[12px] font-medium text-foreground/60">Accent</div>
          <div className="flex gap-3">
            {accentIds.map((id) => {
              const a = ACCENTS[id];
              const active = accent === id;
              return (
                <button
                  key={id}
                  onClick={() => setAccent(id)}
                  aria-label={a.name}
                  className={`relative h-12 w-12 rounded-2xl transition-all ${active ? "scale-110 ring-2 ring-foreground" : "opacity-80"}`}
                  style={{ background: `linear-gradient(135deg, ${a.lavender}, ${a.blush} 50%, ${a.sky})` }}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-[12px] font-medium text-foreground/60">Theme</div>
          <div className="flex gap-3">
            {(["dark", "light"] as const).map((t) => (
              <button key={t} onClick={() => setMode(t)} className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-[13px] font-medium transition ${mode === t ? "bg-foreground text-background" : "glass text-foreground"}`}>
                {t === "dark" ? "Aurora" : "Daylight"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 text-[12px] font-medium text-foreground/60">Preview</div>
        <GlassCard className="mt-2 flex items-center gap-3 p-4">
          <div className="h-12 w-12 rounded-full" style={{ background: `linear-gradient(135deg, var(--lavender), var(--blush))` }} />
          <div>
            <div className="text-[14px] font-semibold text-foreground">{displayName || "Your Name"}</div>
            <div className="text-[11.5px] text-foreground/60">{uname ? (uname.startsWith("@") ? uname : `@${uname}`) : "@handle"} • {status || "✨"}</div>
          </div>
        </GlassCard>

        <div className="mt-auto pt-6"><PrimaryButton loading={saving} onClick={handleEnter}>Enter Lumina</PrimaryButton></div>
      </div>
    </div>
  );
}

/* =========================================================
   8. Home (tabs)
   ========================================================= */

const SAMPLE_CHATS = [
  { id: "n", name: "Nori", last: "okay but the new theme is unreal 🪩", time: "now", unread: 3, hue: 295, online: true, typing: true, pinned: true },
  { id: "j", name: "June Park", last: "I'll send a voice in two", time: "2m", unread: 1, hue: 350, voice: true },
  { id: "t", name: "Studio Lumen", last: "Eli: shipping tonight ✨", time: "11m", unread: 12, hue: 210, group: true, pinned: true },
  { id: "m", name: "Mom", last: "call me when you can", time: "1h", hue: 160 },
  { id: "k", name: "Kai", last: "🥹", time: "3h", hue: 30 },
  { id: "f", name: "Friday Night", last: "Mira: down for ramen?", time: "yesterday", hue: 270, group: true, unread: 2 },
  { id: "w", name: "Work — Atelier", last: "you: pushed v3.2", time: "Tue", hue: 200, group: true },
  { id: "p", name: "Papa", last: "love you ❤️", time: "Mon", hue: 0 },
];

function HomeScreen() {
  const { tab } = useNav();
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <div className="flex flex-1 flex-col pb-20">
        {tab === "chats" && <ChatsTab />}
        {tab === "calls" && <CallsTab />}
        {tab === "communities" && <CommunitiesTab />}
        {tab === "ai" && <AiTab />}
        {tab === "explore" && <DiscoverScreen embedded />}
        {tab === "settings" && <SettingsScreen embedded />}
      </div>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const { tab, setTab } = useNav();
  const items: { id: Tab; icon: ReactNode; label: string }[] = [
    { id: "chats", icon: <MessageCircle className="h-5 w-5" />, label: "Chats" },
    { id: "calls", icon: <Phone className="h-5 w-5" />, label: "Calls" },
    { id: "ai", icon: <Sparkles className="h-5 w-5" />, label: "AI" },
    { id: "explore", icon: <Compass className="h-5 w-5" />, label: "Explore" },
    { id: "settings", icon: <SettingsIcon className="h-5 w-5" />, label: "You" },
  ];
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-stretch px-2 pb-1 pt-1.5">
        {items.map((it) => {
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <span className={`relative ${active ? "text-[var(--lavender)]" : "text-foreground/45"}`}>
                {it.icon}
                {it.id === "chats" && (
                  <span className="absolute -right-2 -top-1 grid h-3.5 min-w-[14px] place-items-center rounded-full bg-[var(--lavender)] px-1 text-[8px] font-bold text-white">3</span>
                )}
              </span>
              <span className={`text-[10px] ${active ? "text-[var(--lavender)] font-medium" : "text-foreground/45"}`}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Fab() { return null; }

function ChatsTab() {
  const { go } = useNav();
  const [filter, setFilter] = useState("All");
  const [realChats, setRealChats] = useState<{ id: string; name: string; isGroup: boolean; username: string | null; lastMessage: { text: string; senderName: string; isMe: boolean; time: string } | null; unreadCount: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { listConversations } = await import("../../backend/api/conversations");
        const convos = await listConversations();
        setRealChats(convos);
      } catch { /* fallback to sample */ }
    })();
  }, []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString(undefined, { weekday: "short" });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Lumina</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => go("notifications")} className="relative grid h-10 w-10 place-items-center rounded-full bg-foreground/5">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--lavender)]" />
          </button>
          <button onClick={() => go("newChat")} className="grid h-10 w-10 place-items-center rounded-full bg-[var(--lavender)] text-white active:scale-95 transition-transform">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="px-5">
        <button onClick={() => go("search")} className="flex h-11 w-full items-center gap-3 rounded-full bg-foreground/[0.06] px-4 text-[13px] text-foreground/50">
          <Search className="h-4 w-4" /> Search anything
        </button>
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        {["All", "Unread", "Groups", "Channels"].map((f) => (
          <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Pill>
        ))}
      </div>

      <div className="mt-2 flex flex-1 flex-col overflow-y-auto px-2 no-scrollbar">
        {/* Real conversations */}
        {realChats.map((c) => (
          <ChatRow
            key={c.id}
            chat={{
              id: c.id,
              name: c.name,
              last: c.lastMessage ? (c.lastMessage.isMe ? `you: ${c.lastMessage.text}` : c.lastMessage.text) : "No messages yet",
              time: c.lastMessage ? formatTime(c.lastMessage.time) : "",
              hue: c.name.charCodeAt(0) % 360,
              group: c.isGroup,
              unread: 0,
            }}
            onClick={() => go(c.isGroup ? "groupChat" : "chat", { id: c.id, convId: c.id, name: c.name })}
          />
        ))}
        {/* Sample chats shown when no real chats or as demos */}
        {realChats.length === 0 && SAMPLE_CHATS.map((c) => (
          <ChatRow key={c.id} chat={c} onClick={() => go(c.group ? "groupChat" : "chat", { id: c.id })} />
        ))}
      </div>
    </div>
  );
}

function ChatRow({ chat, onClick }: { chat: typeof SAMPLE_CHATS[number]; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition active:bg-foreground/5">
      <div className="relative shrink-0">
        <Avatar name={chat.name} hue={chat.hue} />
        {chat.online && <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-background bg-[var(--mint)]" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[14.5px] font-semibold text-foreground">{chat.name}</span>
          <span className="shrink-0 text-[11px] text-foreground/40">{chat.time}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[12.5px] text-foreground/55">
            {chat.typing ? (
              <em className="not-italic text-[var(--lavender)]">typing…</em>
            ) : chat.voice ? (
              <span className="inline-flex items-center gap-1 text-[var(--lavender)]"><Mic className="h-3 w-3" /> Voice message</span>
            ) : (
              chat.last
            )}
          </span>
          {chat.unread ? (
            <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-[var(--lavender)] px-1.5 text-[10px] font-semibold text-white">
              {chat.unread}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function CallsTab() {
  const { go } = useNav();
  const [calls, setCalls] = useState<{ id: string; name: string; type: "voice" | "video"; status: string; direction: string; startedAt: string; hue: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { getCallHistory } = await import("../../backend/api/calls");
        const history = await getCallHistory();
        setCalls(history);
      } catch { /* fallback */ }
      setLoaded(true);
    })();
  }, []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 86400000) return "Yesterday";
    return d.toLocaleDateString([], { weekday: "short" });
  };

  // Sample calls for when there's no history yet
  const sampleCalls = [
    { id: "s1", name: "Nori", type: "video" as const, status: "completed", direction: "incoming", startedAt: new Date().toISOString(), hue: 295 },
    { id: "s2", name: "Studio Lumen", type: "voice" as const, status: "completed", direction: "outgoing", startedAt: new Date(Date.now() - 3600000).toISOString(), hue: 210 },
    { id: "s3", name: "June Park", type: "video" as const, status: "missed", direction: "incoming", startedAt: new Date(Date.now() - 86400000).toISOString(), hue: 350 },
    { id: "s4", name: "Mom", type: "voice" as const, status: "completed", direction: "outgoing", startedAt: new Date(Date.now() - 172800000).toISOString(), hue: 160 },
  ];

  const displayCalls = calls.length > 0 ? calls : sampleCalls;

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pb-2 pt-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">Spatial</div>
        <h1 className="font-display text-4xl text-foreground">Calls</h1>
      </div>
      <div className="px-5">
        <GlassCard strong className="flex items-center gap-3 p-3">
          <button onClick={() => go("call")} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-[oklch(0.16_0.04_285)]" style={{ background: "linear-gradient(120deg, var(--lavender), var(--blush))" }}>
            <Video className="h-4 w-4" /> New video
          </button>
          <button onClick={() => go("call")} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl glass text-[13px] font-semibold text-foreground">
            <Phone className="h-4 w-4" /> Voice
          </button>
        </GlassCard>
      </div>
      <div className="mt-3 flex flex-col gap-1 px-3">
        {displayCalls.map((c) => (
          <button key={c.id} onClick={() => go("call", { callName: c.name, callType: c.type })} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left active:bg-foreground/5">
            <Avatar name={c.name} hue={c.hue} />
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-semibold text-foreground">{c.name}</div>
              <div className={`text-[11.5px] ${c.status === "missed" ? "text-[var(--blush)]" : "text-foreground/55"}`}>
                {c.type === "video" ? "Video" : "Voice"} • {c.direction === "incoming" ? "Incoming" : "Outgoing"}{c.status === "missed" && " • missed"}
              </div>
            </div>
            <span className="text-[11px] text-foreground/40">{formatTime(c.startedAt)}</span>
            <button className="grid h-9 w-9 place-items-center rounded-full glass"><Phone className="h-4 w-4" /></button>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommunitiesTab() { return <DiscoverScreen embedded />; }

function AiTab() {
  const { go } = useNav();
  return (
    <div className="flex flex-1 flex-col px-5 pt-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">Companion</div>
        <h1 className="font-display text-4xl text-foreground">Lumina <span className="aurora-text italic">AI</span></h1>
      </div>
      <GlassCard strong className="relative mt-4 overflow-hidden p-5">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full blur-2xl opacity-60" style={{ background: "conic-gradient(from 0deg, var(--lavender), var(--blush), var(--sky), var(--mint), var(--lavender))" }} />
        <div className="relative">
          <Sparkles className="h-6 w-6 text-foreground" />
          <div className="mt-3 font-display text-2xl text-foreground">How can I help today?</div>
          <p className="mt-1 text-[12px] text-foreground/60">Draft messages, translate, summarize threads, or generate a sticker.</p>
          <button onClick={() => go("ai")} className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[12px] font-semibold text-[oklch(0.16_0.04_285)]">Open assistant <ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
      </GlassCard>
      <div className="mt-5 text-[11px] uppercase tracking-[0.2em] text-foreground/40">Quick tools</div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {[
          { i: <Wand2 className="h-5 w-5" />, t: "Rewrite", b: "Sharpen tone" },
          { i: <Languages className="h-5 w-5" />, t: "Translate", b: "60+ languages" },
          { i: <FileText className="h-5 w-5" />, t: "Summarize", b: "Catch up fast" },
          { i: <ImageIcon className="h-5 w-5" />, t: "Imagine", b: "Generate a sticker" },
          { i: <Calendar className="h-5 w-5" />, t: "Schedule", b: "Smart times" },
          { i: <Cpu className="h-5 w-5" />, t: "Code", b: "Write or explain" },
        ].map((q) => (
          <button key={q.t} onClick={() => go("ai")} className="flex flex-col gap-2 rounded-2xl glass p-4 text-left transition active:scale-95">
            <span className="grid h-10 w-10 place-items-center rounded-xl glass-strong">{q.i}</span>
            <div className="text-[13.5px] font-semibold text-foreground">{q.t}</div>
            <div className="text-[11px] text-foreground/55">{q.b}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   9. Chat
   ========================================================= */

type Msg = { id: string; from: "me" | "them"; text?: string; emoji?: string; sticker?: string; time?: string; reactions?: string[]; reply?: string };

function ChatScreen() {
  const { go, params } = useNav();
  const convId = params.convId as string | undefined;
  const chatName = (params.name as string) ?? "Chat";
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [recording, setRecording] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [reactingId, setReactingId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMsgId = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load messages on mount
  useEffect(() => {
    if (!convId) {
      // Fallback sample messages when no real conversation
      setMsgs([
        { id: "1", from: "them", text: "okay but the new theme is unreal 🪩", time: "9:38" },
        { id: "2", from: "me", text: "I told you — Lumina hits different.", time: "9:38", reactions: ["💗"] },
        { id: "3", from: "them", text: "the aurora gradient on the bubbles??", time: "9:39" },
        { id: "4", from: "me", emoji: "✨", time: "9:39" },
        { id: "5", from: "them", text: "send me a sticker, prove it 😤", time: "9:40", reply: "I told you — Lumina hits different." },
      ]);
      return;
    }
    (async () => {
      try {
        const { getMessages } = await import("../../backend/api/messages");
        const res = await getMessages({ data: { conversationId: convId } });
        const mapped: Msg[] = res.messages.map((m) => ({
          id: m.id,
          from: m.isMe ? "me" : "them",
          text: m.text ?? undefined,
          emoji: m.emoji ?? undefined,
          sticker: m.sticker ?? undefined,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setMsgs(mapped);
        if (res.messages.length > 0) {
          lastMsgId.current = res.messages[res.messages.length - 1]!.id;
        }
        // Mark as read
        const { markRead } = await import("../../backend/api/conversations");
        await markRead({ data: { conversationId: convId } });
      } catch { /* keep empty */ }
    })();
  }, [convId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!convId) return;
    pollRef.current = setInterval(async () => {
      if (!lastMsgId.current) return;
      try {
        const { pollMessages } = await import("../../backend/api/messages");
        const res = await pollMessages({ data: { conversationId: convId, afterId: lastMsgId.current } });
        if (res.messages.length > 0) {
          const newMsgs: Msg[] = res.messages.map((m) => ({
            id: m.id,
            from: m.isMe ? "me" : "them",
            text: m.text ?? undefined,
            emoji: m.emoji ?? undefined,
            sticker: m.sticker ?? undefined,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
          setMsgs((prev) => [...prev, ...newMsgs]);
          lastMsgId.current = res.messages[res.messages.length - 1]!.id;
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [convId]);

  const addReaction = (id: string, emo: string) => {
    setMsgs((m) => m.map((x) => x.id === id ? { ...x, reactions: Array.from(new Set([...(x.reactions ?? []), emo])) } : x));
    setReactingId(null);
  };

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    // Optimistic update
    const tempId = String(Date.now());
    setMsgs((m) => [...m, { id: tempId, from: "me", text, time: "now" }]);
    setBurstKey((k) => k + 1);

    if (convId) {
      try {
        const { sendMessage } = await import("../../backend/api/messages");
        const result = await sendMessage({ data: { conversationId: convId, text } });
        // Replace temp message with real one
        setMsgs((m) => m.map((msg) => msg.id === tempId ? { ...msg, id: result.id, time: new Date(result.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } : msg));
        lastMsgId.current = result.id;
      } catch {
        // Mark as failed but keep visible
      }
    } else {
      // Demo mode — auto reply
      setTimeout(() => {
        setMsgs((m) => [...m, { id: String(Date.now() + 1), from: "them", text: "ok yeah this is wild", time: "now" }]);
      }, 1200);
    }
  };
  const sendSticker = async (s: string) => {
    setMsgs((m) => [...m, { id: String(Date.now()), from: "me", sticker: s, time: "now" }]);
    setShowStickers(false);
    if (convId) {
      try {
        const { sendMessage } = await import("../../backend/api/messages");
        const result = await sendMessage({ data: { conversationId: convId, sticker: s } });
        lastMsgId.current = result.id;
      } catch { /* ignore */ }
    }
  };
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/5 px-4">
        <button onClick={() => go("home")} className="grid h-10 w-10 place-items-center rounded-full glass"><ArrowLeft className="h-4 w-4" /></button>
        <Avatar name={chatName} size={36} hue={chatName.charCodeAt(0) % 360} />
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-foreground">{chatName}</div>
          <div className="flex items-center gap-1 text-[10.5px] text-[var(--mint)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)]" /> online</div>
        </div>
        <button onClick={() => go("call")} className="grid h-9 w-9 place-items-center rounded-full glass"><Video className="h-4 w-4" /></button>
        <button onClick={() => go("call")} className="grid h-9 w-9 place-items-center rounded-full glass"><Phone className="h-4 w-4" /></button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4 pt-4 no-scrollbar">
        <div className="mx-auto rounded-full glass px-3 py-1 text-[10px] text-foreground/60">Today</div>
        {msgs.map((m, i) => (
          <div
            key={m.id}
            onContextMenu={(e) => { e.preventDefault(); setReactingId(m.id); }}
            onTouchStart={() => { longPressTimer.current = setTimeout(() => setReactingId(m.id), 420); }}
            onTouchEnd={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
            onTouchMove={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
            className="relative"
          >
            <Bubble msg={m} delay={i * 0.04} />
            {reactingId === m.id && (
              <div className={`absolute -top-10 ${m.from === "me" ? "right-2" : "left-12"} z-20 flex items-center gap-1 rounded-full glass-strong px-2 py-1.5 lumi-reaction-pop`}>
                {["💗","🔥","🥹","✨","🪩","➕"].map((e) => (
                  <button key={e} onClick={() => e === "➕" ? setReactingId(null) : addReaction(m.id, e)} className="grid h-7 w-7 place-items-center rounded-full text-base active:scale-90 transition-transform">{e}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="flex items-end gap-2">
          <Avatar name={chatName} size={26} hue={chatName.charCodeAt(0) % 360} />
          <div className="flex h-9 items-center gap-1 rounded-2xl rounded-bl-md glass px-3">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 lumi-typing-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 lumi-typing-dot" style={{ animationDelay: "0.2s" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 lumi-typing-dot" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>

      {showStickers && (
        <div className="lumi-slide-up border-t border-white/10 bg-[oklch(0.15_0.04_285_/_0.9)] p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-foreground">Premium stickers <span className="ml-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] text-foreground/70">3D</span></div>
            <button onClick={() => setShowStickers(false)}><X className="h-4 w-4 text-foreground/60" /></button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {["🪩","✨","💗","🔥","🥹","🪐","🌈","☁️","💎","🫧"].map((s) => (
              <button key={s} onClick={() => sendSticker(s)} className="grid h-14 place-items-center rounded-2xl glass text-3xl active:scale-90">{s}</button>
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 px-3 pb-3">
        {recording ? (
          <div className="flex items-center gap-3 rounded-3xl glass-strong p-3 lumi-rise">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-destructive/80 lumi-rec"><Mic className="h-4 w-4 text-white" /></span>
            <div className="flex flex-1 items-center gap-[3px]">
              {Array.from({ length: 28 }).map((_, i) => (
                <span key={i} className="block w-[3px] rounded-full bg-[var(--lavender)] lumi-wave" style={{ height: `${6 + ((i * 7) % 22)}px`, animationDelay: `${i * 0.04}s` }} />
              ))}
            </div>
            <span className="text-[11px] tabular-nums text-foreground/70">0:04</span>
            <button onClick={() => setRecording(false)} className="grid h-9 w-9 place-items-center rounded-full glass"><X className="h-4 w-4" /></button>
            <button onClick={() => { setRecording(false); setMsgs((m) => [...m, { id: String(Date.now()), from: "me", text: "🎙 voice note · 0:04", time: "now" }]); }} className="grid h-9 w-9 place-items-center rounded-full text-[oklch(0.16_0.04_285)]" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}><Send className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="relative flex items-end gap-2 rounded-3xl glass-strong p-2">
            <button className="grid h-10 w-10 place-items-center rounded-full text-foreground/70"><Paperclip className="h-4.5 w-4.5" /></button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Message ${chatName}…`}
              className="min-h-10 flex-1 bg-transparent px-1 text-[14px] text-foreground placeholder:text-foreground/40 focus:outline-none"
            />
            <button onClick={() => setShowStickers((s) => !s)} className="grid h-10 w-10 place-items-center rounded-full text-foreground/70"><Smile className="h-4.5 w-4.5" /></button>
            {input.trim() ? (
              <button onClick={send} className="relative grid h-10 w-10 place-items-center rounded-full text-[oklch(0.16_0.04_285)] active:scale-90 transition-transform" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>
                <Send className="h-4 w-4" />
                {burstKey > 0 && (
                  <span key={burstKey} className="pointer-events-none absolute inset-0">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const angle = (i / 10) * Math.PI * 2;
                      const tx = `${Math.cos(angle) * 30}px`;
                      const ty = `${Math.sin(angle) * 30}px`;
                      const colors = ["var(--lavender)", "var(--blush)", "var(--sky)", "var(--mint)"];
                      return (
                        <span key={i} className="lumi-burst-dot left-1/2 top-1/2" style={{ ["--tx" as string]: tx, ["--ty" as string]: ty, background: colors[i % 4] } as React.CSSProperties} />
                      );
                    })}
                  </span>
                )}
              </button>
            ) : (
              <button onClick={() => setRecording(true)} className="grid h-10 w-10 place-items-center rounded-full glass text-foreground/80 active:scale-90 transition-transform"><Mic className="h-4 w-4" /></button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({ msg, delay }: { msg: Msg; delay: number }) {
  const me = msg.from === "me";
  if (msg.sticker) {
    return (
      <div className={`lumi-bubble flex ${me ? "justify-end" : "justify-start"}`} style={{ animationDelay: `${delay}s` }}>
        <div className="text-6xl">{msg.sticker}</div>
      </div>
    );
  }
  if (msg.emoji) {
    return (
      <div className={`lumi-bubble flex ${me ? "justify-end" : "justify-start"}`} style={{ animationDelay: `${delay}s` }}>
        <div className="text-5xl">{msg.emoji}</div>
      </div>
    );
  }
  return (
    <div className={`lumi-bubble flex ${me ? "justify-end" : "justify-start"}`} style={{ animationDelay: `${delay}s` }}>
      <div className={`relative max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px] ${me ? "rounded-br-md text-[oklch(0.16_0.04_285)]" : "rounded-bl-md glass text-foreground"}`}
        style={me ? { background: "linear-gradient(135deg, var(--lavender), var(--blush) 60%, var(--sky))" } : undefined}>
        {msg.reply && (
          <div className={`mb-1.5 border-l-2 pl-2 text-[11px] ${me ? "border-white/40 text-foreground/70" : "border-white/30 text-foreground/60"}`}>{msg.reply}</div>
        )}
        {msg.text}
        <div className={`mt-0.5 text-right text-[9.5px] ${me ? "text-[oklch(0.16_0.04_285_/_0.7)]" : "text-foreground/40"}`}>{msg.time}{me && " ✓✓"}</div>
        {msg.reactions && (
          <div className="absolute -bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-[oklch(0.15_0.04_285)] px-1.5 py-0.5 text-[10px]">
            {msg.reactions.map((r) => <span key={r}>{r}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   10. Group chat
   ========================================================= */

function GroupChatScreen() {
  const { go, params } = useNav();
  const convId = params.convId as string | undefined;
  const groupName = (params.name as string) ?? "Studio Lumen";
  const [msgs, setMsgs] = useState<{ id: string; senderName: string; senderId: string; text?: string; isMe: boolean; hue: number }[]>([]);
  const [input, setInput] = useState("");
  const [members, setMembers] = useState<{ id: string; fullName: string; username: string }[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const lastMsgId = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load group details and messages
  useEffect(() => {
    if (!convId) return;
    (async () => {
      try {
        const { getGroupDetails } = await import("../../backend/api/groups");
        const details = await getGroupDetails({ data: { conversationId: convId } });
        setMembers(details.members.map((m) => ({ id: m.id, fullName: m.fullName, username: m.username })));
        setMemberCount(details.memberCount);
      } catch { /* ignore */ }
      try {
        const { getMessages } = await import("../../backend/api/messages");
        const res = await getMessages({ data: { conversationId: convId } });
        setMsgs(res.messages.map((m) => ({
          id: m.id,
          senderName: m.senderName,
          senderId: m.senderId,
          text: m.text ?? m.emoji ?? m.sticker ?? undefined,
          isMe: m.isMe,
          hue: m.senderName.charCodeAt(0) % 360,
        })));
        if (res.messages.length > 0) lastMsgId.current = res.messages[res.messages.length - 1]!.id;
        const { markRead } = await import("../../backend/api/conversations");
        await markRead({ data: { conversationId: convId } });
      } catch { /* ignore */ }
    })();
  }, [convId]);

  // Poll for new messages
  useEffect(() => {
    if (!convId) return;
    pollRef.current = setInterval(async () => {
      if (!lastMsgId.current) return;
      try {
        const { pollMessages } = await import("../../backend/api/messages");
        const res = await pollMessages({ data: { conversationId: convId, afterId: lastMsgId.current } });
        if (res.messages.length > 0) {
          setMsgs((prev) => [...prev, ...res.messages.map((m) => ({
            id: m.id,
            senderName: m.senderName,
            senderId: m.senderId,
            text: m.text ?? m.emoji ?? m.sticker ?? undefined,
            isMe: m.isMe,
            hue: m.senderName.charCodeAt(0) % 360,
          }))]);
          lastMsgId.current = res.messages[res.messages.length - 1]!.id;
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [convId]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    const tempId = String(Date.now());
    setMsgs((m) => [...m, { id: tempId, senderName: "You", senderId: "", text, isMe: true, hue: 0 }]);
    if (convId) {
      try {
        const { sendMessage } = await import("../../backend/api/messages");
        const result = await sendMessage({ data: { conversationId: convId, text } });
        setMsgs((m) => m.map((msg) => msg.id === tempId ? { ...msg, id: result.id } : msg));
        lastMsgId.current = result.id;
      } catch { /* ignore */ }
    }
  };

  // Fallback sample data when no real conversation
  const showSample = !convId;

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <div className="flex h-14 items-center gap-3 border-b border-white/5 px-4">
        <button onClick={() => go("home")} className="grid h-10 w-10 place-items-center rounded-full glass"><ArrowLeft className="h-4 w-4" /></button>
        <div className="flex -space-x-2">
          {(members.length > 0 ? members.slice(0, 3) : [{ fullName: "E L" }, { fullName: "M K" }, { fullName: "J P" }]).map((m, i) => (
            <Avatar key={i} name={m.fullName} size={28} hue={m.fullName.charCodeAt(0) % 360} />
          ))}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-foreground">{groupName}</div>
          <div className="text-[10.5px] text-foreground/55">{memberCount || 8} members</div>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-full glass"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        {[
          { i: <Hash className="h-3.5 w-3.5" />, t: "general", active: true },
          { i: <BellRing className="h-3.5 w-3.5" />, t: "announcements" },
          { i: <Headphones className="h-3.5 w-3.5" />, t: "voice-room" },
          { i: <Folder className="h-3.5 w-3.5" />, t: "files" },
        ].map((c) => (
          <span key={c.t} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] ${c.active ? "bg-foreground text-background" : "glass text-foreground/80"}`}>
            {c.i}{c.t}
          </span>
        ))}
      </div>
      {showSample && (
        <GlassCard strong className="mx-4 mb-3 flex items-center gap-3 p-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--blush)]/30"><BellRing className="h-4 w-4 text-[var(--blush)]" /></div>
          <div className="flex-1">
            <div className="text-[12.5px] font-semibold text-foreground">Announcement · Eli</div>
            <div className="text-[11px] text-foreground/60">Shipping v3.2 tonight — final review at 8pm.</div>
          </div>
          <Crown className="h-4 w-4 text-[var(--lavender)]" />
        </GlassCard>
      )}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4 no-scrollbar">
        {showSample ? (
          <>
            <GroupMsg name="Eli" hue={210} role="Admin">Final pass on the chat bubble shadows — please pull and review 🪩</GroupMsg>
            <GroupMsg name="Mira" hue={295}>they look insane. ship it.</GroupMsg>
            <GroupMsg name="Eli" hue={210} role="Admin">also: voice room at 8pm 🎧</GroupMsg>
            <GroupMsg me>on it — pulling now</GroupMsg>
          </>
        ) : (
          msgs.map((m) => (
            <GroupMsg key={m.id} name={m.isMe ? undefined : m.senderName} hue={m.hue} me={m.isMe}>{m.text}</GroupMsg>
          ))
        )}
      </div>
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-3xl glass-strong p-2">
          <button className="grid h-10 w-10 place-items-center rounded-full text-foreground/70"><Plus className="h-4 w-4" /></button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message #general…`}
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground/40 focus:outline-none"
          />
          <button className="grid h-10 w-10 place-items-center rounded-full glass"><Mic className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function GroupMsg({ name, hue, role, children, me }: { name?: string; hue?: number; role?: string; children: ReactNode; me?: boolean }) {
  if (me) return <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md px-3.5 py-2 text-[14px] text-[oklch(0.16_0.04_285)]" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>{children}</div>;
  return (
    <div className="flex items-end gap-2">
      <Avatar name={name!} size={28} hue={hue} />
      <div className="max-w-[78%] rounded-2xl rounded-bl-md glass px-3.5 py-2 text-[14px] text-foreground">
        <div className="mb-0.5 flex items-center gap-1.5 text-[10.5px] text-foreground/60">
          {name}{role && <span className="rounded-full bg-[var(--lavender)]/20 px-1.5 py-0.5 text-[9px] text-[var(--lavender)]">{role}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   11. AI assistant full screen
   ========================================================= */

function AiScreen() {
  const [msgs, setMsgs] = useState<{ from: "me" | "ai"; text: string }[]>([
    { from: "ai", text: "Hi ✨ — I can draft a message, translate, summarize a thread, or imagine a sticker. What's first?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // Load history on mount
  useEffect(() => {
    (async () => {
      try {
        const { getAiHistory } = await import("../../backend/api/ai");
        const history = await getAiHistory();
        if (history.length > 0) {
          setMsgs(history.map((m) => ({ from: m.role === "user" ? "me" : "ai", text: m.content })));
        }
      } catch { /* use default greeting */ }
    })();
  }, []);

  const send = async () => {
    if (!input.trim() || thinking) return;
    const v = input;
    setMsgs((m) => [...m, { from: "me", text: v }]);
    setInput("");
    setThinking(true);
    try {
      const { sendAiMessage } = await import("../../backend/api/ai");
      const res = await sendAiMessage({ data: { message: v } });
      setMsgs((m) => [...m, { from: "ai", text: res.content }]);
    } catch {
      setMsgs((m) => [...m, { from: "ai", text: "Sorry, something went wrong. Try again?" }]);
    } finally {
      setThinking(false);
    }
  };
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title={<span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Lumina AI</span>} subtitle="Private · ends here" />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 no-scrollbar">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            {m.from === "ai" && (
              <div className="mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: "conic-gradient(from 0deg, var(--lavender), var(--blush), var(--sky), var(--mint), var(--lavender))" }}>
                <Sparkles className="h-3.5 w-3.5 text-[oklch(0.16_0.04_285)]" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] ${m.from === "me" ? "rounded-br-md text-[oklch(0.16_0.04_285)]" : "rounded-bl-md glass text-foreground"}`}
              style={m.from === "me" ? { background: "linear-gradient(135deg, var(--lavender), var(--blush))" } : undefined}>
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: "conic-gradient(from 0deg, var(--lavender), var(--blush), var(--sky), var(--mint), var(--lavender))" }}>
              <Sparkles className="h-3.5 w-3.5 text-[oklch(0.16_0.04_285)]" />
            </div>
            <div className="flex h-9 items-center gap-1 rounded-2xl rounded-bl-md glass px-3">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 lumi-typing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 lumi-typing-dot" style={{ animationDelay: "0.2s" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 lumi-typing-dot" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
        {["Rewrite softer", "Translate to JP", "Summarize this thread", "Imagine a sticker"].map((s) => (
          <button key={s} onClick={() => setInput(s)} className="shrink-0 rounded-full glass px-3 py-1.5 text-[11.5px] text-foreground/80">{s}</button>
        ))}
      </div>
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-3xl glass-strong p-2">
          <button className="grid h-10 w-10 place-items-center rounded-full text-foreground/70"><Mic className="h-4 w-4" /></button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask Lumina anything…" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground/40 focus:outline-none" />
          <button onClick={send} className="grid h-10 w-10 place-items-center rounded-full text-[oklch(0.16_0.04_285)]" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   12. Call
   ========================================================= */

function CallScreen() {
  const { go, params } = useNav();
  const callName = (params.callName as string) ?? "Nori";
  const callType = (params.callType as string) ?? "voice";
  const [t, setT] = useState(0);
  const callIdRef = useRef<string | null>(null);

  useEffect(() => { const id = setInterval(() => setT((x) => x + 1), 1000); return () => clearInterval(id); }, []);

  // Log call start (fire-and-forget, doesn't block UI)
  useEffect(() => {
    (async () => {
      try {
        const { startCall } = await import("../../backend/api/calls");
        // We'd need a receiverId — for now just log with a placeholder
        // In production, the callName/params would carry the user ID
        const receiverId = (params.receiverId as string) ?? "";
        if (receiverId) {
          const res = await startCall({ data: { receiverId, type: callType as "voice" | "video" } });
          callIdRef.current = res.callId;
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const hangUp = async () => {
    if (callIdRef.current) {
      try {
        const { endCall } = await import("../../backend/api/calls");
        await endCall({ data: { callId: callIdRef.current, duration: t } });
      } catch { /* ignore */ }
    }
    go("home");
  };

  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 30% 20%, var(--lavender), transparent 50%), radial-gradient(circle at 70% 80%, var(--blush), transparent 50%), oklch(0.10 0.04 285)" }} />
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-2">
        <button onClick={() => go("home")} className="grid h-10 w-10 place-items-center rounded-full glass"><ChevronDown className="h-4 w-4" /></button>
        <div className="rounded-full glass px-3 py-1 text-[11px] text-foreground">Spatial audio · HD</div>
        <button className="grid h-10 w-10 place-items-center rounded-full glass"><MoreHorizontal className="h-4 w-4" /></button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <div className="relative">
          <div className="absolute -inset-6 rounded-full lumi-glow-ring" />
          <div className="relative h-36 w-36 overflow-hidden rounded-full" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>
            <div className="grid h-full w-full place-items-center text-4xl font-semibold text-foreground">{callName.charAt(0)}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="font-display text-4xl text-foreground">{callName}</div>
          <div className="mt-1 text-[12.5px] text-foreground/60 tabular-nums">{mm}:{ss} · encrypted</div>
        </div>
        <div className="flex h-12 items-end gap-1">
          {Array.from({ length: 26 }).map((_, i) => (
            <span key={i} className="lumi-wave w-1 rounded-full bg-foreground/70" style={{ height: `${20 + (i % 7) * 6}px`, animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>
        <GlassCard className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)]" /> Live captions: "and that's why the gradient feels so alive…"
        </GlassCard>
      </div>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-4 gap-3">
          {[
            { i: <Mic className="h-5 w-5" />, l: "Mute" },
            { i: <Video className="h-5 w-5" />, l: "Video" },
            { i: <ScreenShare className="h-5 w-5" />, l: "Share" },
            { i: <Volume2 className="h-5 w-5" />, l: "Speaker" },
          ].map((b) => (
            <button key={b.l} className="flex flex-col items-center gap-1">
              <span className="grid h-14 w-14 place-items-center rounded-full glass-strong text-foreground">{b.i}</span>
              <span className="text-[10.5px] text-foreground/60">{b.l}</span>
            </button>
          ))}
        </div>
        <button onClick={hangUp} className="mx-auto mt-6 grid h-16 w-16 place-items-center rounded-full bg-[oklch(0.65_0.22_22)] text-foreground shadow-[0_20px_40px_-10px_oklch(0.65_0.22_22/0.6)] transition-transform active:scale-90">
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   13. Discover
   ========================================================= */

function DiscoverScreen({ embedded = false }: { embedded?: boolean }) {
  const { go } = useNav();
  return (
    <div className="flex flex-1 flex-col">
      {!embedded && <><StatusBar /><TopBar title="Explore" /></>}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 pt-3 no-scrollbar">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">Explore</div>
          <h1 className="font-display text-4xl text-foreground">Find your <span className="aurora-text italic">people</span>.</h1>
        </div>
        <GlassCard className="flex h-12 items-center gap-3 px-4">
          <Search className="h-4 w-4 text-foreground/60" />
          <input placeholder="Search communities, creators, themes" className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-foreground/40 focus:outline-none" />
        </GlassCard>
        <Section title="Trending communities" right="See all">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {[
              { t: "Aurora Design", m: "12.4k", hue: 295 },
              { t: "Late Night Code", m: "8.1k", hue: 210 },
              { t: "Film Photo Club", m: "5.7k", hue: 30 },
              { t: "Plant Parents", m: "3.2k", hue: 160 },
            ].map((c) => (
              <button key={c.t} onClick={() => go("community", { name: c.t, hue: c.hue })} className="relative w-44 shrink-0 overflow-hidden p-4 rounded-3xl glass text-left active:scale-[0.98] transition-transform">
                <div className="absolute inset-0 -z-10 opacity-50" style={{ background: `radial-gradient(circle at 20% 20%, oklch(0.7 0.18 ${c.hue}), transparent 60%)` }} />
                <Users className="h-5 w-5 text-foreground" />
                <div className="mt-3 text-[14px] font-semibold text-foreground">{c.t}</div>
                <div className="text-[11px] text-foreground/55">{c.m} members</div>
                <span className="mt-3 inline-block rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-[oklch(0.16_0.04_285)]">Join</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Trending stickers" right="Open studio">
          <div className="grid grid-cols-4 gap-2.5">
            {["🪩","✨","🪐","🌈","💎","🫧","🔥","☁️"].map((s) => (
              <div key={s} className="grid h-16 place-items-center rounded-2xl glass text-3xl">{s}</div>
            ))}
          </div>
        </Section>

        <Section title="Featured creators">
          <div className="flex flex-col gap-2">
            {[
              { n: "Mira Okafor", b: "Designer · Studio Lumen", hue: 295 },
              { n: "Eli Tran", b: "Engineer · Aurora kit", hue: 210 },
              { n: "Sora Aoki", b: "Photographer · 35mm", hue: 30 },
            ].map((p) => (
              <button key={p.n} onClick={() => go("creator", { name: p.n, hue: p.hue })} className="flex items-center gap-3 p-3 rounded-3xl glass text-left active:bg-foreground/5">
                <Avatar name={p.n} hue={p.hue} />
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold text-foreground">{p.n}</div>
                  <div className="text-[11px] text-foreground/55">{p.b}</div>
                </div>
                <span className="rounded-full glass px-3 py-1 text-[11px] font-semibold text-foreground">Follow</span>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, right, children }: { title: string; right?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        {right && <button className="text-[11px] text-foreground/60">{right}</button>}
      </div>
      {children}
    </div>
  );
}

/* =========================================================
   14. Settings
   ========================================================= */

function SettingsScreen({ embedded = false }: { embedded?: boolean }) {
  const { go } = useNav();
  const [profileName, setProfileName] = useState("You");
  const [profileHandle, setProfileHandle] = useState("@you");
  const [profileStatus, setProfileStatus] = useState("");

  // Load user data
  useEffect(() => {
    (async () => {
      try {
        const { getProfile } = await import("../../backend/api/profile");
        const p = await getProfile();
        if (p) {
          setProfileName(p.fullName);
          setProfileHandle(`@${p.username}`);
          setProfileStatus(p.status ?? "");
        }
      } catch { /* use defaults */ }
    })();
  }, []);

  const rows: { i: ReactNode; t: string; b?: string; to?: Screen; danger?: boolean; right?: ReactNode }[] = [
    { i: <Shield className="h-4.5 w-4.5" />, t: "Security", b: "Passkeys, devices, backups", to: "security" },
    { i: <Crown className="h-4.5 w-4.5" />, t: "Lumina Premium", b: "4K, AI, exclusive stickers", to: "premium" },
    { i: <BellRing className="h-4.5 w-4.5" />, t: "Notifications", b: "Mentions, calls, AI suggestions", to: "notifSettings" },
    { i: <PaintBucket className="h-4.5 w-4.5" />, t: "Appearance", b: "Theme & accent", to: "appearance" },
    { i: <Globe className="h-4.5 w-4.5" />, t: "Language", b: "English (US)", to: "language" },
    { i: <Download className="h-4.5 w-4.5" />, t: "Storage", b: "1.4 GB used", to: "storage" },
    { i: <Type className="h-4.5 w-4.5" />, t: "Accessibility", to: "accessibility" },
    { i: <HelpCircle className="h-4.5 w-4.5" />, t: "Help & Support", to: "help" },
    { i: <Share2 className="h-4.5 w-4.5" />, t: "Invite friends", to: "invite" },
  ];
  return (
    <div className="flex flex-1 flex-col">
      {!embedded && <><StatusBar /><TopBar title="Settings" /></>}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4 pt-3 no-scrollbar">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">You</div>
          <h1 className="font-display text-4xl text-foreground">Settings</h1>
        </div>
        <button onClick={() => go("profile")} className="flex items-center gap-3 rounded-3xl glass-strong p-4 text-left active:scale-[0.99]">
          <Avatar name={profileName} size={56} hue={295} />
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-foreground">{profileName}</div>
            <div className="text-[11.5px] text-foreground/55">{profileHandle}{profileStatus ? ` · ${profileStatus}` : ""}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/40" />
        </button>

        <GlassCard className="overflow-hidden">
          {rows.map((r, i) => (
            <button key={r.t} onClick={() => r.to && go(r.to)} className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-foreground/5 ${i ? "border-t border-white/5" : ""}`}>
              <span className="grid h-9 w-9 place-items-center rounded-xl glass-strong text-foreground">{r.i}</span>
              <div className="flex-1">
                <div className="text-[14px] font-medium text-foreground">{r.t}</div>
                {r.b && <div className="text-[11px] text-foreground/50">{r.b}</div>}
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/30" />
            </button>
          ))}
        </GlassCard>

        <GlassCard className="overflow-hidden">
          <button onClick={() => go("logout")} className="flex w-full items-center gap-3 px-4 py-3 text-left text-foreground active:bg-foreground/5">
            <LogOut className="h-4.5 w-4.5" /> Log out
          </button>
          <button onClick={() => go("delete")} className="flex w-full items-center gap-3 border-t border-white/5 px-4 py-3 text-left text-[oklch(0.75_0.22_22)] active:bg-foreground/5">
            <Trash2 className="h-4.5 w-4.5" /> Delete account
          </button>
        </GlassCard>
        <div className="pt-3 text-center text-[10px] text-foreground/40">Lumina · v1.0 · made luminous</div>
      </div>
    </div>
  );
}

/* =========================================================
   15. Security
   ========================================================= */

function SecurityScreen() {
  const items = [
    { i: <KeyRound className="h-4 w-4" />, t: "Passkey", b: "Sign in without a password" },
    { i: <ScanFace className="h-4 w-4" />, t: "Face ID", b: "Unlock and confirm" },
    { i: <Fingerprint className="h-4 w-4" />, t: "Touch ID", b: "Quick unlock" },
    { i: <Shield className="h-4 w-4" />, t: "Two-factor", b: "Authenticator app" },
    { i: <Headphones className="h-4 w-4" />, t: "Devices", b: "3 active" },
    { i: <FileText className="h-4 w-4" />, t: "Session history" },
    { i: <Cloud className="h-4 w-4" />, t: "Encrypted backup", b: "iCloud · last 2h ago" },
    { i: <Eye className="h-4 w-4" />, t: "Login history" },
    { i: <KeyRound className="h-4 w-4" />, t: "Recovery keys" },
    { i: <ShieldCheck className="h-4 w-4" />, t: "Privacy dashboard" },
    { i: <X className="h-4 w-4" />, t: "Blocked users" },
    { i: <Lock className="h-4 w-4" />, t: "Hidden chats" },
    { i: <Bookmark className="h-4 w-4" />, t: "Secret vault", b: "Private, biometric-locked" },
  ];
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Security" />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4 no-scrollbar">
        <GlassCard strong className="relative overflow-hidden p-5">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl opacity-60" style={{ background: "var(--mint)" }} />
          <ShieldCheck className="h-6 w-6 text-foreground" />
          <div className="mt-2 font-display text-2xl text-foreground">You're protected.</div>
          <p className="mt-1 text-[12px] text-foreground/60">End-to-end encrypted with Kyber-1024 + AES-256.</p>
          <div className="mt-3 flex gap-2 text-[10.5px]">
            <span className="rounded-full bg-[var(--mint)]/20 px-2 py-0.5 text-[var(--mint)]">Passkey</span>
            <span className="rounded-full bg-[var(--lavender)]/20 px-2 py-0.5 text-[var(--lavender)]">2FA on</span>
            <span className="rounded-full bg-[var(--sky)]/20 px-2 py-0.5 text-[var(--sky)]">Backup synced</span>
          </div>
        </GlassCard>
        <GlassCard className="overflow-hidden">
          {items.map((it, i) => (
            <button key={it.t} className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-foreground/5 ${i ? "border-t border-white/5" : ""}`}>
              <span className="grid h-9 w-9 place-items-center rounded-xl glass-strong text-foreground">{it.i}</span>
              <div className="flex-1">
                <div className="text-[14px] font-medium text-foreground">{it.t}</div>
                {it.b && <div className="text-[11px] text-foreground/50">{it.b}</div>}
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/30" />
            </button>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}

/* =========================================================
   16. Premium
   ========================================================= */

function PremiumScreen() {
  const [plan, setPlan] = useState<"month" | "year">("year");
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { getPremiumStatus } = await import("../../backend/api/premium");
        const status = await getPremiumStatus();
        setIsPremium(status.isPremium);
        if (status.plan === "month" || status.plan === "year") setPlan(status.plan);
      } catch { /* ignore */ }
    })();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { startPremium } = await import("../../backend/api/premium");
      await startPremium({ data: { plan } });
      setIsPremium(true);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleCancel = async () => {
    try {
      const { cancelPremium } = await import("../../backend/api/premium");
      await cancelPremium();
      setIsPremium(false);
    } catch { /* ignore */ }
  };
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Lumina Premium" />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 no-scrollbar">
        <div className="relative mx-auto mt-2 grid h-24 w-24 place-items-center rounded-[28%] glass-strong">
          <div className="absolute inset-0 rounded-[28%] blur-2xl opacity-70" style={{ background: "conic-gradient(from 0deg, var(--lavender), var(--blush), var(--sky), var(--mint), var(--lavender))" }} />
          <Crown className="relative h-9 w-9 text-foreground" />
        </div>
        <h1 className="text-center font-display text-4xl text-foreground">Go <span className="aurora-text italic">Premium</span></h1>
        <p className="-mt-2 text-center text-[13px] text-foreground/60">Unreal stickers. 4K media. AI everywhere.</p>

        <div className="flex rounded-2xl glass p-1">
          {(["month", "year"] as const).map((p) => (
            <button key={p} onClick={() => setPlan(p)} className={`relative flex-1 rounded-xl py-2.5 text-[12.5px] font-semibold transition-all ${plan === p ? "bg-foreground text-background" : "text-foreground/70"}`}>
              {p === "month" ? "Monthly" : "Yearly"}
              {p === "year" && plan !== p && <span className="absolute -right-1 -top-1 rounded-full bg-[var(--mint)] px-1.5 py-0.5 text-[9px] text-[oklch(0.16_0.04_285)]">-40%</span>}
            </button>
          ))}
        </div>

        <GlassCard strong className="relative overflow-hidden p-5">
          <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full blur-3xl opacity-60" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }} />
          <div className="relative flex items-baseline gap-1">
            <span className="font-display text-5xl text-foreground">${plan === "year" ? "5.99" : "9.99"}</span>
            <span className="text-[12px] text-foreground/60">/ month</span>
          </div>
          <div className="relative mt-1 text-[11.5px] text-foreground/60">{plan === "year" ? "Billed $71.88 yearly" : "Billed monthly"}</div>
          <ul className="relative mt-4 flex flex-col gap-2 text-[13px] text-foreground/85">
            {[
              "Exclusive 3D stickers + animated themes",
              "1 TB end-to-end encrypted cloud storage",
              "4K photo & video uploads",
              "Unlimited Lumina AI requests",
              "Premium aurora badge on your profile",
              "Priority human support",
            ].map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-[var(--mint)]" />{f}</li>)}
          </ul>
        </GlassCard>
        <PrimaryButton loading={loading} onClick={isPremium ? handleCancel : handleSubscribe} icon={<Sparkles className="h-4 w-4" />}>{isPremium ? "Cancel Premium" : "Start 7-day free trial"}</PrimaryButton>
        <div className="text-center text-[10.5px] text-foreground/40">{isPremium ? "You're on Premium ✨" : "Cancel anytime · auto-renew off after trial"}</div>
      </div>
    </div>
  );
}

/* =========================================================
   17. Profile
   ========================================================= */

function ProfileScreen() {
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <ProfileHeader />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-28 no-scrollbar">
        <ProfileCompletion />
        <ProfileIdentity />
        <ProfileStatsCard />
        <ProfileAboutCard />
        <ProfileQuickActions />
        <ProfileStories />
        <ProfileSettingsList />
      </div>
      <ProfileBottomNav />
    </div>
  );
}
function Stat({ n, l }: { n: string; l: string }) { return <div><div className="font-display text-2xl text-foreground">{n}</div><div className="text-[10.5px] text-foreground/50">{l}</div></div>; }

function ProfileHeader() {
  const { back, go } = useNav();
  return (
    <div className="flex h-14 items-center justify-between px-5">
      <button onClick={back} className="grid h-10 w-10 place-items-center rounded-full bg-foreground/5 active:scale-90">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button onClick={() => go("editProfile")} className="flex h-10 items-center gap-2 rounded-full bg-foreground/5 px-4 text-[13px] font-medium text-foreground active:scale-95 transition-transform">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        <span className="text-[var(--lavender)]">Edit Profile</span>
      </button>
    </div>
  );
}

function ProfileCompletion() {
  const { go } = useNav();
  const tasks = [
    { icon: <Camera className="h-3.5 w-3.5" />, label: "Add a profile photo" },
    { icon: <Type className="h-3.5 w-3.5" />, label: "Write a short bio" },
    { icon: <StarIcon className="h-3.5 w-3.5" />, label: "Pick your interests" },
  ];
  return (
    <button onClick={() => go("editProfile")} className="relative overflow-hidden rounded-3xl p-4 text-left active:scale-[0.99] transition-transform" style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 290 / 0.18), oklch(0.70 0.20 300 / 0.12))", border: "1px solid oklch(0.78 0.14 295 / 0.25)" }}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-foreground">Complete your profile</div>
          <div className="text-[11.5px] text-foreground/60">40% complete — finish to unlock more</div>
        </div>
        <ChevronRight className="h-4 w-4 text-foreground/40" />
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full rounded-full" style={{ width: "40%", background: "linear-gradient(90deg, var(--lavender), var(--blush))" }} />
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {tasks.map((t) => (
          <div key={t.label} className="flex items-center gap-2 text-[12px] text-foreground/80">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground/10 text-foreground/70">{t.icon}</span>
            {t.label}
          </div>
        ))}
      </div>
    </button>
  );
}

function ProfileIdentity() {
  return (
    <div className="flex items-start gap-4 pt-1">
      <div className="relative">
        <div className="rounded-full p-[3px]" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>
          <div className="rounded-full bg-background p-[3px]">
            <Avatar name="Noah Anderson" size={104} hue={295} />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-[oklch(0.78_0.18_150)] ring-2 ring-background" />
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[22px] font-bold text-foreground">Noah Anderson</span>
          <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--lavender)] text-[9px] font-bold text-white">✓</span>
        </div>
        <div className="text-[12.5px] text-foreground/55">@noah_07</div>
        <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-foreground/80">
          <span>Dreamer</span><span className="h-1 w-1 rounded-full bg-[var(--lavender)]" />
          <span>Designer</span><span className="h-1 w-1 rounded-full bg-[var(--lavender)]" />
          <span>Explorer</span>
        </div>
        <p className="mt-1.5 text-[13px] text-foreground/85 leading-snug">Building the future, one idea at a time. 🚀</p>
      </div>
    </div>
  );
}

function ChipMini({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1.5 text-[11.5px] text-foreground/80">
      <span className="text-foreground/55">{icon}</span>{children}
    </div>
  );
}

function ProfileStatsCard() {
  return (
    <>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <ChipMini icon={<MapPin className="h-3 w-3" />}>San Francisco, CA</ChipMini>
        <ChipMini icon={<Globe className="h-3 w-3" />}>beacons.ai/noah_07</ChipMini>
        <ChipMini icon={<Calendar className="h-3 w-3" />}>Joined Jan 2023</ChipMini>
      </div>
      <div className="grid grid-cols-4 gap-2 rounded-3xl bg-foreground/[0.04] p-4">
        <ProfileStat icon={<MessageCircle className="h-4 w-4" />} hue={290} n="128" l="Posts" />
        <ProfileStat icon={<Users className="h-4 w-4" />} hue={240} n="342" l="Followers" />
        <ProfileStat icon={<Users className="h-4 w-4" />} hue={170} n="175" l="Following" />
        <ProfileStat icon={<Heart className="h-4 w-4" />} hue={350} n="5.2K" l="Likes" />
      </div>
    </>
  );
}
function ProfileStat({ icon, hue, n, l }: { icon: ReactNode; hue: number; n: string; l: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `oklch(0.65 0.18 ${hue} / 0.18)`, color: `oklch(0.78 0.18 ${hue})` }}>{icon}</div>
      <div className="text-[15px] font-bold text-foreground">{n}</div>
      <div className="text-[10px] text-foreground/55">{l}</div>
    </div>
  );
}

function ProfileAboutCard() {
  const { go } = useNav();
  const tags: { label: string; hue: number }[] = [
    { label: "Design", hue: 290 }, { label: "Tech", hue: 220 },
    { label: "Photography", hue: 320 }, { label: "Travel", hue: 40 },
  ];
  return (
    <button onClick={() => go("editProfile")} className="rounded-3xl bg-foreground/[0.04] p-4 text-left active:scale-[0.99] transition-transform">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--lavender)]/20 text-[var(--lavender)]"><Users className="h-4 w-4" /></div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-foreground">About Me</div>
          <p className="mt-1 text-[12.5px] text-foreground/70 leading-snug">Product Designer & UI/UX Enthusiast. Coffee addict ☕ and midnight thinker 🌙.</p>
        </div>
        <ChevronRight className="h-4 w-4 text-foreground/40" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t.label} className="rounded-full border px-3 py-1 text-[11.5px] font-medium" style={{ borderColor: `oklch(0.7 0.18 ${t.hue} / 0.5)`, color: `oklch(0.82 0.16 ${t.hue})` }}>{t.label}</span>
        ))}
        <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground/10 text-foreground/60"><Plus className="h-3.5 w-3.5" /></span>
      </div>
    </button>
  );
}

function ProfileQuickActions() {
  const { go } = useNav();
  const items: { icon: ReactNode; label: string; hue: number; to: Screen }[] = [
    { icon: <Bookmark className="h-5 w-5" />, label: "Saved Messages", hue: 290, to: "savedMessages" },
    { icon: <ImageIcon className="h-5 w-5" />, label: "Shared Media", hue: 290, to: "media" },
    { icon: <Mic className="h-5 w-5" />, label: "Voice Messages", hue: 290, to: "voiceMessages" },
    { icon: <Pin className="h-5 w-5" />, label: "Pinned Chats", hue: 20, to: "pinnedChats" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 rounded-3xl bg-foreground/[0.04] p-4">
      {items.map((it) => (
        <button key={it.label} onClick={() => go(it.to)} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <span style={{ color: `oklch(0.78 0.18 ${it.hue})` }}>{it.icon}</span>
          <span className="text-[10.5px] text-foreground/85 leading-tight text-center">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProfileStories() {
  const { go } = useNav();
  const stories = [
    { label: "Your Story", hue: 290, you: true },
    { label: "Travel 24'", hue: 260 },
    { label: "Design Life", hue: 310 },
    { label: "Photography", hue: 220 },
    { label: "Concerts", hue: 350 },
  ];
  return (
    <div className="rounded-3xl bg-foreground/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[14px] font-semibold text-foreground">My Stories</div>
        <button onClick={() => go("archive")} className="flex items-center gap-1 text-[12px] font-medium text-[var(--lavender)] active:scale-95 transition-transform">View Archive <ChevronRight className="h-3 w-3" /></button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {stories.map((s) => (
          <button key={s.label} onClick={() => go(s.you ? "editProfile" : "storyView", { label: s.label, hue: s.hue })} className="flex w-16 shrink-0 flex-col items-center gap-1.5 active:scale-95 transition-transform">
            <div className="relative rounded-full p-[2px]" style={{ background: `linear-gradient(135deg, oklch(0.7 0.2 ${s.hue}), oklch(0.85 0.14 ${s.hue + 40}))` }}>
              <div className="h-14 w-14 rounded-full" style={{ background: `linear-gradient(135deg, oklch(0.55 0.18 ${s.hue}), oklch(0.35 0.12 ${s.hue + 30}))` }} />
              {s.you && <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-[oklch(0.65_0.18_220)] ring-2 ring-background"><Plus className="h-3 w-3 text-white" /></span>}
            </div>
            <span className="text-[10.5px] text-foreground/80 truncate w-full text-center">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileSettingsList() {
  const { go } = useNav();
  const items: { icon: ReactNode; label: string; to: Screen; right?: ReactNode }[] = [
    { icon: <Contact className="h-4 w-4" />, label: "Account", to: "account" },
    { icon: <Lock className="h-4 w-4" />, label: "Privacy & Security", to: "privacy" },
    { icon: <Bell className="h-4 w-4" />, label: "Notifications", to: "notifSettings", right: <span className="text-[12px] text-[var(--lavender)]">On</span> },
    { icon: <MessageCircle className="h-4 w-4" />, label: "Chat Settings", to: "chatSettings" },
    { icon: <PaintBucket className="h-4 w-4" />, label: "Appearance", to: "appearance", right: <span className="text-[12px] text-[var(--lavender)]">Dark</span> },
    { icon: <Folder className="h-4 w-4" />, label: "Data & Storage", to: "dataStorage" },
  ];
  return (
    <div className="rounded-3xl bg-foreground/[0.04] px-4">
      {items.map((it, i) => (
        <button key={it.label} onClick={() => go(it.to)} className={`flex w-full items-center gap-3 py-3.5 text-left active:bg-foreground/5 ${i > 0 ? "border-t border-foreground/5" : ""}`}>
          <span className="text-foreground/70">{it.icon}</span>
          <span className="flex-1 text-[13.5px] font-medium text-foreground">{it.label}</span>
          {it.right}
          <ChevronRight className="h-4 w-4 text-foreground/35" />
        </button>
      ))}
    </div>
  );
}

function ProfileBottomNav() {
  const { setTab, go } = useNav();
  const items = [
    { id: "chats", icon: <MessageCircle className="h-5 w-5" />, label: "Chats", badge: 8, onClick: () => { setTab("chats"); go("home"); } },
    { id: "calls", icon: <Phone className="h-5 w-5" />, label: "Calls", onClick: () => { setTab("calls"); go("home"); } },
    { id: "discover", icon: <Compass className="h-5 w-5" />, label: "Discover", onClick: () => { setTab("explore"); go("home"); } },
    { id: "notifications", icon: <Bell className="h-5 w-5" />, label: "Notifications", badge: 3, onClick: () => go("notifications") },
    { id: "profile", icon: <Contact className="h-5 w-5" />, label: "Profile", active: true, onClick: () => {} },
  ];
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] px-4 pb-4">
      <div className="flex items-stretch gap-1 rounded-3xl bg-foreground/[0.06] p-2 backdrop-blur-xl border border-foreground/5">
        {items.map((it) => (
          <button key={it.id} onClick={it.onClick} className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all active:scale-95 ${it.active ? "bg-[var(--lavender)]/15" : ""}`}>
            <span className={`relative ${it.active ? "text-[var(--lavender)]" : "text-foreground/55"}`}>
              {it.icon}
              {it.badge && (
                <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-[var(--lavender)] px-1 text-[9px] font-bold text-white">{it.badge}</span>
              )}
            </span>
            <span className={`text-[10px] ${it.active ? "text-[var(--lavender)] font-semibold" : "text-foreground/55"}`}>{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   18. Search
   ========================================================= */

function SearchScreen() {
  const [q, setQ] = useState("");
  const tabs = ["All", "Messages", "People", "Groups", "Media", "Files"];
  const [t, setT] = useState("All");
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <div className="flex h-14 items-center gap-3 px-4">
        <TopBar title="" right={null} />
      </div>
      <div className="-mt-12 px-5">
        <GlassCard strong className="flex h-12 items-center gap-3 px-4">
          <Search className="h-4 w-4 text-foreground/60" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything — natural language works" className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground/40 focus:outline-none" />
          <Sparkles className="h-4 w-4 text-[var(--lavender)] lumi-pulse" />
        </GlassCard>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((x) => <Pill key={x} active={t === x} onClick={() => setT(x)}>{x}</Pill>)}
        </div>
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-6 no-scrollbar">
        {!q && (
          <>
            <Section title="Suggested by AI">
              <div className="flex flex-col gap-2">
                {["Show messages with Nori about Lumina", "Voice notes from last week", "Files Eli shared in #general"].map((s) => (
                  <GlassCard key={s} className="flex items-center gap-3 p-3">
                    <Sparkles className="h-4 w-4 text-[var(--lavender)]" />
                    <span className="flex-1 text-[13px] text-foreground">{s}</span>
                    <ArrowRight className="h-4 w-4 text-foreground/40" />
                  </GlassCard>
                ))}
              </div>
            </Section>
            <Section title="Recent">
              <div className="flex flex-col gap-2">
                {["studio lumen", "aurora kit v2", "ramen friday"].map((s) => (
                  <button key={s} className="flex items-center gap-3 rounded-2xl px-2 py-2 text-left text-[13px] text-foreground/80">
                    <Search className="h-4 w-4 text-foreground/40" /> {s}
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}
        {q && (
          <GlassCard className="flex items-center gap-3 p-3">
            <Avatar name="Nori" hue={295} />
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-foreground">Nori</div>
              <div className="text-[11.5px] text-foreground/55">"…the {q}…"</div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   19. Notifications
   ========================================================= */

function NotificationsScreen() {
  const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; read: boolean; createdAt: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { getNotifications } = await import("../../backend/api/notifications");
        const notifs = await getNotifications();
        setNotifications(notifs);
      } catch { /* use sample */ }
      setLoaded(true);
    })();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const { markAllRead } = await import("../../backend/api/notifications");
      await markAllRead();
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    } catch { /* ignore */ }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString(undefined, { weekday: "short" });
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "reaction": return <Heart className="h-4 w-4 text-[var(--blush)]" />;
      case "reply": return <Reply className="h-4 w-4 text-[var(--sky)]" />;
      case "call": return <Phone className="h-4 w-4 text-[var(--mint)]" />;
      case "ai": return <Sparkles className="h-4 w-4 text-[var(--lavender)]" />;
      case "follow": return <UserPlus className="h-4 w-4 text-foreground" />;
      default: return <Star className="h-4 w-4 text-[var(--blush)]" />;
    }
  };

  // Sample fallback
  const sampleItems = [
    { id: "s1", type: "reaction", title: "Nori reacted 💗 to your message", read: false, createdAt: new Date(Date.now() - 120000).toISOString() },
    { id: "s2", type: "reply", title: "Eli replied in Studio Lumen", read: false, createdAt: new Date(Date.now() - 720000).toISOString() },
    { id: "s3", type: "call", title: "Missed call from June Park", read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "s4", type: "ai", title: "Lumina AI summarized 3 threads for you", read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: "s5", type: "follow", title: "Mira wants to follow you", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "s6", type: "system", title: "Your sticker pack got 1.2k saves", read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  ];

  const displayItems = notifications.length > 0 ? notifications : sampleItems;

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Notifications" right={<button onClick={handleMarkAllRead} className="grid h-10 w-10 place-items-center rounded-full glass"><Check className="h-4 w-4" /></button>} />
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-6 no-scrollbar">
        <div className="px-2 pb-1 text-[10.5px] uppercase tracking-[0.2em] text-foreground/40">Today</div>
        {displayItems.map((n) => (
          <GlassCard key={n.id} className={`flex items-center gap-3 p-3 ${!n.read ? "ring-1 ring-[var(--lavender)]/20" : ""}`}>
            <span className="grid h-10 w-10 place-items-center rounded-xl glass-strong">{typeIcon(n.type)}</span>
            <div className="flex-1 text-[13px] text-foreground">{n.title}</div>
            <span className="text-[10.5px] text-foreground/40">{formatTime(n.createdAt)}</span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   20. Media gallery
   ========================================================= */

function MediaScreen() {
  const tabs = ["Photos", "Videos", "Docs", "Voice", "Links", "GIFs"];
  const [t, setT] = useState("Photos");
  const [mediaItems, setMediaItems] = useState<{ id: string; url: string; type: string; mimeType: string }[]>([]);

  const typeMap: Record<string, string> = { Photos: "photo", Videos: "video", Docs: "document", Voice: "voice", GIFs: "gif" };

  useEffect(() => {
    (async () => {
      try {
        const { getMyMedia } = await import("../../backend/api/media");
        const items = await getMyMedia({ data: { type: typeMap[t] } });
        setMediaItems(items);
      } catch { setMediaItems([]); }
    })();
  }, [t]);

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Shared media" />
      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((x) => <Pill key={x} active={t === x} onClick={() => setT(x)}>{x}</Pill>)}
        </div>
      </div>
      <div className="mt-3 grid flex-1 grid-cols-3 gap-1 overflow-y-auto px-3 pb-6">
        {mediaItems.length > 0 ? (
          mediaItems.map((item) => (
            <div key={item.id} className="relative aspect-square overflow-hidden rounded-xl bg-foreground/10">
              {item.type === "photo" || item.type === "gif" ? (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-foreground/50">
                  {item.type === "video" && <Video className="h-6 w-6" />}
                  {item.type === "voice" && <Mic className="h-6 w-6" />}
                  {item.type === "document" && <FileText className="h-6 w-6" />}
                </div>
              )}
            </div>
          ))
        ) : (
          // Fallback demo grid
          Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl" style={{ background: `linear-gradient(${i * 20}deg, oklch(0.7 0.18 ${(i * 31) % 360}), oklch(0.85 0.12 ${(i * 47) % 360}))` }}>
              {i % 5 === 0 && <Video className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-foreground" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================
   21. Logout / 22. Delete
   ========================================================= */

function LogoutScreen() {
  const { go, back } = useNav();
  const handleLogout = async () => {
    try {
      const { logout } = await import("../../backend/api/auth");
      await logout();
    } catch {
      // proceed to welcome regardless
    }
    go("welcome");
  };
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <GlassCard strong className="w-full p-6 lumi-rise">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl glass-strong"><LogOut className="h-6 w-6 text-foreground" /></div>
        <div className="mt-4 text-center font-display text-3xl text-foreground">Sign out?</div>
        <p className="mt-1 text-center text-[12.5px] text-foreground/60">You'll need your passkey or password to sign back in.</p>
        <label className="mt-4 flex items-center gap-2 text-[12px] text-foreground/70">
          <input type="checkbox" defaultChecked className="h-4 w-4 rounded-md accent-[var(--lavender)]" /> Keep account on this device
        </label>
        <div className="mt-5 flex flex-col gap-2">
          <button className="h-12 rounded-2xl bg-[oklch(0.65_0.22_22)] text-[14px] font-semibold text-foreground" onClick={handleLogout}>Sign out</button>
          <button className="h-12 rounded-2xl glass text-[14px] font-medium text-foreground">Switch account</button>
          <button className="h-12 rounded-2xl text-[13px] text-foreground/60" onClick={back}>Cancel</button>
        </div>
        <button className="mt-3 w-full text-[11px] text-foreground/50">Sign out everywhere</button>
      </GlassCard>
    </div>
  );
}

function DeleteScreen() {
  const { back } = useNav();
  const [step, setStep] = useState<1 | 2>(1);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Delete account" />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-8">
        <div className="relative grid h-20 w-20 place-items-center rounded-full">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-60" style={{ background: "oklch(0.65 0.22 22)" }} />
          <div className="relative grid h-full w-full place-items-center rounded-full glass-strong"><Trash2 className="h-7 w-7 text-[oklch(0.75_0.22_22)]" /></div>
        </div>
        <h2 className="font-display text-3xl text-foreground text-center">{step === 1 ? "We'll be sad to see you go." : "Final step."}</h2>
        <p className="text-center text-[13px] text-foreground/60 max-w-[300px]">{step === 1 ? "You can export your chats first or sign back in within 30 days to restore everything." : "Type DELETE to confirm. This cannot be undone after 30 days."}</p>

        {step === 1 ? (
          <div className="flex w-full flex-col gap-2">
            <button className="flex h-12 items-center justify-center gap-2 rounded-2xl glass text-[13px] font-medium text-foreground"><Download className="h-4 w-4" /> Export my data first</button>
            <button className="flex h-12 items-center justify-center gap-2 rounded-2xl glass text-[13px] font-medium text-foreground"><Cloud className="h-4 w-4" /> Backup chats</button>
            <button onClick={() => setStep(2)} className="h-12 rounded-2xl bg-[oklch(0.65_0.22_22)] text-[14px] font-semibold text-foreground">Continue</button>
            <button onClick={back} className="h-12 rounded-2xl text-[13px] text-foreground/60">Cancel</button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <input placeholder="Type DELETE" className="h-14 rounded-2xl glass px-4 text-center text-[14px] tracking-[0.3em] text-foreground placeholder:text-foreground/40 focus:outline-none" />
            <button className="h-12 rounded-2xl bg-[oklch(0.65_0.22_22)] text-[14px] font-semibold text-foreground">Delete my account</button>
            <button onClick={() => setStep(1)} className="h-12 rounded-2xl text-[13px] text-foreground/60">Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
/* =========================================================
   23. Appearance — live theme + accent
   ========================================================= */

function AppearanceScreen() {
  const { mode, accent, setMode, setAccent } = useTheme();
  const accentIds = Object.keys(ACCENTS) as AccentId[];

  const persistTheme = async (theme: string, accentVal: string) => {
    try {
      const { updatePreferences } = await import("../../backend/api/preferences");
      await updatePreferences({ data: { theme, accent: accentVal } });
    } catch { /* ignore */ }
  };

  const handleMode = (t: ThemeMode) => {
    setMode(t);
    persistTheme(t, accent);
  };

  const handleAccent = (a: AccentId) => {
    setAccent(a);
    persistTheme(mode, a);
  };
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Appearance" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8 no-scrollbar">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">Personalize</div>
          <h1 className="font-display text-4xl text-foreground">Make it <span className="aurora-text italic">yours</span>.</h1>
          <p className="mt-1 text-[13px] text-foreground/60">Changes apply live across every screen.</p>
        </div>

        <GlassCard strong className="relative overflow-hidden p-5">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl opacity-70" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }} />
          <div className="relative flex items-center gap-3">
            <Avatar name="Ada Lovelace" size={48} />
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-foreground">Ada Lovelace</div>
              <div className="text-[11.5px] text-foreground/60">@ada · live preview</div>
            </div>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-background" style={{ background: "linear-gradient(120deg, var(--lavender), var(--blush))" }}>
              {ACCENTS[accent].name}
            </span>
          </div>
          <div className="relative mt-4 flex flex-col gap-2">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md px-3 py-2 text-[13px] text-[oklch(0.16_0.04_285)]" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush) 60%, var(--sky))" }}>
              looks unreal — every pixel listens 🪩
            </div>
            <div className="mr-auto max-w-[80%] rounded-2xl rounded-bl-md glass px-3 py-2 text-[13px] text-foreground">
              i told you — Lumina shifts with you
            </div>
          </div>
        </GlassCard>

        <div>
          <div className="mb-2 px-1 text-[12px] font-medium text-foreground/60">Theme</div>
          <div className="grid grid-cols-2 gap-3">
            {(["dark", "light"] as const).map((t) => {
              const active = mode === t;
              return (
                <button
                  key={t}
                  onClick={() => handleMode(t)}
                  className={`relative flex h-28 flex-col items-start justify-between overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.98] ${active ? "ring-2 ring-foreground" : ""}`}
                  style={{
                    background: t === "dark"
                      ? "linear-gradient(135deg, oklch(0.16 0.04 285), oklch(0.22 0.06 285))"
                      : "linear-gradient(135deg, oklch(0.98 0.012 295), oklch(0.94 0.02 295))",
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: t === "dark" ? "oklch(1 0 0 / 0.5)" : "oklch(0.2 0.04 285 / 0.6)" }}>
                      {t === "dark" ? "Aurora" : "Daylight"}
                    </span>
                    {active && <Check className="h-3.5 w-3.5" style={{ color: t === "dark" ? "white" : "oklch(0.2 0.04 285)" }} />}
                  </div>
                  <div className="flex w-full flex-col gap-1.5">
                    <span className="h-2 w-12 rounded-full" style={{ background: t === "dark" ? "oklch(1 0 0 / 0.3)" : "oklch(0 0 0 / 0.2)" }} />
                    <span className="h-2 w-20 rounded-full" style={{ background: "linear-gradient(90deg, var(--lavender), var(--blush))" }} />
                    <span className="h-2 w-8 rounded-full" style={{ background: t === "dark" ? "oklch(1 0 0 / 0.15)" : "oklch(0 0 0 / 0.1)" }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 px-1 text-[12px] font-medium text-foreground/60">Accent palette</div>
          <div className="grid grid-cols-2 gap-3">
            {accentIds.map((id) => {
              const a = ACCENTS[id];
              const active = accent === id;
              return (
                <button
                  key={id}
                  onClick={() => handleAccent(id)}
                  className={`relative flex h-24 flex-col justify-between overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.98] glass ${active ? "ring-2 ring-foreground" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-foreground">{a.name}</span>
                    {active && <Check className="h-3.5 w-3.5 text-foreground" />}
                  </div>
                  <div className="flex gap-1.5">
                    {[a.lavender, a.blush, a.sky, a.mint].map((c, i) => (
                      <span key={i} className="h-6 flex-1 rounded-lg" style={{ background: c }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <GlassCard className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl glass-strong"><Sparkles className="h-4 w-4 text-foreground" /></span>
          <div className="flex-1 text-[12px] text-foreground/70">
            Premium unlocks animated themes and seasonal palettes.
          </div>
          <ChevronRight className="h-4 w-4 text-foreground/40" />
        </GlassCard>
      </div>
    </div>
  );
}

/* =========================================================
   24. Stub primitives shared by destination screens
   ========================================================= */

function useFakeLoad(ms = 700) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), ms); return () => clearTimeout(t); }, [ms]);
  return loading;
}

function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 px-5 pt-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-foreground/5 overflow-hidden relative">
          <div className="absolute inset-0 shimmer" />
        </div>
      ))}
    </div>
  );
}

function Row({ icon, label, hint, right, onClick }: { icon?: ReactNode; label: string; hint?: string; right?: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-foreground/5">
      {icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-foreground/5 text-foreground/80">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-foreground truncate">{label}</div>
        {hint && <div className="text-[11.5px] text-foreground/55 truncate">{hint}</div>}
      </div>
      {right ?? <ChevronRight className="h-4 w-4 text-foreground/35" />}
    </button>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-[var(--lavender)]" : "bg-foreground/15"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function RowGroup({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl bg-foreground/[0.04] overflow-hidden divide-y divide-foreground/5">{children}</div>;
}

/* =========================================================
   25. Edit Profile
   ========================================================= */

function EditProfileScreen() {
  const { back } = useNav();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const all = ["Design", "Tech", "Photography", "Travel", "Music", "Gaming", "Food", "Fitness", "Books"];

  // Load real profile data on mount
  useEffect(() => {
    (async () => {
      try {
        const { getProfile } = await import("../../backend/api/profile");
        const p = await getProfile();
        if (p) {
          setName(p.fullName ?? "");
          setHandle(p.username ?? "");
          setBio(p.bio ?? "");
          setInterests(p.interests ?? []);
        }
      } catch { /* leave defaults */ }
      setLoaded(true);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { updateProfile } = await import("../../backend/api/profile");
      await updateProfile({
        data: {
          fullName: name,
          username: handle.replace(/^@/, ""),
          bio,
          interests,
        },
      });
      setSaved(true);
      setTimeout(back, 600);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar />
      <TopBar title="Edit Profile" right={<button onClick={save} className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-[oklch(0.16_0.04_285)]" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>{saving ? "…" : saved ? "✓" : "Save"}</button>} />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8 no-scrollbar">
        <div className="flex flex-col items-center gap-3 pt-2">
          <button className="relative grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-foreground/20 bg-foreground/5 text-foreground/60 active:scale-95 transition-transform">
            <Camera className="h-6 w-6" />
            <span className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}><Plus className="h-4 w-4" /></span>
          </button>
          <div className="text-[12px] text-foreground/60">Tap to add a profile photo</div>
        </div>
        <Input label="Display name" placeholder="Your name" value={name} onChange={setName} icon={<Contact className="h-4 w-4" />} />
        <Input label="Username" placeholder="@yourhandle" value={handle} onChange={setHandle} icon={<Hash className="h-4 w-4" />} />
        <div>
          <div className="mb-2 px-1 text-[12px] font-medium text-foreground/60">Bio</div>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} placeholder="Tell people about yourself…" className="min-h-[96px] w-full resize-none rounded-2xl bg-foreground/5 p-4 text-[14px] text-foreground placeholder:text-foreground/40 focus:outline-none" />
          <div className="mt-1 text-right text-[10.5px] text-foreground/40">{bio.length}/160</div>
        </div>
        <div>
          <div className="mb-2 px-1 text-[12px] font-medium text-foreground/60">Interests</div>
          <div className="flex flex-wrap gap-2">
            {all.map((t) => {
              const on = interests.includes(t);
              return (
                <button key={t} onClick={() => setInterests((p) => on ? p.filter((x) => x !== t) : [...p, t])} className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${on ? "text-white" : "bg-foreground/5 text-foreground/70"}`} style={on ? { background: "linear-gradient(135deg, var(--lavender), var(--blush))" } : undefined}>{t}</button>
              );
            })}
          </div>
        </div>
        <PrimaryButton onClick={save} loading={saving}>{saved ? "Saved ✓" : "Save changes"}</PrimaryButton>
      </div>
    </div>
  );
}

/* =========================================================
   26. Account / Privacy / Chat Settings / Data / Notif / Lang / Access / Help / Invite / Storage
   ========================================================= */

function AccountScreen() {
  const { go } = useNav();
  const loading = useFakeLoad(500);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Account" />
      {loading ? <PageSkeleton /> : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-8 no-scrollbar">
          <RowGroup>
            <Row icon={<Contact className="h-4 w-4" />} label="Edit profile" onClick={() => go("editProfile")} />
            <Row icon={<Hash className="h-4 w-4" />} label="Username" hint="@noah_07" onClick={() => go("editProfile")} />
            <Row icon={<Phone className="h-4 w-4" />} label="Phone" hint="+1 415 ••• 0042" />
            <Row icon={<Globe className="h-4 w-4" />} label="Email" hint="noah@lumina.app" />
          </RowGroup>
          <RowGroup>
            <Row icon={<Crown className="h-4 w-4" />} label="Lumina Premium" hint="Yearly · renews Jan 2027" onClick={() => go("premium")} />
            <Row icon={<Download className="h-4 w-4" />} label="Export account data" onClick={() => alert("Export queued. We'll email you the link.")} />
          </RowGroup>
          <RowGroup>
            <Row icon={<LogOut className="h-4 w-4" />} label="Log out" onClick={() => go("logout")} />
            <Row icon={<Trash2 className="h-4 w-4" />} label="Delete account" onClick={() => go("delete")} />
          </RowGroup>
        </div>
      )}
    </div>
  );
}

function PrivacyScreen() {
  const { go } = useNav();
  const [read, setRead] = useState(true);
  const [online, setOnline] = useState(true);
  const [typing, setTyping] = useState(true);
  const loading = useFakeLoad(450);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Privacy & Security" />
      {loading ? <PageSkeleton /> : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-8 no-scrollbar">
          <RowGroup>
            <Row icon={<Eye className="h-4 w-4" />} label="Read receipts" right={<Toggle on={read} onClick={() => setRead(!read)} />} />
            <Row icon={<Sun className="h-4 w-4" />} label="Online status" right={<Toggle on={online} onClick={() => setOnline(!online)} />} />
            <Row icon={<MessageCircle className="h-4 w-4" />} label="Typing indicators" right={<Toggle on={typing} onClick={() => setTyping(!typing)} />} />
          </RowGroup>
          <RowGroup>
            <Row icon={<Shield className="h-4 w-4" />} label="Security center" onClick={() => go("security")} />
            <Row icon={<X className="h-4 w-4" />} label="Blocked users" hint="2 blocked" />
            <Row icon={<Lock className="h-4 w-4" />} label="App lock" hint="Face ID" />
          </RowGroup>
          <RowGroup>
            <Row icon={<FileText className="h-4 w-4" />} label="Privacy policy" />
            <Row icon={<FileText className="h-4 w-4" />} label="Terms of service" />
          </RowGroup>
        </div>
      )}
    </div>
  );
}

function ChatSettingsScreen() {
  const [enter, setEnter] = useState(true);
  const [preview, setPreview] = useState(true);
  const [autodl, setAutodl] = useState(false);
  const loading = useFakeLoad(450);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Chat Settings" />
      {loading ? <PageSkeleton /> : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-8 no-scrollbar">
          <RowGroup>
            <Row icon={<Send className="h-4 w-4" />} label="Enter to send" right={<Toggle on={enter} onClick={() => setEnter(!enter)} />} />
            <Row icon={<Eye className="h-4 w-4" />} label="Message previews" right={<Toggle on={preview} onClick={() => setPreview(!preview)} />} />
            <Row icon={<Download className="h-4 w-4" />} label="Auto-download media" right={<Toggle on={autodl} onClick={() => setAutodl(!autodl)} />} />
          </RowGroup>
          <RowGroup>
            <Row icon={<Type className="h-4 w-4" />} label="Text size" hint="Default" />
            <Row icon={<PaintBucket className="h-4 w-4" />} label="Bubble style" hint="Aurora" />
            <Row icon={<Smile className="h-4 w-4" />} label="Default reactions" hint="❤️ 😂 🔥 🪩 ✨" />
          </RowGroup>
        </div>
      )}
    </div>
  );
}

function DataStorageScreen() {
  const loading = useFakeLoad(500);
  const [stats, setStats] = useState<{ totalBytes: number; mediaBytes: number; chatBytes: number; voiceBytes: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { getStorageStats } = await import("../../backend/api/media");
        const s = await getStorageStats();
        setStats(s);
      } catch { /* use demo */ }
    })();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const total = stats?.totalBytes ?? 1468006400; // 1.4 GB default
  const mediaSize = stats?.mediaBytes ?? 587202560;
  const chatSize = stats?.chatBytes ?? 293601280;
  const otherSize = stats ? (stats.voiceBytes + (stats.totalBytes - stats.mediaBytes - stats.chatBytes - stats.voiceBytes)) : 117440512;
  const maxStorage = 5 * 1024 * 1024 * 1024; // 5 GB
  const mediaPct = Math.round((mediaSize / maxStorage) * 100);
  const chatPct = Math.round((chatSize / maxStorage) * 100);
  const otherPct = Math.round((otherSize / maxStorage) * 100);

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Data & Storage" />
      {loading ? <PageSkeleton /> : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-8 no-scrollbar">
          <div className="rounded-3xl bg-foreground/[0.04] p-5">
            <div className="text-[12px] text-foreground/60">Used this month</div>
            <div className="mt-1 font-display text-3xl text-foreground">{formatSize(total)} <span className="text-[12px] text-foreground/50">/ 5 GB</span></div>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-foreground/10">
              <span style={{ width: `${mediaPct}%`, background: "var(--lavender)" }} />
              <span style={{ width: `${chatPct}%`, background: "var(--blush)" }} />
              <span style={{ width: `${otherPct}%`, background: "var(--sky)" }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-[11px]">
              <div><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: "var(--lavender)" }} />Media {formatSize(mediaSize)}</div>
              <div><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: "var(--blush)" }} />Chats {formatSize(chatSize)}</div>
              <div><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: "var(--sky)" }} />Other {formatSize(otherSize)}</div>
            </div>
          </div>
          <RowGroup>
            <Row icon={<Trash2 className="h-4 w-4" />} label="Clear cache" hint="218 MB" onClick={() => alert("Cache cleared.")} />
            <Row icon={<Cloud className="h-4 w-4" />} label="Backups" hint="Last 2h ago" />
            <Row icon={<Download className="h-4 w-4" />} label="Download quality" hint="Auto" />
          </RowGroup>
        </div>
      )}
    </div>
  );
}

function NotifSettingsScreen() {
  const [push, setPush] = useState(true);
  const [calls, setCalls] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [ai, setAi] = useState(false);
  const loading = useFakeLoad(400);

  // Load saved preferences
  useEffect(() => {
    (async () => {
      try {
        const { getPreferences } = await import("../../backend/api/preferences");
        const prefs = await getPreferences();
        setPush(prefs.pushEnabled);
        setCalls(prefs.callsEnabled);
        setMentions(prefs.mentionsEnabled);
        setAi(prefs.aiSuggestions);
      } catch { /* use defaults */ }
    })();
  }, []);

  const save = async (patch: Record<string, boolean>) => {
    try {
      const { updatePreferences } = await import("../../backend/api/preferences");
      await updatePreferences({ data: patch });
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Notifications" />
      {loading ? <PageSkeleton /> : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-8 no-scrollbar">
          <RowGroup>
            <Row icon={<Bell className="h-4 w-4" />} label="Push notifications" right={<Toggle on={push} onClick={() => { setPush(!push); save({ pushEnabled: !push }); }} />} />
            <Row icon={<Phone className="h-4 w-4" />} label="Calls" right={<Toggle on={calls} onClick={() => { setCalls(!calls); save({ callsEnabled: !calls }); }} />} />
            <Row icon={<Hash className="h-4 w-4" />} label="Mentions" right={<Toggle on={mentions} onClick={() => { setMentions(!mentions); save({ mentionsEnabled: !mentions }); }} />} />
            <Row icon={<Sparkles className="h-4 w-4" />} label="Lumina AI suggestions" right={<Toggle on={ai} onClick={() => { setAi(!ai); save({ aiSuggestions: !ai }); }} />} />
          </RowGroup>
          <RowGroup>
            <Row icon={<Music2 className="h-4 w-4" />} label="Notification sound" hint="Aurora chime" />
            <Row icon={<BellOff className="h-4 w-4" />} label="Do not disturb" hint="Off" />
          </RowGroup>
        </div>
      )}
    </div>
  );
}

function LanguageScreen() {
  const [lang, setLang] = useState("en-US");
  const langs = [
    { id: "en-US", name: "English (US)" }, { id: "en-GB", name: "English (UK)" },
    { id: "es", name: "Español" }, { id: "fr", name: "Français" }, { id: "de", name: "Deutsch" },
    { id: "ja", name: "日本語" }, { id: "ko", name: "한국어" }, { id: "ar", name: "العربية" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const { getPreferences } = await import("../../backend/api/preferences");
        const prefs = await getPreferences();
        setLang(prefs.language);
      } catch { /* use default */ }
    })();
  }, []);

  const selectLang = async (id: string) => {
    setLang(id);
    try {
      const { updatePreferences } = await import("../../backend/api/preferences");
      await updatePreferences({ data: { language: id } });
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Language" />
      <div className="px-5 pb-8 overflow-y-auto no-scrollbar">
        <RowGroup>
          {langs.map((l) => (
            <Row key={l.id} icon={<Globe className="h-4 w-4" />} label={l.name} onClick={() => selectLang(l.id)} right={lang === l.id ? <Check className="h-4 w-4 text-[var(--lavender)]" /> : <ChevronRight className="h-4 w-4 text-foreground/30" />} />
          ))}
        </RowGroup>
      </div>
    </div>
  );
}

function AccessibilityScreen() {
  const [motion, setMotion] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [haptics, setHaptics] = useState(true);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Accessibility" />
      <div className="flex flex-col gap-3 px-5 pb-8 overflow-y-auto no-scrollbar">
        <RowGroup>
          <Row icon={<Eye className="h-4 w-4" />} label="Reduce motion" right={<Toggle on={motion} onClick={() => setMotion(!motion)} />} />
          <Row icon={<Sun className="h-4 w-4" />} label="High contrast" right={<Toggle on={contrast} onClick={() => setContrast(!contrast)} />} />
          <Row icon={<Volume2 className="h-4 w-4" />} label="Haptic feedback" right={<Toggle on={haptics} onClick={() => setHaptics(!haptics)} />} />
        </RowGroup>
        <RowGroup>
          <Row icon={<Type className="h-4 w-4" />} label="Text size" hint="Large" />
          <Row icon={<Languages className="h-4 w-4" />} label="Screen reader hints" />
        </RowGroup>
      </div>
    </div>
  );
}

function HelpScreen() {
  const faqs = [
    { q: "How is Lumina end-to-end encrypted?", a: "Every message uses Kyber-1024 key exchange and AES-256 in your device." },
    { q: "Can I use Lumina on multiple devices?", a: "Yes — up to 5 devices with synced encrypted backups." },
    { q: "How do I cancel Premium?", a: "Go to Settings → Premium and tap Manage subscription." },
    { q: "Where are my chats stored?", a: "On-device by default. Optional encrypted iCloud backup." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Help & Support" />
      <div className="flex flex-col gap-3 px-5 pb-8 overflow-y-auto no-scrollbar">
        <RowGroup>
          <Row icon={<MessageCircle className="h-4 w-4" />} label="Chat with support" hint="Avg. reply 2 min" />
          <Row icon={<Globe className="h-4 w-4" />} label="Visit help center" />
          <Row icon={<FileText className="h-4 w-4" />} label="Report a problem" />
        </RowGroup>
        <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/40 px-1">FAQ</div>
        <div className="flex flex-col gap-2">
          {faqs.map((f, i) => (
            <button key={i} onClick={() => setOpen(open === i ? null : i)} className="rounded-2xl bg-foreground/[0.04] p-4 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-foreground">{f.q}</span>
                <ChevronDown className={`h-4 w-4 text-foreground/50 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </div>
              {open === i && <p className="mt-2 text-[12px] text-foreground/65 leading-snug">{f.a}</p>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InviteScreen() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Invite friends" />
      <div className="flex flex-col gap-4 px-5 pb-8 overflow-y-auto no-scrollbar">
        <GlassCard strong className="relative overflow-hidden p-5">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full blur-2xl opacity-60" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }} />
          <Share2 className="relative h-6 w-6 text-foreground" />
          <div className="relative mt-2 font-display text-2xl text-foreground">Give a month, get a month</div>
          <p className="relative mt-1 text-[12.5px] text-foreground/65">Both you and your friend get 30 days of Premium when they join.</p>
        </GlassCard>
        <div className="rounded-2xl bg-foreground/[0.04] p-3 flex items-center gap-2">
          <code className="flex-1 truncate text-[13px] text-foreground">lumina.app/i/noah-07-aurora</code>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-[oklch(0.16_0.04_285)]" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>{copied ? "Copied" : "Copy"}</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[{ i: <MessageCircle className="h-5 w-5" />, l: "Messages" }, { i: <Globe className="h-5 w-5" />, l: "Email" }, { i: <Share2 className="h-5 w-5" />, l: "Share" }, { i: <Copy className="h-5 w-5" />, l: "More" }].map((x) => (
            <button key={x.l} className="flex flex-col items-center gap-2 rounded-2xl bg-foreground/[0.04] p-3 active:scale-95 transition-transform">
              <span className="text-[var(--lavender)]">{x.i}</span>
              <span className="text-[11px] text-foreground/80">{x.l}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StorageScreen() { return <DataStorageScreen />; }

/* =========================================================
   27. Saved / Voice / Pinned chats
   ========================================================= */

function SavedMessagesScreen() {
  const loading = useFakeLoad(500);
  const items = [
    { from: "Nori", text: "Aurora kit v2 figma link 👉 figma.com/aurora", hue: 295 },
    { from: "Eli", text: "Don't forget standup at 9.", hue: 210 },
    { from: "Self note", text: "Idea: spatial reactions that orbit the bubble.", hue: 160 },
    { from: "Mira", text: "Studio Lumen address — 24 Pier, SF", hue: 350 },
  ];
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Saved Messages" />
      {loading ? <PageSkeleton /> : (
        <div className="flex flex-col gap-2 px-4 pb-8 overflow-y-auto no-scrollbar">
          {items.map((it, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl bg-foreground/[0.04] p-3">
              <Avatar name={it.from} hue={it.hue} size={36} />
              <div className="flex-1">
                <div className="text-[12.5px] font-semibold text-foreground">{it.from}</div>
                <div className="text-[13px] text-foreground/80">{it.text}</div>
              </div>
              <Bookmark className="h-4 w-4 text-[var(--lavender)]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceMessagesScreen() {
  const loading = useFakeLoad(500);
  const [playing, setPlaying] = useState<number | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<{ id: string; filename: string; url: string; createdAt: string | Date }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { getMyMedia } = await import("../../backend/api/media");
        const items = await getMyMedia({ data: { type: "voice" } });
        setVoiceNotes(items);
      } catch { /* use sample */ }
    })();
  }, []);

  // Sample fallback
  const sampleItems = [
    { from: "Nori", dur: "0:24", hue: 295, when: "2m" },
    { from: "Eli", dur: "1:03", hue: 210, when: "1h" },
    { from: "June", dur: "0:08", hue: 350, when: "Yesterday" },
    { from: "Mom", dur: "2:14", hue: 160, when: "Friday" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Voice Messages" />
      {loading ? <PageSkeleton /> : (
        <div className="flex flex-col gap-2 px-4 pb-8 overflow-y-auto no-scrollbar">
          {(voiceNotes.length > 0 ? voiceNotes.map((vn, i) => ({ from: vn.filename.replace(/\.[^.]+$/, ""), dur: "0:00", hue: vn.filename.charCodeAt(0) % 360, when: new Date(vn.createdAt).toLocaleDateString(undefined, { weekday: "short" }) })) : sampleItems).map((it, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl bg-foreground/[0.04] p-3">
              <Avatar name={it.from} hue={it.hue} size={40} />
              <div className="flex-1">
                <div className="flex justify-between text-[12.5px] font-semibold text-foreground">{it.from}<span className="text-[10.5px] font-normal text-foreground/40">{it.when}</span></div>
                <div className="mt-1.5 flex items-center gap-2">
                  <button onClick={() => setPlaying(playing === i ? null : i)} className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>
                    {playing === i ? <X className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5 rotate-90" />}
                  </button>
                  <div className="flex flex-1 items-end gap-0.5 h-7">
                    {Array.from({ length: 24 }).map((_, k) => (
                      <span key={k} className="flex-1 rounded-full" style={{ background: "var(--lavender)", height: `${20 + Math.sin(k + i) * 50 + 30}%`, opacity: playing === i ? 1 : 0.5 }} />
                    ))}
                  </div>
                  <span className="text-[10.5px] tabular-nums text-foreground/55">{it.dur}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PinnedChatsScreen() {
  const { go } = useNav();
  const loading = useFakeLoad(400);
  const pinned = [
    { name: "Nori", last: "see you tonight ✨", hue: 295, time: "2m" },
    { name: "Studio Lumen", last: "Mira: pushed new kit", hue: 210, time: "12m" },
    { name: "Mom", last: "love you 💕", hue: 160, time: "1h" },
  ];
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Pinned Chats" />
      {loading ? <PageSkeleton /> : (
        <div className="flex flex-col px-2 pb-8 overflow-y-auto no-scrollbar">
          {pinned.map((c) => (
            <button key={c.name} onClick={() => go("chat", { id: c.name })} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left active:bg-foreground/5">
              <Avatar name={c.name} hue={c.hue} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[14.5px] font-semibold text-foreground">{c.name}<span className="text-[11px] font-normal text-foreground/40">{c.time}</span></div>
                <div className="truncate text-[12.5px] text-foreground/55">{c.last}</div>
              </div>
              <Pin className="h-4 w-4 text-[var(--lavender)]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   28. Story view / Archive
   ========================================================= */

function StoryViewScreen() {
  const { params, back } = useNav();
  const label = (params.label as string) ?? "Story";
  const hue = (params.hue as number) ?? 290;
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, oklch(0.45 0.22 ${hue}), oklch(0.20 0.10 ${hue + 40}))` }} />
      <div className="relative z-10 flex items-center gap-3 px-5 pt-12">
        <div className="flex flex-1 gap-1">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full bg-white" style={{ width: "60%" }} />
          </div>
        </div>
        <button onClick={back} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="relative z-10 flex items-center gap-2 px-5 pt-4">
        <Avatar name={label} hue={hue} size={36} />
        <div className="text-[13px] font-semibold text-white">{label}</div>
        <div className="text-[11px] text-white/70">· 2h ago</div>
      </div>
      <div className="relative z-10 mt-auto flex items-center gap-2 px-5 pb-10">
        <input placeholder={`Reply to ${label}`} className="h-11 flex-1 rounded-full bg-white/15 px-4 text-[13px] text-white placeholder:text-white/60 focus:outline-none" />
        <button className="grid h-11 w-11 place-items-center rounded-full bg-white/20 text-white"><Heart className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function ArchiveScreen() {
  const loading = useFakeLoad(450);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="Story Archive" />
      {loading ? <PageSkeleton /> : (
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-8 overflow-y-auto">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-2xl" style={{ background: `linear-gradient(${i * 30}deg, oklch(0.55 0.18 ${(i * 31) % 360}), oklch(0.30 0.12 ${(i * 47) % 360}))` }}>
              <div className="absolute bottom-1.5 left-1.5 text-[10px] font-medium text-white/90">{`Aug ${i + 1}`}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   29. Community / Creator / New Chat
   ========================================================= */

function CommunityScreen() {
  const { params } = useNav();
  const communityId = params.communityId as string | undefined;
  const name = (params.name as string) ?? "Aurora Design";
  const hue = (params.hue as number) ?? 295;
  const [joined, setJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const loading = useFakeLoad(500);

  useEffect(() => {
    if (!communityId) return;
    (async () => {
      try {
        const { getCommunityDetails } = await import("../../backend/api/communities");
        const details = await getCommunityDetails({ data: { communityId } });
        setJoined(details.isMember);
        setMemberCount(details.memberCount);
      } catch { /* ignore */ }
    })();
  }, [communityId]);

  const toggleJoin = async () => {
    if (!communityId) { setJoined(!joined); return; }
    try {
      if (joined) {
        const { leaveCommunity } = await import("../../backend/api/communities");
        await leaveCommunity({ data: { communityId } });
        setJoined(false);
        setMemberCount((c) => Math.max(0, c - 1));
      } else {
        const { joinCommunity } = await import("../../backend/api/communities");
        await joinCommunity({ data: { communityId } });
        setJoined(true);
        setMemberCount((c) => c + 1);
      }
    } catch { /* ignore */ }
  };
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="" />
      {loading ? <PageSkeleton rows={4} /> : (
        <div className="flex flex-col gap-4 px-5 pb-8 overflow-y-auto no-scrollbar">
          <div className="relative h-32 overflow-hidden rounded-3xl" style={{ background: `linear-gradient(135deg, oklch(0.6 0.2 ${hue}), oklch(0.4 0.18 ${hue + 40}))` }} />
          <div className="-mt-12 flex items-end gap-3 px-2">
            <div className="grid h-20 w-20 place-items-center rounded-3xl text-2xl text-white" style={{ background: `linear-gradient(135deg, oklch(0.7 0.2 ${hue}), oklch(0.5 0.15 ${hue + 30}))` }}><Users className="h-7 w-7" /></div>
            <div className="flex-1">
              <div className="text-[18px] font-bold text-foreground">{name}</div>
              <div className="text-[11.5px] text-foreground/55">{memberCount > 0 ? `${memberCount} members` : "12.4k members"} · public</div>
            </div>
            <button onClick={toggleJoin} className={`rounded-full px-4 py-2 text-[12px] font-semibold ${joined ? "bg-foreground/10 text-foreground" : "text-[oklch(0.16_0.04_285)]"}`} style={joined ? undefined : { background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>{joined ? "Joined ✓" : "Join"}</button>
          </div>
          <p className="text-[13px] text-foreground/75">A community of product designers shipping luminous, spatial interfaces. Weekly critique, live jams, and shared kits.</p>
          <div className="grid grid-cols-3 gap-2 rounded-3xl bg-foreground/[0.04] p-3">
            {[{ n: "248", l: "Posts today" }, { n: "32", l: "Online" }, { n: "5", l: "Channels" }].map((s) => (
              <div key={s.l} className="text-center"><div className="text-[16px] font-bold text-foreground">{s.n}</div><div className="text-[10.5px] text-foreground/55">{s.l}</div></div>
            ))}
          </div>
          <RowGroup>
            <Row icon={<Hash className="h-4 w-4" />} label="general" hint="Mira: anyone shipping today?" />
            <Row icon={<Hash className="h-4 w-4" />} label="critique" hint="3 new" />
            <Row icon={<Hash className="h-4 w-4" />} label="resources" />
            <Row icon={<Hash className="h-4 w-4" />} label="jam-sessions" />
          </RowGroup>
        </div>
      )}
    </div>
  );
}

function CreatorScreen() {
  const { params, go } = useNav();
  const name = (params.name as string) ?? "Mira Okafor";
  const hue = (params.hue as number) ?? 295;
  const [following, setFollowing] = useState(false);
  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="" />
      <div className="flex flex-col gap-4 px-5 pb-8 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-4">
          <Avatar name={name} hue={hue} size={88} />
          <div className="flex-1">
            <div className="text-[18px] font-bold text-foreground">{name}</div>
            <div className="text-[11.5px] text-foreground/55">Designer · Studio Lumen</div>
            <div className="mt-2 flex gap-4 text-[11px] text-foreground/70">
              <span><b className="text-foreground">1.2k</b> followers</span>
              <span><b className="text-foreground">312</b> posts</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFollowing(!following)} className={`h-11 flex-1 rounded-2xl text-[13px] font-semibold ${following ? "bg-foreground/10 text-foreground" : "text-[oklch(0.16_0.04_285)]"}`} style={following ? undefined : { background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>{following ? "Following ✓" : "Follow"}</button>
          <button onClick={() => go("chat", { id: name })} className="h-11 flex-1 rounded-2xl bg-foreground/[0.06] text-[13px] font-semibold text-foreground">Message</button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl" style={{ background: `linear-gradient(${i * 40}deg, oklch(0.7 0.18 ${(i * 37 + hue) % 360}), oklch(0.5 0.14 ${(i * 53 + hue) % 360}))` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NewChatScreen() {
  const { go } = useNav();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; fullName: string; username: string; avatarUrl?: string | null }[]>([]);
  const [myContacts, setMyContacts] = useState<{ id: string; fullName: string; username: string; avatarUrl?: string | null; status?: string | null }[]>([]);

  // Load contacts on mount
  useEffect(() => {
    (async () => {
      try {
        const { getContacts } = await import("../../backend/api/contacts");
        const c = await getContacts();
        setMyContacts(c);
      } catch { /* empty */ }
    })();
  }, []);

  // Search users when query changes
  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { searchUsers } = await import("../../backend/api/contacts");
        const r = await searchUsers({ data: { query: q } });
        setResults(r);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const displayList = q.length >= 2 ? results : myContacts;

  return (
    <div className="flex flex-1 flex-col">
      <StatusBar /><TopBar title="New chat" />
      <div className="px-5">
        <div className="flex h-11 items-center gap-2 rounded-full bg-foreground/[0.06] px-4">
          <Search className="h-4 w-4 text-foreground/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-foreground/40 focus:outline-none" />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1 px-2 pb-8 overflow-y-auto no-scrollbar">
        {displayList.length === 0 && q.length >= 2 && (
          <div className="px-4 py-8 text-center text-[13px] text-foreground/50">No users found</div>
        )}
        {displayList.map((c) => (
          <button key={c.id} onClick={async () => {
            try {
              const { getOrCreateDM } = await import("../../backend/api/conversations");
              const conv = await getOrCreateDM({ data: { otherUserId: c.id } });
              go("chat", { id: conv.id, convId: conv.id, name: c.fullName });
            } catch {
              go("chat", { id: c.fullName });
            }
          }} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left active:bg-foreground/5">
            <Avatar name={c.fullName} hue={c.username.charCodeAt(0) % 360} />
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-foreground">{c.fullName}</div>
              <div className="text-[11.5px] text-foreground/55">@{c.username}</div>
            </div>
            <MessageCircle className="h-4 w-4 text-foreground/40" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   Desktop Shell (lg+) — Sidebar + Multi-column workspace
   ========================================================= */

const PRE_AUTH: Screen[] = ["splash", "welcome", "login", "register", "otp", "permissions", "profileSetup"];

function DesktopShell() {
  const { screen } = useNav();
  // Pre-auth flows: center the phone-frame layout on desktop too
  if (PRE_AUTH.includes(screen)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col">
        <ScreenRouter />
      </main>
    );
  }
  return (
    <div className="flex min-h-screen w-full">
      <DesktopSidebar />
      <DesktopWorkspace />
    </div>
  );
}

function DesktopSidebar() {
  const { tab, setTab, go, screen } = useNav();
  const items: { id: Tab; icon: ReactNode; label: string; badge?: number }[] = [
    { id: "chats", icon: <MessageCircle className="h-[18px] w-[18px]" />, label: "Chats", badge: 3 },
    { id: "calls", icon: <Phone className="h-[18px] w-[18px]" />, label: "Calls" },
    { id: "communities", icon: <Users className="h-[18px] w-[18px]" />, label: "Communities" },
    { id: "ai", icon: <Sparkles className="h-[18px] w-[18px]" />, label: "AI" },
    { id: "explore", icon: <Compass className="h-[18px] w-[18px]" />, label: "Explore" },
  ];
  const extras: { s: Screen; icon: ReactNode; label: string }[] = [
    { s: "savedMessages", icon: <Bookmark className="h-[18px] w-[18px]" />, label: "Saved" },
    { s: "pinnedChats", icon: <Pin className="h-[18px] w-[18px]" />, label: "Pinned" },
    { s: "archive", icon: <Archive className="h-[18px] w-[18px]" />, label: "Archive" },
    { s: "media", icon: <FolderClosed className="h-[18px] w-[18px]" />, label: "Files" },
    { s: "notifications", icon: <Bell className="h-[18px] w-[18px]" />, label: "Notifications" },
  ];
  const isInTabView = screen === "home";
  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-border bg-background/60 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-5 pt-6 pb-4">
        <div className="grid h-9 w-9 place-items-center rounded-2xl text-[15px] font-bold text-[oklch(0.16_0.04_285)]" style={{ background: "linear-gradient(135deg, var(--lavender), var(--blush))" }}>L</div>
        <div className="font-display text-2xl tracking-tight">Lumina</div>
      </div>
      <button onClick={() => go("search")} className="mx-4 mb-3 flex h-10 items-center gap-2 rounded-xl bg-foreground/[0.06] px-3 text-[12.5px] text-foreground/55 hover:bg-foreground/[0.1] transition">
        <Search className="h-4 w-4" /> Search
        <span className="ml-auto rounded-md border border-border px-1.5 py-0.5 text-[10px] text-foreground/40">⌘K</span>
      </button>
      <nav className="flex flex-col gap-0.5 px-3">
        {items.map((it) => {
          const active = isInTabView && tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => { setTab(it.id); if (!isInTabView) go("home"); }}
              className={`group flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition ${active ? "bg-[var(--lavender)]/15 text-foreground" : "text-foreground/65 hover:bg-foreground/[0.06]"}`}
            >
              <span className={active ? "text-[var(--lavender)]" : ""}>{it.icon}</span>
              <span>{it.label}</span>
              {it.badge ? <span className="ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-[var(--lavender)] px-1.5 text-[10px] font-semibold text-white">{it.badge}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="mt-5 px-5 text-[10px] uppercase tracking-[0.18em] text-foreground/35">Library</div>
      <nav className="mt-1 flex flex-col gap-0.5 px-3">
        {extras.map((it) => (
          <button key={it.s} onClick={() => go(it.s)} className="flex h-9 items-center gap-3 rounded-xl px-3 text-[13px] text-foreground/65 hover:bg-foreground/[0.06] transition">
            <span>{it.icon}</span>{it.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto border-t border-border px-3 py-3">
        <button onClick={() => go("profile")} className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-foreground/[0.06]">
          <Avatar name="Ada" hue={290} />
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-[13px] font-semibold">Ada Lumen</div>
            <div className="truncate text-[11px] text-foreground/50">@ada · Online</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); go("settings"); }} className="grid h-8 w-8 place-items-center rounded-lg text-foreground/60 hover:bg-foreground/[0.08]">
            <SettingsIcon className="h-4 w-4" />
          </button>
        </button>
      </div>
    </aside>
  );
}

function DesktopWorkspace() {
  const { screen, tab } = useNav();
  // When in chat-style screens, render two-panel: list + active conversation
  const showList = screen === "home" && (tab === "chats" || tab === "calls" || tab === "communities");
  const detailScreen: Screen | null =
    screen === "chat" || screen === "groupChat" || screen === "call" || screen === "ai" ? screen
    : showList ? null : screen;

  return (
    <div className="flex h-screen min-w-0 flex-1">
      {/* Center list / browser panel */}
      <section className={`flex h-full min-w-0 flex-col border-r border-border ${showList || ["chat","groupChat","call"].includes(screen) ? "w-[360px] shrink-0" : "flex-1"}`}>
        {showList ? <DesktopListPanel /> : <DesktopMainPanel />}
      </section>

      {/* Right detail panel when applicable */}
      {(showList || ["chat","groupChat","call","ai"].includes(screen)) && (
        <section className="flex h-full min-w-0 flex-1 flex-col">
          <DesktopDetailPanel screen={detailScreen} />
        </section>
      )}

      {/* Optional info column */}
      {["chat","groupChat"].includes(screen) && (
        <aside className="hidden h-full w-[300px] shrink-0 flex-col border-l border-border bg-background/40 xl:flex">
          <DesktopInfoPanel />
        </aside>
      )}
    </div>
  );
}

function DesktopListPanel() {
  const { tab, go } = useNav();
  if (tab === "chats") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h1 className="text-[22px] font-bold tracking-tight">Chats</h1>
          <button onClick={() => go("newChat")} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--lavender)] text-white hover:opacity-90 transition">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4">
          <button onClick={() => go("search")} className="flex h-10 w-full items-center gap-2 rounded-xl bg-foreground/[0.06] px-3 text-[12.5px] text-foreground/55">
            <Search className="h-4 w-4" /> Search chats
          </button>
        </div>
        <div className="mt-3 flex-1 overflow-y-auto px-2 no-scrollbar">
          {SAMPLE_CHATS.map((c) => (
            <ChatRow key={c.id} chat={c} onClick={() => go(c.group ? "groupChat" : "chat", { id: c.id })} />
          ))}
        </div>
      </div>
    );
  }
  // For other tabs, just embed the existing mobile-style tab inside the panel
  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      {tab === "calls" && <CallsTab />}
      {tab === "communities" && <DiscoverScreen embedded />}
    </div>
  );
}

function DesktopMainPanel() {
  const { screen, tab } = useNav();
  // Embed the existing screen content centered with a wider max width for desktop reading
  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto w-full max-w-[760px] flex-1">
        <div className="lumi-fade flex flex-1 flex-col">
          {screen === "home" && tab === "ai" && <AiTab />}
          {screen === "home" && tab === "explore" && <DiscoverScreen embedded />}
          {screen === "home" && tab === "settings" && <SettingsScreen embedded />}
          {screen !== "home" && <ScreenRouter />}
        </div>
      </div>
    </div>
  );
}

function DesktopDetailPanel({ screen }: { screen: Screen | null }) {
  if (!screen) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-10 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl glass-strong">
          <MessageCircle className="h-9 w-9 text-foreground/60" />
        </div>
        <div>
          <div className="font-display text-3xl">Pick a conversation</div>
          <div className="mt-1 text-[13px] text-foreground/55">Select a chat from the list, or start a new one with ⌘N.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col">
        {screen === "chat" && <ChatScreen />}
        {screen === "groupChat" && <GroupChatScreen />}
        {screen === "call" && <CallScreen />}
        {screen === "ai" && <AiScreen />}
      </div>
    </div>
  );
}

function DesktopInfoPanel() {
  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="flex flex-col items-center gap-2 pt-2">
        <Avatar name="Nori" hue={295} />
        <div className="text-[15px] font-semibold">Nori</div>
        <div className="text-[11px] text-foreground/55">Active now · Aurora</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[{ i: <Bell className="h-4 w-4" />, l: "Mute" }, { i: <Search className="h-4 w-4" />, l: "Search" }, { i: <Share2 className="h-4 w-4" />, l: "Share" }].map((a) => (
          <button key={a.l} className="flex flex-col items-center gap-1 rounded-xl bg-foreground/[0.05] py-3 text-[11px] text-foreground/70 hover:bg-foreground/[0.08]">
            {a.i}{a.l}
          </button>
        ))}
      </div>
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-foreground/40">Shared media</div>
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg" style={{ background: `linear-gradient(135deg, var(--lavender), var(--blush) ${20 + i * 6}%, var(--sky))`, opacity: 0.45 + (i % 3) * 0.15 }} />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-foreground/40">Files</div>
        <div className="flex flex-col gap-1.5">
          {["Pitch.pdf", "moodboard.fig", "voice-031.m4a"].map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-lg bg-foreground/[0.04] px-2.5 py-2 text-[12px]">
              <FileText className="h-3.5 w-3.5 text-foreground/60" /> {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
