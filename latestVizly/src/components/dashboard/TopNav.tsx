import { useState, useRef, useEffect } from "react";
import { Share2, Play, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type TopNavProps = {
  onExport?: () => void | Promise<void>;
};

export const TopNav = ({ onExport }: TopNavProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("Untitled Project");
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") setIsEditing(false);
  };

  const initials = (user?.name ?? "Alex Rivera")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex justify-between items-center w-full px-8 py-4 bg-background/40 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-4">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            className="text-xl font-bold tracking-tight text-foreground bg-accent/40 border border-primary/30 rounded px-2 outline-none focus:border-primary"
          />
        ) : (
          <h1
            onClick={() => setIsEditing(true)}
            className="text-xl font-bold tracking-tight text-foreground cursor-pointer hover:text-primary/80 transition-colors"
          >
            {title}
          </h1>
        )}
        <span className="px-2 py-0.5 rounded border border-border text-[10px] text-muted-foreground uppercase tracking-widest">
          Draft
        </span>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6 text-muted-foreground text-sm">
          <button
            type="button"
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <Share2 size={16} />
            Share
          </button>
          <button
            type="button"
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <Play size={16} fill="currentColor" />
            Run
          </button>
          <button
            type="button"
            onClick={() => onExport?.()}
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <Upload size={16} />
            Export
          </button>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-8 w-8 rounded-full border border-primary/30 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-8 w-8 rounded-full border border-primary/30 bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              {initials}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground leading-none">
              {user?.name ?? "Alex Rivera"}
            </span>
            <span className="text-[10px] text-primary">Community Account</span>
          </div>
        </div>
      </div>
    </header>
  );
};
