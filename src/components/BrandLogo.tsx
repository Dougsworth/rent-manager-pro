interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = '' }: BrandLogoProps) {
  return <span className={`display font-bold ${className}`}>EasyCollect</span>;
}
