import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Animation variant */
  variant?: "up" | "fade" | "left" | "right" | "zoom";
  /** Delay in ms before animating in */
  delay?: number;
  /** Custom className passthrough */
  className?: string;
  /** Animate every time it enters the viewport (default: only once) */
  repeat?: boolean;
  /** As HTML element (default: div) */
  as?: ElementType;
};

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
  repeat = false,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect reduced motion
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) {
        setVisible(true);
        return;
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (!repeat) observer.unobserve(entry.target);
          } else if (repeat) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [repeat]);

  const Component = Tag as any;
  return (
    <Component
      ref={ref}
      data-reveal={variant}
      data-visible={visible ? "true" : "false"}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${className}`}
    >
      {children}
    </Component>
  );
}
