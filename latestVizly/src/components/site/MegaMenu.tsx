import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

type MenuItem = { title: string; description: string };
type MenuGroup = { heading?: string; items: MenuItem[] };

export type MegaMenuContent = {
  key: string;
  label: string;
  panel: {
    title: string;
    tagline: string;
    cta: string;
    href?: string;
  };
  groups: MenuGroup[];
};

export const megaMenus: MegaMenuContent[] = [
  {
    key: "features",
    label: "Features",
    panel: {
      title: "Features",
      tagline: "Everything you need to turn raw data into intelligent visual stories.",
      cta: "Explore Features",
    },
    groups: [
      {
        items: [
          {
            title: "AI-Powered Nutrition Intelligence",
            description: "Automatically detects optimal meal combos, budget gaps, and protein opportunities in your menu.",
          },
          {
            title: "Interactive Chat Interface",
            description: "User friendly conversation with smart LLms.",
          },
          {
            title: "Smart Menu Processing",
            description: "Input menu text, CSV, or paste food items and get instant structured nutrition data.",
          },
          {
            title: "Customizable Meal Plans",
            description: "Adjust protein goals, budget limits, and dietary preferences with live plan updates.",
          },
          {
            title: "One-Click Meal Export",
            description: "Export your meal plan as PDF, shopping list, or shareable nutrition summary.",
          },
        ],
      },
    ],
  },
  {
    key: "charts",
    label: "Models",
    panel: {
      title: "Models",
      tagline: "A complete set of visuals showing exactly how NutriX's protein model was trained, tested, and validated.",
      cta: "Browse Models",
    },
    groups: [
      {
        heading: "Model Performance",
        items: [
          { title: "Predicted vs Actual", description: "How close our protein estimates land to real values." },
          { title: "Residual Plot", description: "Where the model over- or under-predicts." },
          { title: "Error Distribution", description: "Spread of prediction errors across the dataset." },
          { title: "Feature Importance", description: "Which words drive the protein estimate most." },
          { title: "Model Comparison", description: "Ridge vs Random Forest vs Gradient Boosting, side by side." },
        ],
      },
      {
        heading: "Dataset Insights",
        items: [
          { title: "Training Distribution", description: "Spread of protein values across all 200 food items." },
          { title: "Category Breakdown", description: "Non-veg, veg, dairy, and snacks represented in the data." },
          { title: "Price vs Protein", description: "Relationship between cost and protein content." },
          { title: "Serving Size Spread", description: "Distribution of portion sizes in the dataset." },
        ],
      },
    ],
  },
  {
    key: "docs",
    label: "Docs",
    panel: {
      title: "Docs",
      tagline: "Guides, references, and best practices to get the most out of NutriX.",
      cta: "Open Docs",
    },
    groups: [
      {
        items: [
          {
            title: "Quick Start Guide",
            description: "Get up and running with NutriX in minutes.",
          },
          {
            title: "Menu Input & Formatting",
            description: "Supported formats and best practices for entering food items.",
          },
          {
            title: "Recommendation Customization",
            description: "Learn how to adjust protein goals, budget limits, and dietary preferences.",
          },
          {
            title: "AI Predictions Explained",
            description: "Understand how the ML model estimates protein for unseen menu items.",
          },
          {
            title: "Export & Sharing Guide",
            description: "Steps to save, download, or share your meal recommendations.",
          },
        ],
      },
    ],
  },
  {
    key: "solutions",
    label: "Solutions",
    panel: {
      title: "Solutions",
      tagline: "Built for analysts, founders, students, and teams that move on data.",
      cta: "See Solutions",
    },
    groups: [
      {
        items: [
          {
            title: "Fitness Tracking",
            description: "Monitor daily protein intake and nutrition goals with AI-powered meal analysis.",
          },
          {
            title: "College Canteen Optimization",
            description: "Help students make budget-smart, protein-rich meal choices in seconds.",
          },
          {
            title: "Nutritionist Consultations",
            description: "Provide clients with AI-generated meal plans tailored to their specific dietary needs.",
          },
          {
            title: "Restaurant Menu Analysis",
            description: "Discover hidden nutritional gems and budget-friendly high-protein combos on any menu.",
          },
          {
            title: "Corporate Wellness Programs",
            description: "Empower employees to make healthier lunch choices aligned with their fitness goals.",
          },
          // {
          //   title: "Meal Prep Planning",
          //   description: "Generate weekly meal strategies that balance nutrition, cost, and variety.",
          // },
        ],
      },
    ],
  },
];

type MegaMenuProps = {
  activeKey: string | null;
  onOpen: (key: string) => void;
  onClose: () => void;
};

export function MegaMenu({ activeKey, onOpen, onClose }: MegaMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [mounted, setMounted] = useState<string | null>(null);

  useEffect(() => {
    if (activeKey) {
      setMounted(activeKey);
      return;
    }
    const id = window.setTimeout(() => setMounted(null), 220);
    return () => window.clearTimeout(id);
  }, [activeKey]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => onClose(), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const current = megaMenus.find((m) => m.key === (activeKey ?? mounted));
  const isOpen = Boolean(activeKey);

  return (
    <div className="hidden md:block">
      <ul
        className="flex items-center gap-8"
        onMouseLeave={scheduleClose}
      >
        {megaMenus.map((item) => (
          <li
            key={item.key}
            onMouseEnter={() => {
              cancelClose();
              onOpen(item.key);
            }}
          >
            <button
              type="button"
              onClick={() => (activeKey === item.key ? onClose() : onOpen(item.key))}
              aria-expanded={activeKey === item.key}
              aria-haspopup="true"
              className={`group relative text-sm transition-colors ${
                activeKey === item.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
              <span
                className={`pointer-events-none absolute -bottom-2 left-0 h-[2px] rounded-full bg-primary transition-all duration-300 ${
                  activeKey === item.key ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      {mounted && current && (
        <div
          ref={containerRef}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className={`fixed left-1/2 top-[72px] z-40 w-[min(1100px,calc(100vw-3rem))] -translate-x-1/2 transform-gpu transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isOpen
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "-translate-y-2 opacity-0 pointer-events-none"
          }`}
          role="dialog"
          aria-label={`${current.label} menu`}
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-popover/95 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
              <div className="relative bg-background p-8 md:p-10">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 0% 0%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 60%)",
                  }}
                />
                <div className="relative">
                  <h3 className="text-gradient text-3xl md:text-4xl font-bold tracking-tight">
                    {current.panel.title}
                  </h3>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {current.panel.tagline}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/60 px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
                  >
                    {current.panel.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-popover p-8 md:p-10 max-h-[70vh] overflow-y-auto">
                <div className="space-y-8">
                  {current.groups.map((group, gi) => (
                    <div key={gi}>
                      {group.heading && (
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                          {group.heading}
                        </h4>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {group.items.map((it, ii) => (
                          <a
                            key={ii}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onClose();
                            }}
                            style={{
                              animation: isOpen
                                ? `rise 480ms cubic-bezier(0.16,1,0.3,1) ${
                                    60 + (gi * 5 + ii) * 35
                                  }ms both`
                                : undefined,
                            }}
                            className="group/item block rounded-xl p-3 -mx-3 transition-all duration-200 hover:bg-accent/40"
                          >
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <span className="transition-colors group-hover/item:text-primary">
                                {it.title}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 text-primary transition-all duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {it.description}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
