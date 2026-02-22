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
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-xl z-50 transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <div className="flex items-center gap-2">
              {actions}
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </>
  );
}