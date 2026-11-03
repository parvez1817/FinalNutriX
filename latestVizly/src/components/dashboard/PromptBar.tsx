import { useState, useRef, useEffect } from "react";
import { ArrowUp, LoaderCircle, Plus, X } from "lucide-react";
import { recognizeFoodMenuApi } from "@/lib/api";
import type { FoodItem } from "@/lib/nutrix";

type PromptBarProps = {
  onSend?: (message: string, menuItems: FoodItem[]) => void;
  menuItems: FoodItem[];
  onMenuItemsChange: (items: FoodItem[]) => void;
};

function formatMenuDraft(items: FoodItem[], question = "") {
  const menuText = ["Menu items:", ...items.map((item) => `- ${item.name} (₹${item.price})`)].join(
    "\n",
  );
  return `${menuText}\n\n${question}`;
}

function parseMenuDraft(draft: string): FoodItem[] | null {
  const menuSection = draft.match(
    /(?:^|\n)Menu items:[ \t]*\r?\n([\s\S]*?)(?:\r?\n[ \t]*\r?\n|$)/i,
  )?.[1];
  if (menuSection === undefined) return null;

  return menuSection.split("\n").flatMap((line) => {
    const match = line.match(/^\s*[-•]?\s*(.+?)\s*\(₹?\s*(\d+(?:\.\d+)?)\)\s*$/);
    if (!match) return [];
    return [{ name: match[1].trim(), price: Number(match[2]) }];
  });
}

export const PromptBar = ({ onSend, menuItems, onMenuItemsChange }: PromptBarProps) => {
  const [value, setValue] = useState("");
  const [isRecognizingMenu, setIsRecognizingMenu] = useState(false);
  const [menuUploadMessage, setMenuUploadMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const editedMenuItems = parseMenuDraft(trimmed);
    onSend?.(trimmed, editedMenuItems ?? menuItems);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
      const combinedItems = [...menuItems, ...items];
      const existingQuestion = value.includes("\n\n")
        ? value.slice(value.indexOf("\n\n") + 2).trim()
        : value.trim();
      onMenuItemsChange(combinedItems);
      setValue(formatMenuDraft(combinedItems, existingQuestion));
      setMenuUploadMessage(
        `Added ${items.length} menu item${items.length === 1 ? "" : "s"}. Edit the menu text or add a question.`,
      );
    } catch (error) {
      setMenuUploadMessage(
        error instanceof Error ? error.message : "Could not read the menu image. Please try again.",
      );
    } finally {
      setIsRecognizingMenu(false);
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 w-full flex justify-center">
      <div className="w-full max-w-3xl">
        {menuItems.length > 0 && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-accent/20 px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate" title={menuItems.map((item) => item.name).join(", ")}>
              Menu attached: {menuItems.length} item{menuItems.length === 1 ? "" : "s"} —{" "}
              {menuItems.map((item) => item.name).join(", ")}
            </span>
            <button
              type="button"
              onClick={() => {
                onMenuItemsChange([]);
                setValue((current) => {
                  const question = current.includes("\n\n")
                    ? current.slice(current.indexOf("\n\n") + 2).trim()
                    : current;
                  return question;
                });
              }}
              className="shrink-0 rounded p-1 hover:bg-accent/50 hover:text-foreground"
              aria-label="Remove attached menu"
              title="Remove attached menu"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="rounded-2xl bg-accent/40 border border-border p-2 flex items-end gap-2 shadow-lg shadow-black/20">
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
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all shrink-0 mb-0.5"
            aria-label="Upload food menu image"
            title="Upload food menu image"
          >
            {isRecognizingMenu ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : (
              <Plus size={20} />
            )}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            rows={1}
            className="flex-1 bg-transparent border-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-2 px-1 outline-none max-h-[200px] leading-relaxed"
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim() || isRecognizingMenu}
            className="p-2 rounded-lg bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all shrink-0 mb-0.5"
            aria-label="Send message"
          >
            <ArrowUp size={18} />
          </button>
        </div>

        {menuUploadMessage && (
          <p className="mt-2 text-center text-xs text-muted-foreground" role="status">
            {menuUploadMessage}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-60">
          nutriX Restro may produce inaccurate information. Verify important results.
        </p>
      </div>
    </div>
  );
};
