interface BrandLogoProps {
  className?: string;
}

/** The coin that stands in for the "o". Drawn in the text colour, so it works on green and on light grounds. */
export function CoinMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={`brand-coin ${className}`}>
      <circle cx="50" cy="50" r="43" stroke="currentColor" strokeWidth="8" />
      <path
        d="M50 23v6m0 42v6M38.5 58c0 5.4 5.1 9.5 11.5 9.5s11.5-4.1 11.5-9.5S56.4 50 50 50s-11.5-3.9-11.5-9 5.1-9.5 11.5-9.5 11.5 4.1 11.5 9.5"
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * EasyCollect with the coin as its "o". The coin turns once when the page loads
 * and again on hover. It never loops.
 */
export default function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <span className={`brand-logo display font-bold ${className}`} aria-label="EasyCollect" role="img">
      <span aria-hidden="true">EasyC</span>
      <CoinMark />
      <span aria-hidden="true">llect</span>
    </span>
  );
}
