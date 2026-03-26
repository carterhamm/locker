"use client";

import React from "react";

interface ProgressiveBlurProps {
  className?: string;
  height?: string;
  position?: "top" | "bottom" | "both";
  blurLevels?: number[];
  children?: React.ReactNode;
}

function BlurLayer({
  position,
  height,
  blurLevels,
}: {
  position: "top" | "bottom";
  height: string;
  blurLevels: number[];
}) {
  const count = blurLevels.length;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [position === "top" ? "top" : "bottom"]: 0,
        height,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {blurLevels.map((blur, i) => {
        const start = (i / count) * 100;
        const end = ((i + 1) / count) * 100;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              [position === "top" ? "top" : "bottom"]: `${start}%`,
              height: `${end - start}%`,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage:
                position === "top"
                  ? `linear-gradient(to bottom, rgba(0,0,0,1) ${start}%, rgba(0,0,0,1) ${end}%, rgba(0,0,0,0) ${end}%)`
                  : `linear-gradient(to top, rgba(0,0,0,1) ${start}%, rgba(0,0,0,1) ${end}%, rgba(0,0,0,0) ${end}%)`,
              WebkitMaskImage:
                position === "top"
                  ? `linear-gradient(to bottom, rgba(0,0,0,1) ${start}%, rgba(0,0,0,1) ${end}%, rgba(0,0,0,0) ${end}%)`
                  : `linear-gradient(to top, rgba(0,0,0,1) ${start}%, rgba(0,0,0,1) ${end}%, rgba(0,0,0,0) ${end}%)`,
            }}
          />
        );
      })}
    </div>
  );
}

export function ProgressiveBlur({
  className = "",
  height = "30%",
  position = "bottom",
  blurLevels = [0.5, 1, 2, 4, 8, 16, 32, 64],
  children,
}: ProgressiveBlurProps) {
  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      {(position === "top" || position === "both") && (
        <BlurLayer position="top" height={height} blurLevels={blurLevels} />
      )}
      {(position === "bottom" || position === "both") && (
        <BlurLayer position="bottom" height={height} blurLevels={blurLevels} />
      )}
      {children}
    </div>
  );
}
