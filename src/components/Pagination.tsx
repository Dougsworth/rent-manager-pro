import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const step = 'inline-flex h-10 min-w-10 cursor-pointer items-center justify-center px-2 text-sm font-medium text-shell transition-colors duration-100 hover:bg-secondary disabled:pointer-events-none disabled:text-quiet disabled:opacity-60';

export function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((page) => totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
    .reduce<(number | 'gap')[]>((acc, page, idx, arr) => {
      if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('gap');
      acc.push(page);
      return acc;
    }, []);

  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-2">
      <p className="num text-[13.5px] text-quiet">{start} to {end} of {totalItems}</p>
      <div className="flex items-center">
        <button type="button" className={step} disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          Previous
        </button>
        <span className="hidden items-center sm:flex">
          {pages.map((item, idx) =>
            item === 'gap' ? (
              <span key={`gap-${idx}`} aria-hidden="true" className="px-1 text-sm text-quiet">...</span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={`Page ${item}`}
                onClick={() => onPageChange(item)}
                className={cn(step, 'num', item === currentPage && 'font-bold text-ink underline decoration-2 underline-offset-[6px]')}
              >
                {item}
              </button>
            )
          )}
        </span>
        <button type="button" className={step} disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
