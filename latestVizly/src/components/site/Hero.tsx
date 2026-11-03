import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Plus,
  X,
  ArrowRight,
  IndianRupee,
  Target,
  Wallet,
  ImagePlus,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { saveNutrixPayload, type DietaryPreference, type FoodItem } from "@/lib/nutrix";
import { recognizeFoodMenuApi } from "@/lib/api";

const STATIC_PREFIX = "Add your food items, ";
const ROTATING_SUFFIXES = [
  "set your budget & protein goal...",
  "then discover optimal combos...",
  "maximize protein, minimize spend...",
];

export function Hero() {
  const navigate = useNavigate();

  // Food items state
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [isRecognizingMenu, setIsRecognizingMenu] = useState(false);
  const [menuUploadMessage, setMenuUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Config state
  const [budget, setBudget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>("ANY");

  // Typewriter
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    if (menuItems.length > 0) return;

    const current = ROTATING_SUFFIXES[suffixIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (typed.length < current.length) {
        timeout = setTimeout(() => setTyped(current.slice(0, typed.length + 1)), 55);
      } else {
        timeout = setTimeout(() => setPhase("pausing"), 1600);
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("deleting"), 600);
    } else {
      if (typed.length > 0) {
        timeout = setTimeout(() => setTyped(current.slice(0, typed.length - 1)), 30);
      } else {
        setSuffixIndex((i) => (i + 1) % ROTATING_SUFFIXES.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [typed, phase, suffixIndex, menuItems.length]);

  const addItem = () => {
    const name = itemName.trim();
    const price = parseFloat(itemPrice);
    if (!name || isNaN(price) || price <= 0) return;
    setMenuItems((prev) => [...prev, { name, price }]);
    setItemName("");
    setItemPrice("");
  };

  const removeItem = (index: number) => {
    setMenuItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMenuImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setMenuUploadMessage("");
    setIsRecognizingMenu(true);
    try {
      const { items } = await recognizeFoodMenuApi(file);
      if (items.length === 0) {
        setMenuUploadMessage("No priced food items were found. Try a clearer menu image.");
        return;
      }
      setMenuItems((prev) => [...prev, ...items]);
      setMenuUploadMessage(
        `Added ${items.length} item${items.length === 1 ? "" : "s"} from the menu image.`,
      );
    } catch (error) {
      setMenuUploadMessage(
        error instanceof Error ? error.message : "Could not read the menu image. Please try again.",
      );
    } finally {
      setIsRecognizingMenu(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const b = parseFloat(budget);
    const pt = parseFloat(proteinTarget);

    if (isRecognizingMenu || menuItems.length === 0 || isNaN(b) || b <= 0 || isNaN(pt) || pt <= 0) {
      return;
    }

    saveNutrixPayload({
      menu: menuItems,
      budget: b,
      proteinTarget: pt,
      dietaryPreference,
    });

    navigate({ to: "/dashboard" });
  };

  const isValid =
    !isRecognizingMenu &&
    menuItems.length > 0 &&
    parseFloat(budget) > 0 &&
    parseFloat(proteinTarget) > 0;

  return (
    <section className="relative pt-40 md:pt-48 pb-24 md:pb-32 px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="animate-rise text-gradient text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
          Fuel your goals, not just your hunger.
        </h1>

        <p className="animate-rise-delayed mt-6 md:mt-8 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          AI-powered platform to eat right and spend light.
          <br className="hidden sm:block" />
          From raw food menu to goals we pursue.
        </p>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="animate-rise-delayed-2 mt-12 md:mt-16 mx-auto max-w-3xl text-left"
        >
          {/* Add Food Item Row */}
          <div className="glass-card rounded-2xl px-4 py-3 mb-4">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              Add Food Items
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg text-primary shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    menuItems.length > 0 ? "Add another item..." : `${STATIC_PREFIX}${typed}`
                  }
                  className="flex-1 bg-transparent border-0 outline-none text-sm md:text-base text-foreground placeholder:text-muted-foreground/70 py-2"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleMenuImage}
                className="hidden"
                aria-label="Upload food menu image"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecognizingMenu}
                className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent/40 hover:text-foreground disabled:opacity-50 transition-all flex items-center justify-center shrink-0"
                aria-label="Upload menu image"
                title="Upload menu image"
              >
                {isRecognizingMenu ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-muted-foreground text-sm">₹</span>
                <input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Price"
                  min="1"
                  step="any"
                  className="w-20 bg-accent/40 border border-border rounded-lg px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={addItem}
                disabled={!itemName.trim() || !itemPrice || parseFloat(itemPrice) <= 0}
                className="h-9 w-9 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
                aria-label="Add food item"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {menuUploadMessage && (
              <p className="mt-2 ml-1 text-xs text-muted-foreground" role="status">
                {menuUploadMessage}
              </p>
            )}
          </div>

          {/* Food Items Tags */}
          {menuItems.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 px-1">
              {menuItems.map((item, i) => (
                <span
                  key={`${item.name}-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/50 border border-border text-sm text-foreground animate-rise"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">₹{item.price}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors flex items-center justify-center"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Budget & Protein Target Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="glass-card rounded-2xl px-4 py-3">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
                <Wallet className="h-3 w-3" />
                Budget (₹)
              </label>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 200"
                  min="1"
                  step="any"
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1"
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl px-4 py-3">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
                <Target className="h-3 w-3" />
                Protein Target (g)
              </label>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="number"
                  value={proteinTarget}
                  onChange={(e) => setProteinTarget(e.target.value)}
                  placeholder="e.g. 30"
                  min="1"
                  step="any"
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 py-1"
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl px-4 py-3">
              <label
                htmlFor="dietary-preference"
                className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1"
              >
                Food Preference
              </label>
              <select
                id="dietary-preference"
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value as DietaryPreference)}
                className="w-full bg-transparent border-0 outline-none text-sm text-foreground py-1"
              >
                <option value="VEG">VEG</option>
                <option value="NON-VEG">NON-VEG</option>
                <option value="ANY">ANY</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!isValid}
              className="btn-gradient hover:btn-gradient-hover inline-flex h-12 items-center gap-2 rounded-xl px-8 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all"
            >
              Generate
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {menuItems.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Tip: Add food items with their prices, then set your budget & protein target to find
              optimal combos.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
