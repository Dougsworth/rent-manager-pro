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

export function FilterTabs<T extends string>({ tabs, activeTab, onTabChange }: FilterTabsProps<T>) {
  return (
    <div className="flex max-w-full gap-5 overflow-x-auto border-b border-rule">
      {tabs.map((tab) => {
        const on = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            aria-pressed={on}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "-mb-px min-h-11 cursor-pointer whitespace-nowrap border-b-2 text-sm transition-colors duration-100",
              on ? "border-ink font-semibold text-ink" : "border-transparent text-quiet hover:text-ink"
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className="num ml-1.5 font-normal text-quiet">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
