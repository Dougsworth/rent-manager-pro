import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  message?: string;
}

export function Loading({ className, message = "Loading..." }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-2 border-blue-100" />
        <div className="absolute left-0 top-0 h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
      <p className="mt-4 text-sm text-blue-600 font-medium">{message}</p>
    </div>
  );
}