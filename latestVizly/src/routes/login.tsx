import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Activity, Loader2, Lock, Mail } from "lucide-react";
import { loginApi, ApiError } from "@/lib/api";
import { SignupPopover } from "@/components/site/SignupPopover";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — nutriX Restro" },
      {
        name: "description",
        content: "Sign in to nutriX Restro to access your dashboards, charts, and data workflows.",
      },
      { property: "og:title", content: "Sign in — nutriX Restro" },
      {
        property: "og:description",
        content: "Sign in to nutriX Restro to access your dashboards, charts, and data workflows.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupOpen, setSignupOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await loginApi({ email, password });
      navigate({ to: "/" });
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Couldn't sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Atmospheric background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full opacity-50 blur-[100px]"
          style={{ background: "var(--gradient-brand)" }}
        />
        <div className="absolute top-1/3 right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-accent-violet/30 opacity-40 blur-[120px]" />
        <div className="absolute bottom-[-10rem] left-1/4 h-[26rem] w-[26rem] rounded-full bg-primary/25 opacity-40 blur-[110px]" />
      </div>

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, color-mix(in oklab, var(--foreground) 10%, transparent) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Main content */}
      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <Link
            to="/"
            className="text-base font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            nutriX Restro
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to site
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-rise">
            <div className="glass-card rounded-2xl p-8 sm:p-10">
              {/* Brand */}
              <div className="flex flex-col items-center text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <Activity className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
                  nutriX Restro
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your credentials to continue
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="h-11 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-xs font-medium text-primary transition-colors hover:text-primary-glow"
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                {errorMsg && <p className="text-xs text-red-400 -mb-1">{errorMsg}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gradient hover:btn-gradient-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:opacity-70"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setSignupOpen(true)}
                  className="font-medium text-primary transition-colors hover:text-primary-glow"
                >
                  Create free studio
                </button>
              </p>
            </div>
          </div>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 nutriX Restro. All systems operational.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="transition-colors hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Security
            </a>
          </div>
        </footer>
      </main>

      {/* Watermark */}
      <div className="pointer-events-none absolute bottom-0 left-0 select-none overflow-hidden">
        <span className="block translate-y-6 text-[12rem] font-extrabold leading-none tracking-tighter text-foreground/[0.03]">
          NUTRIX
        </span>
      </div>

      <SignupPopover open={signupOpen} onClose={() => setSignupOpen(false)} />
    </div>
  );
}
