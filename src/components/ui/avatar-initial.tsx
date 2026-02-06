import { cn } from "@/lib/utils";

interface AvatarInitialProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Generate a consistent color based on name
function getColorFromName(name: string): string {
  const colors = [
    "bg-primary",
    "bg-success",
    "bg-warning",
    "bg-destructive",
    "bg-accent",
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AvatarInitial({ name, size = "md", className }: AvatarInitialProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-primary-foreground font-medium",
        getColorFromName(name),
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
