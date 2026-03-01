import { useEffect, useRef } from 'react';

interface BrandLogoProps {
  className?: string;
  coinColor?: string;
}

export function CoinSvg({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
      style={{ width: '0.78em', height: '0.78em', verticalAlign: '-0.12em' }}
    >
      {/* Outer coin ring */}
      <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="6" />
      {/* Dollar sign */}
      <path
        d="M50 24v4m0 44v4M39 57c0 5 4.9 9 11 9s11-4 11-9-4.9-7.5-11-7.5S39 45 39 40s4.9-9 11-9 11 4 11 9"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BrandLogo({ className = '', coinColor }: BrandLogoProps) {
  const logoRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = logoRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      el.classList.add('coin-active');
      setTimeout(() => el.classList.remove('coin-active'), 2500);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span ref={logoRef} className={`${className} brand-logo`}>
      <span className="brand-text-left">EasyC</span>
      <span className="coin-swap">
        <span className="coin-letter">o</span>
        <span className="coin-icon"><CoinSvg color={coinColor} /></span>
      </span>
      <span className="brand-text-right">llect</span>
    </span>
  );
}
