import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";

type Preset = {
  name: string;
  colors: [string, string, string, string] | null;
};

const PRESETS: Preset[] = [
  { name: "None", colors: null },

  { name: "Obsidian", colors: ["#000000","#226089","#4592AE","#E3C4A8"] },
  { name: "Royal Cyan", colors: ["#3D6DB9","#01D1FF","#00FFF1","#FAFBF6"] },
  { name: "Deep Mint", colors: ["#1E6261","#2D767F","#B4F2F1","#ECFFFB"] },
  { name: "Violet Sage", colors: ["#A66CC1","#A7ACEC","#ACE7EF","#CEFFF0"] },
  { name: "Ember", colors: ["#075F63","#49BEB6","#FAD05A","#FF5959"] },
  { name: "Neon Mint", colors: ["#A7FFF3","#74F9FE","#00E1FF","#E8FFE8"] },
  { name: "Ocean Purple", colors: ["#245643","#245643","#245643","#245643"] },
  { name: "Cotton Candy", colors: ["#FBB1B0","#F0F696","#97F7D2","#F485FC"] },
  { name: "Lemonade", colors: ["#FDF4A9","#3B9A9C","#41ABAE","#245643"] },
  { name: "Midnight", colors: ["#060608","#2370A1","#A495C6","#FAD3CE"] },
  { name: "Slate Glass", colors: ["#446592","#4A89AC","#ACE5F6","#E3FCF9"] },
  { name: "Indigo Dusk", colors: ["#324F7B","#5067AA","#88A6DE","#F8F8F8"] },
  { name: "Woodland", colors: ["#58784F","#709078","#77B09F","#F8CFAF"] },
  { name: "Plumberry", colors: ["#6C5FA7","#6B3779","#B24968","#FA8573"] },
  { name: "Sunset Fire", colors: ["#2C4059","#EA5455","#EF7B3E","#FFD451"] },
  { name: "Bioluminance", colors: ["#0E117A","#399169","#12E2A4","#DCF516"] },
  { name: "Dusk Rose", colors: ["#61305D","#B45C6C","#E67C7C","#F6B679"] },
  { name: "Desert Bloom", colors: ["#A75377","#D3785D","#E0B362","#F6EB82"] },
  { name: "Fern Light", colors: ["#F3E8D2","#88D398","#1A946F","#114B5F"] },
  { name: "Crimson Ash", colors: ["#34222E","#E2424A","#F9BFB8","#FEE9D6"] },
  { name: "Terracotta", colors: ["#84587C","#C65F63","#F7E1B8","#F7E1B8"] },
  { name: "Jade Stone", colors: ["#236969","#44A680","#73F6A6","#73F6A6"] },
  { name: "Peach Dream", colors: ["#FFB997","#F67E7D","#833B61","#833B61"] },
  { name: "Gold Ember", colors: ["#FFF1C2","#FD5F55","#A64942","#A64942"] },
];

export function DesignSystemPicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedPreset = PRESETS.find((p) => p.name === selected) ?? null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={selectedPreset ? `Design system: ${selectedPreset.name}` : "Choose design system"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
      >
        {selectedPreset?.colors ? (
          <span
            aria-hidden
            className="relative h-5 w-5 rounded-full overflow-hidden border border-border"
          >
            <span
              className="absolute inset-0"
              style={{
                background: `conic-gradient(${selectedPreset.colors[0]} 0 25%, ${selectedPreset.colors[1]} 25% 50%, ${selectedPreset.colors[2]} 50% 75%, ${selectedPreset.colors[3]} 75% 100%)`,
              }}
            />
          </span>
        ) : (
          <Palette className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 z-50 w-80 origin-bottom-right animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-2xl border border-border bg-popover p-4 shadow-xl max-h-[420px] overflow-y-auto text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md text-primary">
                <Palette className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Design Systems</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Vizly will auto-select based on your prompt unless a specific Design System is picked.
            </p>

            <div className="text-xs font-medium text-muted-foreground mb-2">Presets</div>
            <ul className="space-y-1">
              {PRESETS.map((preset) => {
                const isSelected = selected === preset.name;
                return (
                  <li key={preset.name}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(preset.name);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${
                        isSelected
                          ? "bg-accent/60 text-foreground"
                          : "hover:bg-accent/40 text-foreground/90"
                      }`}
                    >
                      {preset.colors ? (
                        <span
                          aria-hidden
                          className="relative h-7 w-7 rounded-full overflow-hidden border border-border shrink-0"
                        >
                          <span
                            className="absolute inset-0"
                            style={{
                              background: `conic-gradient(${preset.colors[0]} 0 25%, ${preset.colors[1]} 25% 50%, ${preset.colors[2]} 50% 75%, ${preset.colors[3]} 75% 100%)`,
                            }}
                          />
                        </span>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border shrink-0 bg-secondary/50 text-muted-foreground">
                          <Palette className="h-3 w-3" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
