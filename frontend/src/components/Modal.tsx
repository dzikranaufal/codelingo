// frontend/src/components/Modal.tsx
import { useEffect, type ReactNode } from "react";
import "./Modal.css";

type ModalProps = {
  title?: string; // kalau diisi: tampil header dengan judul (untuk daftar bahasa)
  onClose: () => void;
  children: ReactNode;
};

// Pop-up di tengah layar. Tutup lewat tombol X, klik area gelap, atau tombol Esc.
export default function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal__box"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Detail"}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <header className="modal__head">
            <button type="button" className="modal__x" aria-label="Tutup" onClick={onClose}>
              ✕
            </button>
            <h2>{title}</h2>
          </header>
        ) : (
          <button type="button" className="modal__close" aria-label="Tutup" onClick={onClose}>
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
}