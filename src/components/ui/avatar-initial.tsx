import { cn } from "@/lib/utils";

interface AvatarInitialProps {
  name: string;
  className?: string;
}

const gradients = [
  "bg-gradient-to-br from-blue-500 to-blue-700",
  "bg-gradient-to-br from-emerald-500 to-emerald-700",
  "bg-gradient-to-br from-amber-500 to-amber-700",
  "bg-gradient-to-br from-purple-500 to-purple-700",
  "bg-gradient-to-br from-pink-500 to-pink-700",
  "bg-gradient-to-br from-indigo-500 to-indigo-700",
];

function getInitials(name: string): string {
  const parts = name.split(" ");
  const initials = parts.map(part => part[0]).join("");
  return initials.slice(0, 2).toUpperCase();
}

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % gradients.length;
}

export function AvatarInitial({ name, className }: AvatarInitialProps) {
  const initials = getInitials(name);
  const gradientClass = gradients[getColorIndex(name)];

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm",
        gradientClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
