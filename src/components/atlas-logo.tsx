/**
 * Atlas Discount brand mark — a bold "A" monogram (white legs + yellow
 * crossbar) in a navy squircle. The yellow crossbar ties to the
 * deal/promo theme and keeps it from feeling like a generic corporate icon.
 */
export function AtlasMark({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Atlas Discount"
    >
      <rect width="48" height="48" rx="13" fill="#10194A" />
      <path d="M24 10.5 L12.5 37.5" stroke="#FFFFFF" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 10.5 L35.5 37.5" stroke="#FFFFFF" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.2 29 L30.8 29" stroke="#FCD34D" strokeWidth="5.4" strokeLinecap="round" />
    </svg>
  );
}

/** Full lockup: mark + two-tone wordmark. */
export function AtlasLogo({ markSize = 48, className = "" }: { markSize?: number; className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <AtlasMark size={markSize} />
      <span className="text-2xl font-black leading-none tracking-tight text-atlas-navy">
        Atlas <span className="text-atlas-blue">Discount</span>
      </span>
    </span>
  );
}
