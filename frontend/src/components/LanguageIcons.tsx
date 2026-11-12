// frontend/src/components/LanguageIcons.tsx
import type { ComponentType, ReactNode } from "react";
import { CLangIcon } from "./SidebarIcons";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {children}
    </svg>
  );
}

function CppIcon() {
  return (
    <Svg>
      <polygon points="24,3 42.2,13.5 42.2,34.5 24,45 5.8,34.5 5.8,13.5" fill="#00599c" />
      <polygon points="24,3 5.8,13.5 5.8,34.5 24,45" fill="#659ad2" />
      <path d="M22 19.5A7.5 7.5 0 1 0 22 28.5" fill="none" stroke="#fff" strokeWidth="4.5" />
      <path d="M27 24h6M30 21v6M35 24h6M38 21v6" stroke="#fff" strokeWidth="2.2" />
    </Svg>
  );
}

function PythonIcon() {
  return (
    <Svg>
      <path
        d="M23 4c-6 0-8 2-8 6v4h9v2H9c-4 0-6 3-6 8s2 8 6 8h4v-6c0-4 3-6 6-6h8c3 0 5-2 5-5v-7c0-4-4-4-8-4z"
        fill="#3776ab"
      />
      <path
        d="M25 44c6 0 8-2 8-6v-4h-9v-2h15c4 0 6-3 6-8s-2-8-6-8h-4v6c0 4-3 6-6 6h-8c-3 0-5 2-5 5v7c0 4 4 4 8 4z"
        fill="#ffd43b"
      />
      <circle cx="18.5" cy="10" r="1.7" fill="#fff" />
      <circle cx="29.5" cy="38" r="1.7" fill="#fff" />
    </Svg>
  );
}

function HtmlIcon() {
  return (
    <Svg>
      <path d="M6 4h36l-3.3 36L24 45 9.3 40z" fill="#e44d26" />
      <path d="M24 41.5l11.9-3.3L39 7H24z" fill="#f16529" />
      <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fff" fontFamily="Nunito, Arial, sans-serif">
        5
      </text>
    </Svg>
  );
}

function CssIcon() {
  return (
    <Svg>
      <path d="M6 4h36l-3.3 36L24 45 9.3 40z" fill="#1572b6" />
      <path d="M24 41.5l11.9-3.3L39 7H24z" fill="#33a9dc" />
      <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fff" fontFamily="Nunito, Arial, sans-serif">
        3
      </text>
    </Svg>
  );
}

function JavaIcon() {
  return (
    <Svg>
      <path d="M8 27h26v5a9 9 0 0 1-9 9h-8a9 9 0 0 1-9-9z" fill="#5382a1" />
      <path d="M34 29h3a4.5 4.5 0 0 1 0 9h-4" fill="none" stroke="#5382a1" strokeWidth="3" />
      <path d="M17 22c5-4-4-6 0-12M25 22c5-4-4-6 0-12" fill="none" stroke="#e76f00" strokeWidth="3" strokeLinecap="round" />
      <rect x="9" y="42" width="24" height="3" rx="1.5" fill="#e76f00" />
    </Svg>
  );
}

export type Language = {
  id: string;
  name: string;
  Icon: ComponentType;
};

// Daftar bahasa yang tampil di "Tambahkan kursus baru".
// Kalau punya logo PNG sendiri: simpan di src/assets, lalu ganti Icon menjadi
// () => <img src={cPng} alt="" />
export const languages: Language[] = [
  { id: "c", name: "Bahasa C", Icon: CLangIcon },
  { id: "cpp", name: "Bahasa C++", Icon: CppIcon },
  { id: "python", name: "Bahasa Python", Icon: PythonIcon },
  { id: "html", name: "HTML", Icon: HtmlIcon },
  { id: "css", name: "CSS", Icon: CssIcon },
  { id: "java", name: "Bahasa Java", Icon: JavaIcon },
];