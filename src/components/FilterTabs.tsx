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
    <div className="inline-flex glass rounded-xl p-1 gap-0.5 border border-white/60">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === tab.value
              ? "bg-white/90 text-slate-900 shadow-sm border border-slate-200/60"
              : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "ml-1.5 text-xs",
              activeTab === tab.value ? "text-slate-500" : "text-slate-400"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
