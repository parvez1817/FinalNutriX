import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SignupPopover } from "./SignupPopover";
import { UserMenu } from "./UserMenu";
import { MegaMenu } from "./MegaMenu";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { user, hydrated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-background/70 border-b border-border"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:py-5">
        <a
          href="#"
          className="text-base md:text-lg font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity"
        >
          nutriX Restro
        </a>

        <MegaMenu
          activeKey={activeMenu}
          onOpen={setActiveMenu}
          onClose={() => setActiveMenu(null)}
        />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {hydrated && user ? (
            <UserMenu user={user} onSignOut={logout} />
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex h-10 items-center justify-center rounded-lg border border-border bg-secondary/60 px-5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary hover:border-foreground/20"
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => setSignupOpen((v) => !v)}
                aria-expanded={signupOpen}
                aria-haspopup="dialog"
                className="btn-gradient hover:btn-gradient-hover inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold"
              >
                Start Creating
              </button>
            </>
          )}
        </div>
      </nav>
      <SignupPopover open={signupOpen} onClose={() => setSignupOpen(false)} />
    </header>
  );
}
