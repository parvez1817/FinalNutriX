import { Play } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-16 md:px-12 md:py-24 text-center">
          {/* inner aurora */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 50% 50%, color-mix(in oklab, var(--primary) 14%, transparent) 0%, transparent 65%)",
            }}
          />
          <div
            aria-hidden
            className="aurora-blob animate-aurora-2"
            style={{
              top: "-30%",
              left: "10%",
              width: "60%",
              height: "120%",
              background:
                "radial-gradient(circle, oklch(0.55 0.22 295) 0%, transparent 60%)",
              opacity: 0.25,
            }}
          />
          <div className="relative">
            <h2 className="text-gradient text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Ready to maximize your nutrition?
            </h2>
            <p className="mt-6 mx-auto max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
              Share your menu, and let NutriX build perfect meal combinations with intelligent optimization, cost savings, and instant AI advice.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 hover:scale-[1.02] shadow-[0_10px_30px_-10px_oklch(1_0_0_/_30%)]"
              >
                Plan Your First Plate
              </button>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-7 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-secondary hover:border-foreground/20"
              >
                <Play className="h-4 w-4" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
