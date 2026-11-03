import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { googleSignInApi, ApiError } from "@/lib/api";

const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
  "1088181726401-9entbbkjdv9q4eonlmrnl9q4h6j6jpcr.apps.googleusercontent.com";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: any;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google SDK")));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google SDK"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface Props {
  label?: string;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
  className?: string;
}

/**
 * Google Sign-In button using Google Identity Services.
 * Renders Google's official button + handles credential -> backend exchange.
 */
export function GoogleSignInButton({ label = "Continue with Google", onSuccess, onError, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (resp: { credential?: string }) => {
            if (!resp?.credential) {
              onError?.("No credential returned from Google");
              return;
            }
            setLoading(true);
            try {
              await googleSignInApi(resp.credential);
              onSuccess?.();
            } catch (err) {
              const msg = err instanceof ApiError ? err.message : "Google sign-in failed";
              onError?.(msg);
            } finally {
              setLoading(false);
            }
          },
          ux_mode: "popup",
          auto_select: false,
        });
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(containerRef.current, {
            type: "standard",
            theme: "filled_black",
            size: "large",
            shape: "rectangular",
            text: label.toLowerCase().includes("sign in") ? "signin_with" : "continue_with",
            logo_alignment: "left",
            width: containerRef.current.clientWidth || 320,
          });
        }
        setReady(true);
      })
      .catch((e) => onError?.(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`group relative w-full ${className ?? ""}`}>
      {/* Gradient ring on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
        style={{ background: "var(--gradient-brand)" }}
      />
      {/* Styled frame around Google's iframe button */}
      <div className="relative overflow-hidden rounded-xl border border-input bg-background/60 p-[2px] shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:border-primary/50 group-hover:bg-background/80 group-hover:shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--primary)_55%,transparent)]">
        <div className="relative flex h-11 w-full items-center justify-center overflow-hidden rounded-[10px] bg-background/70">
          <div
            ref={containerRef}
            className="flex w-full justify-center [color-scheme:light] [&>div]:!w-full [&_iframe]:!mx-auto"
          />
          {(!ready || loading) && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-[10px] bg-secondary/70 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {loading ? "Signing in…" : "Loading Google…"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
