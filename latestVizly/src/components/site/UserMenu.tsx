import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Users, X } from "lucide-react";
import type { AuthUser } from "@/hooks/use-auth";

interface UserMenuProps {
  user: AuthUser;
  onSignOut: () => void;
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open account menu"
        className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-secondary/60 ring-offset-background transition-all duration-200 hover:border-foreground/30 hover:ring-2 hover:ring-primary/30"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-accent-violet/40 text-sm font-semibold text-foreground">
            {initials || "U"}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Account menu"
          className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] origin-top-right animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="glass-card relative overflow-hidden rounded-2xl p-6 shadow-2xl">
            <div
              className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-30 blur-3xl"
              style={{ background: "var(--gradient-brand)" }}
            />

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative text-center">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {user.provider === "google" ? "Google" : "nutriX Restro"}
              </h2>
            </div>

            <div className="relative mt-4 flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-secondary/60">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-accent-violet/40 text-sm font-semibold text-foreground">
                    {initials || "U"}
                  </span>
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="relative mt-5 space-y-2.5">
              <MenuButton
                icon={<Users className="h-4 w-4" />}
                label="Switch Account"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                  navigate({ to: "/login" });
                }}
              />
              <MenuButton
                icon={<LogOut className="h-4 w-4" />}
                label="Sign out"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
              />
            </div>

            <div className="relative mt-5 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">
                Terms &amp; Privacy
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Third Party Notices
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-border bg-secondary/40 text-sm font-medium text-foreground transition-all duration-200 hover:border-foreground/20 hover:bg-secondary/70"
    >
      {icon}
      {label}
    </button>
  );
}
