import { BarChart3, Sparkles, Zap, ShieldCheck, type LucideIcon } from "lucide-react";
import { Reveal } from "./Reveal";

type Project = {
  icon: LucideIcon;
  title: string;
  description: string;
  iconGradient: string;
  glowColor: string;
};

const projects: Project[] = [
  {
    icon: BarChart3,
    title: "Smart Nutrition Analysis",
    description:
      "Automatic generation of personalized meal based on your goals and budget constraints.",
    iconGradient:
      "linear-gradient(135deg, oklch(0.55 0.18 265), oklch(0.4 0.12 265))",
    glowColor: "oklch(0.66 0.19 265)",
  },
  {
    icon: Sparkles,
    title: "AI Meal Planning",
    description:
      "Turn raw menu data into actionable meal plans with optimized protein targets delivered in one simple tap.",
    iconGradient:
      "linear-gradient(135deg, oklch(0.6 0.22 305), oklch(0.42 0.15 305))",
    glowColor: "oklch(0.62 0.22 305)",
  },
  {
    icon: Zap,
    title: "Real-time Intelligence",
    description:
      "Connect to live canteen menus and watch your recommendations update as prices change.",
    iconGradient:
      "linear-gradient(135deg, oklch(0.65 0.18 215), oklch(0.4 0.13 215))",
    glowColor: "oklch(0.65 0.18 215)",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-First Nutrition",
    description:
      "Secure AI that processes your dietary data locally or via encrypted channels.",
    iconGradient:
      "linear-gradient(135deg, oklch(0.42 0.04 260), oklch(0.28 0.03 260))",
    glowColor: "oklch(0.7 0.04 260)",
  },
];

export function RecentProjects() {
  return (
    <section id="features" className="relative px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal variant="up">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gradient">
              Features Offered
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              A glimpse into what Our AI can do.
            </p>
          </div>
        </Reveal>


        <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {projects.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} variant="up" delay={i * 120}>
                <article
                  className="group glass-card relative rounded-2xl p-6 md:p-7 transition-all duration-500 hover:-translate-y-2 hover:border-foreground/20 h-full"
                  style={
                    {
                      "--glow": p.glowColor,
                    } as React.CSSProperties
                  }
                >
                  {/* hover halo */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in oklab, var(--glow) 22%, transparent) 0%, transparent 70%)",
                    }}
                  />
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                    style={{
                      background: p.iconGradient,
                      boxShadow:
                        "inset 0 1px 0 0 oklch(1 0 0 / 15%), 0 8px 24px -8px color-mix(in oklab, var(--glow) 60%, transparent)",
                    }}
                  >
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="relative mt-6 text-xl font-semibold tracking-tight text-foreground">
                    {p.title}
                  </h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
