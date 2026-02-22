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
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
            activeTab === tab.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-gray-400">
              ({tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
