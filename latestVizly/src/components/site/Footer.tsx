import { useState } from "react";
import {
  Twitter,
  Github,
  Youtube,
  Instagram,
  MessageCircle,
  Music2,
  Check,
  Loader2,
} from "lucide-react";
import { subscribeApi, ApiError } from "@/lib/api";
import { toast } from "sonner";

const socialIcons = [
  { label: "Twitter", Icon: Twitter, href: "#" },
  { label: "GitHub", Icon: Github, href: "#" },
  { label: "Discord", Icon: MessageCircle, href: "#" },
  { label: "YouTube", Icon: Youtube, href: "#" },
  { label: "TikTok", Icon: Music2, href: "#" },
  { label: "Instagram", Icon: Instagram, href: "#" },
];

const cols = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Security"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Community"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog"],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("loading");
    try {
      const res = await subscribeApi({ email, source: "footer" });
      setStatus("success");
      toast.success(
        res.alreadySubscribed ? "You're already subscribed 🎉" : "Subscribed! Welcome aboard 🎉",
      );
      setEmail("");
      setTimeout(() => setStatus("idle"), 2200);
    } catch (err) {
      setStatus("idle");
      toast.error(err instanceof ApiError ? err.message : "Couldn't subscribe");
    }
  };

  return (
    <footer className="relative mt-12 px-6 pt-20 pb-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-3">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              nutriX Restro
            </h3>

            <div className="mt-6 flex items-center gap-5">
              {socialIcons.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-muted-foreground/80 transition-all duration-200 hover:text-foreground hover:-translate-y-0.5"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </a>
              ))}
            </div>

            <p className="mt-7 text-sm text-muted-foreground max-w-sm">
              Get product updates and news from nutriX Restro.
            </p>

            <form
              onSubmit={handleSubscribe}
              className="mt-4 flex items-stretch gap-2 max-w-sm"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                disabled={status !== "idle"}
                className="flex-1 h-11 rounded-md border border-border bg-surface/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary/60 focus:bg-surface disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={status !== "idle"}
                aria-live="polite"
                className={`relative h-11 min-w-[7.5rem] overflow-hidden rounded-md px-5 text-sm font-semibold transition-all duration-300 ${
                  status === "success"
                    ? "bg-emerald-500 text-white shadow-[0_0_0_3px_color-mix(in_oklab,theme(colors.emerald.500)_25%,transparent)] scale-[1.03]"
                    : "btn-gradient hover:btn-gradient-hover"
                } disabled:cursor-not-allowed`}
              >
                <span
                  className={`flex items-center justify-center gap-2 transition-all duration-300 ${
                    status === "loading" ? "opacity-100" : status === "success" ? "opacity-0 -translate-y-2" : "opacity-100"
                  }`}
                  style={{ display: status === "success" ? "none" : "flex" }}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subscribing…
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </span>
                {status === "success" && (
                  <span className="absolute inset-0 flex items-center justify-center gap-2 animate-scale-in">
                    <Check className="h-5 w-5 animate-[scale-in_0.25s_ease-out]" strokeWidth={3} />
                    Subscribed
                  </span>
                )}
              </button>
            </form>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/90">
                {col.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Big watermark */}
        <div
          aria-hidden
          className="pointer-events-none select-none mt-12 -mb-8 overflow-hidden"
        >
          <div
            className="text-[28vw] md:text-[18vw] leading-none font-bold tracking-tighter text-foreground/[0.04]"
            style={{ lineHeight: 0.85 }}
          >
            NUTRIX
          </div>
        </div>

        <div className="relative border-t border-border mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs uppercase tracking-wider text-muted-foreground/70">
          <p>© 2027 nutriX. All systems operational.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
