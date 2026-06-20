export function SiteBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1f1f1f 1px, transparent 1px), linear-gradient(to bottom, #1f1f1f 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-[#c8f135]/10 blur-[120px]" />
      <div className="absolute right-0 top-1/4 h-[480px] w-[480px] rounded-full bg-[#ff8a3d]/12 blur-[130px]" />
      <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#f5c842]/10 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#141414_0%,transparent_55%)]" />
    </div>
  );
}