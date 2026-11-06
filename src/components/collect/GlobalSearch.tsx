import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSearchIndex, type SearchEntry } from '@/services/search';
import { cn } from '@/lib/utils';

/** Finds tenants, borrowers and properties from anywhere. Press / to focus. */
export function GlobalSearch({ className }: { className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && !el.isContentEditable) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const load = () => {
    if (index || !user) return;
    getSearchIndex(user.id).then(setIndex).catch(() => setIndex([]));
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !index) return [];
    return index.filter((e) => `${e.title} ${e.detail}`.toLowerCase().includes(q)).slice(0, 8);
  }, [query, index]);

  const go = (entry: SearchEntry) => {
    setQuery('');
    setOpen(false);
    input.current?.blur();
    navigate(entry.href);
  };

  const showList = open && query.trim().length > 0;

  return (
    <div className={cn('relative', className)}>
      <label htmlFor="global-search" className="sr-only">Search tenants, borrowers and properties</label>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet" />
      <input
        id="global-search"
        ref={input}
        role="combobox"
        aria-expanded={showList}
        aria-controls="global-search-list"
        autoComplete="off"
        value={query}
        placeholder="Search tenants, borrowers, properties"
        onFocus={() => { load(); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active]); }
          if (e.key === 'Escape') { setQuery(''); input.current?.blur(); }
        }}
        className="h-10 w-full rounded-[3px] border border-input bg-transparent pl-9 pr-3 text-sm text-ink placeholder:text-quiet hover:border-quiet focus:border-paid focus:outline-2 focus:outline-offset-0 focus:outline-paid"
      />
      {showList && (
        <ul id="global-search-list" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 border border-rule bg-popover shadow-lg">
          {results.length === 0 && <li className="px-3 py-3 text-sm text-quiet">{index ? `Nothing found for "${query.trim()}"` : 'Searching'}</li>}
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.id}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={cn('grid min-h-11 w-full cursor-pointer grid-cols-[1fr_auto] gap-x-3 px-3 py-2 text-left', i === active && 'bg-secondary')}
              >
                <span className="truncate text-sm font-medium">{r.title}</span>
                <span className="text-[13.5px] text-quiet">{r.kind}</span>
                {r.detail && <span className="col-span-2 truncate text-[13.5px] text-quiet">{r.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
