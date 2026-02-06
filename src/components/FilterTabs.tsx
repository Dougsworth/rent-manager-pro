import { cn } from "@/lib/utils";

interface FilterTabsProps<T extends string> {
  tabs: { value: T; label: string; count?: number }[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export function FilterTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: FilterTabsProps<T>) {
  return (
    <div className="flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors relative",
            activeTab === tab.value
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs">({tab.count})</span>
          )}
          {activeTab === tab.value && (
            <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
