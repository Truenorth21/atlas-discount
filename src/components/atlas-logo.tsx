export function AtlasMark({
  size = 48,
  className = "",
  tone = "navy"
}: {
  size?: number;
  className?: string;
  tone?: "navy" | "light" | "white";
}) {
  return (
    <span
      className={`atlas-wordmark inline-flex shrink-0 items-center overflow-hidden ${tone === "light" || tone === "white" ? "bg-white" : ""} ${className}`}
      style={{ width: size * 3.25, height: size }}
      role="img"
      aria-label="Atlas Discount Wholesale Supply"
    >
      <img src="/atlas-discount-logo.svg" alt="" className="h-full w-full object-contain" />
    </span>
  );
}

export function AtlasLogo({ markSize = 48, className = "" }: { markSize?: number; className?: string }) {
  return <AtlasMark size={markSize} className={className} />;
}
