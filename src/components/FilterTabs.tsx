import { cn } from "@/lib/utils";

interface Tab<T> {
  value: T;
  label: string;
  count?: number;
}

interface FilterTabsProps<T> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export function FilterTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: FilterTabsProps<T>) {
  return (
    <div className="inline-flex bg-secondary rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            activeTab === tab.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}