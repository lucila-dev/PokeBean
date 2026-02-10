type Props = {
  className?: string;
  /** If not set, SVG uses width/height 100% to fill parent. */
  size?: number;
  "aria-hidden"?: boolean;
};

/** Inline SVG pokeball icon (no image file needed). */
export function PokeballIcon({
  className = "",
  size,
  "aria-hidden": ariaHidden = true,
}: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden={ariaHidden}
      {...(size != null ? { width: size, height: size } : { width: "100%", height: "100%" })}
    >
      <circle cx="16" cy="16" r="14" stroke="#1a1a2e" strokeWidth="2" fill="none" />
      {/* Top half: red semicircle */}
      <path
        d="M 2 16 A 14 14 0 0 1 30 16 L 16 16 Z"
        fill="#ef4444"
      />
      {/* Bottom half: white semicircle */}
      <path
        d="M 2 16 A 14 14 0 0 0 30 16 L 16 16 Z"
        fill="white"
      />
      {/* Horizontal black line through the middle */}
      <line x1="2" y1="16" x2="30" y2="16" stroke="#1a1a2e" strokeWidth="2" />
      {/* Thick black band/button: solid black circle centered on equator (touches red and white) */}
      <circle cx="16" cy="16" r="5" fill="#1a1a2e" />
      {/* Inner white circle with single thin black outline */}
      <circle cx="16" cy="16" r="3" fill="white" stroke="#1a1a2e" strokeWidth="1" />
    </svg>
  );
}
