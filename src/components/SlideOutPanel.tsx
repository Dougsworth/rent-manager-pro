import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideOutPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function SlideOutPanel({
  open,
  onClose,
  title,
  actions,
  children,
}: SlideOutPanelProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-full sm:max-w-lg bg-white border-l border-slate-200 z-50 transition-transform duration-300 ease-out",
        "shadow-[-8px_0_30px_-10px_rgba(0,0,0,0.12)]",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-4 bg-white">
          <h2 className="text-lg font-semibold text-slate-900 truncate">{title}</h2>
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
