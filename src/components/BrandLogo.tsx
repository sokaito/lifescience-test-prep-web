"use client";

import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  subtitle?: string;
}

/**
 * Custom vector LifeSci Prep emblem (DNA double-helix + molecular leaf badge)
 * paired with animated gradient "LifeSci Prep" typography.
 */
export default function BrandLogo({
  size = "md",
  showText = true,
  subtitle,
}: BrandLogoProps) {
  const iconSizes = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-9 h-9 rounded-xl",
    lg: "w-16 h-16 rounded-2xl",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg md:text-xl",
    lg: "text-3xl sm:text-4xl",
  };

  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {/* Custom SVG Emblem */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 p-[1.5px] shadow-md shadow-teal-500/20 group-hover:scale-105 group-active:scale-95 transition-transform duration-300 shrink-0`}
      >
        <div className="w-full h-full rounded-[inherit] bg-slate-950/90 dark:bg-slate-950 flex items-center justify-center overflow-hidden relative">
          {/* Subtle ambient sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 via-transparent to-indigo-500/25 pointer-events-none" />
          <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={size === "lg" ? "w-10 h-10" : "w-5 h-5"}
          >
            <defs>
              <linearGradient
                id="lspStrandA"
                x1="6"
                y1="5"
                x2="30"
                y2="31"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <linearGradient
                id="lspStrandB"
                x1="30"
                y1="5"
                x2="6"
                y2="31"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>

            {/* DNA Helix Strands */}
            <path
              d="M11 6C11 12 25 13.5 25 18C25 22.5 11 24 11 30"
              stroke="url(#lspStrandA)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M25 6C25 12 11 13.5 11 18C11 22.5 25 24 25 30"
              stroke="url(#lspStrandB)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Base-pair rungs */}
            <path
              d="M13 10.5H23M14 18H22M13 25.5H23"
              stroke="#99f6e4"
              strokeOpacity="0.85"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Glowing molecular node */}
            <circle cx="25" cy="6" r="2.1" fill="#34d399" />
            <circle cx="11" cy="30" r="2.1" fill="#38bdf8" />
          </svg>
        </div>
      </div>

      {/* Animated Brand Text */}
      {showText && (
        <div className="flex flex-col leading-none min-w-0">
          <span
            className={`${textSizes[size]} font-extrabold tracking-tight animate-brand-text truncate`}
          >
            LifeSci Prep
          </span>
          {subtitle && (
            <span className="text-[10px] font-medium text-text-secondary mt-0.5 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
