import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const WORDS = ['rent', 'loans', 'payments', 'invoices', 'anything'];
const INTERVAL_MS = 2800;
const FADE_MS = 150;

/**
 * Names what EasyCollect can collect, one word at a time. The word fades out,
 * changes while invisible, and fades back, so nothing slides or animates layout.
 * Holds on the first word under prefers-reduced-motion.
 */
export function RotatingWord({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let swap: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setVisible(false);
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => {
      clearInterval(id);
      clearTimeout(swap);
    };
  }, []);

  return (
    <>
      <span
        aria-hidden
        className={cn('transition-opacity duration-150 ease-out', visible ? 'opacity-100' : 'opacity-0', className)}
      >
        {WORDS[index]}
      </span>
      <span className="sr-only">rent</span>
    </>
  );
}
