import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const WORDS = ['rent', 'loans', 'payments', 'invoices', 'anything'];
const INTERVAL_MS = 2400;

/**
 * A single word that dissolves ("vanishes") and cycles through what EasyCollect
 * can collect. The container width animates to each word so the surrounding
 * text glides smoothly instead of jumping. Respects prefers-reduced-motion.
 */
export function RotatingWord({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const measureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // hold on the first word
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Animate the container width to fit the current word.
  useLayoutEffect(() => {
    if (measureRef.current) setWidth(measureRef.current.getBoundingClientRect().width);
  }, [index]);

  return (
    <span
      className="relative inline-flex justify-center align-baseline transition-[width] duration-500 ease-out"
      style={{ width }}
    >
      {/* Invisible sizer — the active word drives width + line height */}
      <span ref={measureRef} aria-hidden className={cn('invisible whitespace-nowrap', className)}>
        {WORDS[index]}
      </span>

      {/* Stacked words; only the active one is crisp, the rest are dissolved away */}
      {WORDS.map((word, i) => (
        <span
          key={word}
          aria-hidden={i !== index}
          className={cn(
            'absolute left-0 top-0 w-full whitespace-nowrap text-center transition-all duration-500 ease-out',
            i === index
              ? 'opacity-100 blur-0 translate-y-0'
              : 'opacity-0 blur-[6px] -translate-y-2.5 pointer-events-none',
            className
          )}
        >
          {word}
        </span>
      ))}

      {/* Stable label for screen readers / SEO */}
      <span className="sr-only">rent and more</span>
    </span>
  );
}
