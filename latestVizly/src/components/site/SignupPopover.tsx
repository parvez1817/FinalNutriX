import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Loader2, Lock, Mail, User, Weight, X } from "lucide-react";
import { signupApi, ApiError } from "@/lib/api";
import { calculateAge, localDateString } from "@/lib/profile";

type View = "options" | "email";

interface SignupPopoverProps {
  open: boolean;
  onClose: () => void;
}

export function SignupPopover({ open, onClose }: SignupPopoverProps) {
  const [view, setView] = useState<View>("options");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [allergies, setAllergies] = useState("");

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setView("options");
        setSubmitting(false);
        setErrorMsg(null);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await signupApi({
        email,
        password,
        name,
        dateOfBirth,
        weightKg: Number(weightKg),
        allergies: allergies
          .split(",")
          .map((allergy) => allergy.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Couldn't create account";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close signup"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      />

      {/* Popover */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create your nutriX Restro account"
        className="fixed right-4 top-20 z-50 max-h-[calc(100vh-6rem)] w-[min(92vw,22rem)] origin-top-right overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="glass-card relative overflow-hidden rounded-2xl p-6 shadow-2xl">
          {/* Subtle brand glow */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--gradient-brand)" }}
          />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {view === "options" ? (
            <div className="relative">
              <div className="text-center">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Create your studio
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Create your account with your email and password.
                </p>
              </div>

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setView("email")}
                  className="btn-gradient hover:btn-gradient-hover inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold"
                >
                  Sign up with email and password
                </button>
              </div>

              <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
                By signing in, you accept the{" "}
                <a
                  href="#"
                  className="text-foreground/80 underline underline-offset-2 hover:text-foreground"
                >
                  Terms of Service
                </a>{" "}
                and acknowledge our{" "}
                <a
                  href="#"
                  className="text-foreground/80 underline underline-offset-2 hover:text-foreground"
                >
                  Privacy Policy
                </a>
                .
              </p>

              <div className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  onClick={onClose}
                  className="font-medium text-primary transition-colors hover:text-primary-glow"
                >
                  Login to nutriX Restro
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setView("options")}
                className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              <div className="text-center">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Sign up with email
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Create your free nutriX Restro account
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="su-name"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="su-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ada Lovelace"
                      className="h-10 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="su-date-of-birth"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Date of birth
                  </label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="su-date-of-birth"
                      type="date"
                      value={dateOfBirth}
                      max={localDateString()}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="h-10 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm text-foreground transition-all duration-200 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Age:{" "}
                    {dateOfBirth
                      ? `${calculateAge(dateOfBirth) ?? "Invalid"} years`
                      : "calculated from your birth date"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="su-weight"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Weight (kg)
                  </label>
                  <div className="relative">
                    <Weight className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="su-weight"
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      min="1"
                      max="500"
                      step="0.1"
                      placeholder="e.g. 65"
                      className="h-10 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="su-allergies"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Allergic to
                  </label>
                  <input
                    id="su-allergies"
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. peanuts, shellfish; leave blank if none"
                    className="h-10 w-full rounded-lg border border-input bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Separate multiple allergens with commas. Check ingredients with the restaurant.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="su-email"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="su-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="h-10 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="su-password"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="su-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      className="h-10 w-full rounded-lg border border-input bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:border-primary/50 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                {errorMsg && <p className="text-xs text-red-400 -mt-1">{errorMsg}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gradient hover:btn-gradient-hover inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:opacity-70"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Creating account..." : "Create account"}
                </button>
              </form>

              <div className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  onClick={onClose}
                  className="font-medium text-primary transition-colors hover:text-primary-glow"
                >
                  Login to nutriX Restro
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
