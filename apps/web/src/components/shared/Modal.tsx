"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-300 hover:text-ink-700">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
