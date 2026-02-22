import { cn } from "@/lib/utils";

interface AvatarInitialProps {
  name: string;
  className?: string;
}

const colors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
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
  return Math.abs(hash) % colors.length;
}

export function AvatarInitial({ name, className }: AvatarInitialProps) {
  const initials = getInitials(name);
  const colorClass = colors[getColorIndex(name)];

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}