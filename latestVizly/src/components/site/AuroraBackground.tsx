export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* base radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, color-mix(in oklab, var(--accent-violet) 12%, transparent) 0%, transparent 60%)",
        }}
      />
      {/* drifting blobs */}
      <div
        className="aurora-blob animate-aurora-1"
        style={{
          top: "-10%",
          left: "-10%",
          width: "55vw",
          height: "55vw",
          background:
            "radial-gradient(circle, oklch(0.55 0.22 265) 0%, transparent 60%)",
        }}
      />
      <div
        className="aurora-blob animate-aurora-2"
        style={{
          top: "20%",
          right: "-15%",
          width: "60vw",
          height: "60vw",
          background:
            "radial-gradient(circle, oklch(0.55 0.22 295) 0%, transparent 60%)",
          opacity: 0.45,
        }}
      />
      <div
        className="aurora-blob animate-aurora-3"
        style={{
          bottom: "-20%",
          left: "20%",
          width: "70vw",
          height: "70vw",
          background:
            "radial-gradient(circle, oklch(0.5 0.2 245) 0%, transparent 60%)",
          opacity: 0.4,
        }}
      />
      {/* subtle bottom dim only — keep top clear so 3D scene shows */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, color-mix(in oklab, var(--background) 70%, transparent) 100%)",
        }}
      />
    </div>
  );
}
