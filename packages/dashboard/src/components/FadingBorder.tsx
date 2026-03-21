"use client";

/**
 * Overlay that renders a 1px border with diagonal opacity gradient:
 * 100% opacity at top-left and bottom-right corners,
 * ~20% opacity at top-right and bottom-left corners.
 *
 * Usage: place as absolute child inside a position:relative container.
 * Pass `color` for the border color (default white at 0.08).
 */
export function FadingBorder({
  radius = "18px",
  color = "rgba(255,255,255,0.08)",
  colorFaded = "rgba(255,255,255,0.016)",
}: {
  radius?: string;
  color?: string;
  colorFaded?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        padding: "1px",
        background: `linear-gradient(135deg, ${color} 0%, ${colorFaded} 35%, ${colorFaded} 65%, ${color} 100%)`,
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  );
}
