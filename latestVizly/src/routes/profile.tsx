import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Pencil, UserRound } from "lucide-react";
import { AuroraBackground } from "@/components/site/AuroraBackground";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { getProfileApi, updateProfileApi, type UserProfile } from "@/lib/api";
import { calculateAge, localDateString } from "@/lib/profile";

type ProfileDraft = {
  name: string;
  dateOfBirth: string;
  weightKg: string;
  allergies: string;
};

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Manage profile — NutriX" },
      { name: "description", content: "View and update your NutriX profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>({
    name: "",
    dateOfBirth: "",
    weightKg: "",
    allergies: "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await getProfileApi());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hydrated && !user?.email) void navigate({ to: "/login" });
    if (hydrated && user?.email) void loadProfile();
  }, [hydrated, loadProfile, navigate, user?.email]);

  const beginEditing = () => {
    if (!profile) return;
    setDraft({
      name: profile.name,
      dateOfBirth: profile.dateOfBirth ?? "",
      weightKg: profile.weightKg == null ? "" : String(profile.weightKg),
      allergies: profile.allergies.join(", "),
    });
    setError(null);
    setEditing(true);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updatedProfile = await updateProfileApi({
        name: draft.name.trim(),
        dateOfBirth: draft.dateOfBirth,
        weightKg: Number(draft.weightKg),
        allergies: draft.allergies
          .split(",")
          .map((allergy) => allergy.trim())
          .filter(Boolean),
      });
      setProfile(updatedProfile);
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <AuroraBackground />
      <div className="relative z-10 mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <ThemeToggle />
        </header>

        <section className="glass-card rounded-2xl p-6 shadow-xl sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your personal and nutrition details
                </p>
              </div>
            </div>
            {!loading && profile && !editing && (
              <button
                type="button"
                onClick={beginEditing}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading your profile...
            </p>
          ) : profile ? (
            editing ? (
              <form onSubmit={saveProfile} className="space-y-5">
                <ProfileField label="Full name">
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    maxLength={100}
                    required
                    className={inputClass}
                  />
                </ProfileField>
                <ProfileField label="Email">
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className={readOnlyInputClass}
                  />
                </ProfileField>
                <ProfileField label="Date of birth">
                  <input
                    type="date"
                    value={draft.dateOfBirth}
                    max={localDateString()}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, dateOfBirth: event.target.value }))
                    }
                    required
                    className={inputClass}
                  />
                  <span className="text-xs text-muted-foreground">
                    Age:{" "}
                    {calculateAge(draft.dateOfBirth) == null
                      ? "—"
                      : `${calculateAge(draft.dateOfBirth)} years`}{" "}
                    (calculated automatically)
                  </span>
                </ProfileField>
                <ProfileField label="Weight (kg)">
                  <input
                    type="number"
                    value={draft.weightKg}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, weightKg: event.target.value }))
                    }
                    min="1"
                    max="500"
                    step="0.1"
                    required
                    className={inputClass}
                  />
                </ProfileField>
                <ProfileField label="Allergic to">
                  <input
                    type="text"
                    value={draft.allergies}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, allergies: event.target.value }))
                    }
                    placeholder="e.g. peanuts, shellfish; leave blank if none"
                    className={inputClass}
                  />
                  <span className="text-xs text-muted-foreground">
                    Separate allergens with commas. Confirm ingredients with the restaurant.
                  </span>
                </ProfileField>
                {error && (
                  <p role="alert" className="text-sm text-red-500">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setError(null);
                    }}
                    className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-gradient inline-flex h-10 items-center rounded-lg px-5 text-sm font-semibold disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <ProfileValue label="Full name" value={profile.name || "Not set"} />
                <ProfileValue label="Email" value={profile.email} />
                <ProfileValue label="Date of birth" value={profile.dateOfBirth ?? "Not set"} />
                <ProfileValue
                  label="Age"
                  value={profile.age == null ? "Not set" : `${profile.age} years`}
                />
                <ProfileValue
                  label="Weight"
                  value={profile.weightKg == null ? "Not set" : `${profile.weightKg} kg`}
                />
                <ProfileValue
                  label="Allergic to"
                  value={profile.allergies.length ? profile.allergies.join(", ") : "None"}
                />
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Recommendations exclude listed allergens when they appear in menu item names. Menu
                  descriptions may not list every ingredient; verify with the restaurant.
                </p>
              </dl>
            )
          ) : (
            <div className="space-y-3 py-4">
              {error && (
                <p role="alert" className="text-sm text-red-500">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={() => void loadProfile()}
                className="h-10 rounded-lg border border-border px-4 text-sm hover:bg-secondary"
              >
                Retry
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20";
const readOnlyInputClass =
  "h-11 w-full cursor-not-allowed rounded-lg border border-input bg-secondary/40 px-3 text-sm text-muted-foreground";

function ProfileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ProfileValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-4 py-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
