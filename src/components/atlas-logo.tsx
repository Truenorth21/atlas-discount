export function AtlasMark({
  size = 48,
  className = "",
  tone = "navy"
}: {
  size?: number;
  className?: string;
  tone?: "navy" | "light" | "white";
}) {
  const dark = tone === "light" || tone === "white" ? "#FFFFFF" : "#111827";
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Atlas Discount">
      <path d="M5 44 22.5 7h8L47 44h-9.5l-3.2-7.5H18.1L14.8 44H5Z" fill="#D62828" />
      <path d="M21.2 29.2 26.3 17l5.1 12.2H21.2Z" fill={dark} />
      <path d="M10 44h37" stroke={dark} strokeWidth="4" />
      <path d="M38 9h9v9" stroke="#F5C518" strokeWidth="4" />
    </svg>
  );
}

export function AtlasLogo({ markSize = 48, className = "" }: { markSize?: number; className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <AtlasMark size={markSize} />
      <span className="leading-none">
        <span className="block text-2xl font-black uppercase text-atlas-navy">Atlas</span>
        <span className="mt-0.5 block text-xs font-black uppercase text-atlas-blue">Discount Wholesale</span>
      </span>
    </span>
  );
}
