import { cn } from "@/lib/utils";

interface AvatarInitialProps {
  name: string;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  const initials = parts.map(part => part[0]).join("");
  return initials.slice(0, 2).toUpperCase();
}

export function AvatarInitial({ name, className }: AvatarInitialProps) {
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm bg-slate-100 text-slate-600",
        className
      )}
    >
      {initials}
    </div>
  );
}
