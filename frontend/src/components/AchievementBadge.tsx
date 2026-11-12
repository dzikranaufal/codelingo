// frontend/src/components/AchievementBadge.tsx
import type { ReactNode } from "react";
import "./AchievementBadge.css";

export type AchievementIcon = "flame" | "wizard" | "feather" | "bow" | "trophy" | "friends" | "helmet" | "photo";
export type BadgeColor = "red" | "green" | "purple" | "gold";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {children}
    </svg>
  );
}

function Art({ icon }: { icon: AchievementIcon }) {
  switch (icon) {
    case "flame":
      return (
        <Svg>
          <path d="M24 4c2 9 14 14 14 26a14 14 0 0 1-28 0c0-5 2.5-8 5-11 1 4 4 6 6 5-1-8-1-14 3-20z" fill="#ff9600" />
          <path d="M24 26c5 4 8 7 8 11a8 8 0 0 1-16 0c0-4 3-7 8-11z" fill="#ffc800" />
        </Svg>
      );
    case "wizard":
      return (
        <Svg>
          <circle cx="24" cy="32" r="9" fill="#f6c9a5" />
          <path d="M13 32c0 10 6 13 11 13s11-3 11-13c-4 3-8 3-11 3s-7 0-11-3z" fill="#fff" />
          <path d="M10 24L24 4l14 20z" fill="#1cb0f6" />
          <rect x="8" y="22" width="32" height="5" rx="2.5" fill="#1899d6" />
          <circle cx="24" cy="15" r="3.5" fill="#ffc800" />
        </Svg>
      );
    case "feather":
      return (
        <Svg>
          <path d="M10 6h28v18c0 10-8 15-14 18-6-3-14-8-14-18z" fill="#ffc800" />
          <path d="M31 14c-9 1-15 8-16 17 3-1 5-3 6-5 3 0 9-2 10-12z" fill="#ff9600" />
        </Svg>
      );
    case "bow":
      return (
        <Svg>
          <path d="M14 7C3 18 3 30 14 41" fill="none" stroke="#a8620f" strokeWidth="4" strokeLinecap="round" />
          <line x1="14" y1="7" x2="14" y2="41" stroke="#fff" strokeWidth="1.5" />
          <line x1="8" y1="24" x2="40" y2="24" stroke="#c98a4b" strokeWidth="3" strokeLinecap="round" />
          <polygon points="45,24 36,19 36,29" fill="#fff" />
          <path d="M8 24l-4-4M8 24l-4 4" stroke="#ff4b4b" strokeWidth="3" strokeLinecap="round" />
        </Svg>
      );
    case "trophy":
      return (
        <Svg>
          <path d="M14 6h20v14a10 10 0 0 1-20 0z" fill="#ffc800" />
          <path d="M14 10H7v4a7 7 0 0 0 7 7M34 10h7v4a7 7 0 0 1-7 7" fill="none" stroke="#ffc800" strokeWidth="3.5" />
          <rect x="21" y="28" width="6" height="8" fill="#ffc800" />
          <rect x="14" y="36" width="20" height="5" rx="2" fill="#ffc800" />
          <text x="24" y="21" textAnchor="middle" fontSize="15" fontWeight="900" fill="#ff9600" fontFamily="Nunito, Arial, sans-serif">
            1
          </text>
        </Svg>
      );
    case "friends":
      return (
        <Svg>
          <circle cx="17" cy="20" r="9" fill="#f6c9a5" />
          <path d="M8 19c0-9 6-12 10-10 4-1 8 2 8 10-4-4-12-5-18 0z" fill="#ffc800" />
          <circle cx="31" cy="29" r="10" fill="#8d5524" />
          <path d="M21 28c0-9 7-12 11-9s9 6 9 9c-6-4-14-4-20 0z" fill="#3b2a20" />
          <path d="M26 33q5 5 10 0z" fill="#fff" />
        </Svg>
      );
    case "helmet":
      return (
        <Svg>
          <path d="M8 28c0-12 7-20 16-20s16 8 16 20v6H8z" fill="#e0a900" />
          <rect x="14" y="26" width="20" height="9" rx="2" fill="#a67c00" />
          <rect x="22" y="26" width="4" height="12" fill="#e0a900" />
          <path d="M24 3c4 0 6 3 6 6H18c0-3 2-6 6-6z" fill="#ff9600" />
        </Svg>
      );
    case "photo":
      return (
        <Svg>
          <rect x="8" y="8" width="32" height="32" rx="4" fill="#ffe680" stroke="#e0a900" strokeWidth="3" />
          <circle cx="24" cy="21" r="5" fill="#e0a900" />
          <path d="M13 37c1-8 6-10 11-10s10 2 11 10z" fill="#e0a900" />
        </Svg>
      );
  }
}

type BadgeProps = {
  icon: AchievementIcon;
  color: BadgeColor;
  level: number;
  size?: "sm" | "md" | "lg";
};

export default function AchievementBadge({ icon, color, level, size = "md" }: BadgeProps) {
  return (
    <span className={`badge badge--${color} badge--${size}`}>
      <span className="badge__art">
        <Art icon={icon} />
      </span>
      <span className="badge__level">Level {level}</span>
    </span>
  );
}