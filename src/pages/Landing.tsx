import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import BrandLogo from '@/components/BrandLogo';
import {
  Building2,
  FileText,
  Upload,
  CheckCircle,
  BarChart3,
  Shield,
  ArrowRight,
  Bell,
  Link as LinkIcon,
  LogIn,
  Check,
  Plus,
  Minus,
  Receipt,
} from 'lucide-react';

/* ── Keyframe animations for hero background ── */
const heroAnimStyles = `
@keyframes float-slow {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}
@keyframes float-medium {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes float-fast {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes drift-right {
  0%, 100% { transform: translateX(0px) rotate(0deg); }
  50% { transform: translateX(6px) rotate(3deg); }
}
@keyframes drift-left {
  0%, 100% { transform: translateX(0px) rotate(0deg); }
  50% { transform: translateX(-6px) rotate(-3deg); }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 0.07; }
  50% { opacity: 0.12; }
}
@keyframes slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes draw-path {
  to { stroke-dashoffset: 0; }
}
.step-card {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.step-card.visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
}
.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
@keyframes radar-ping {
  0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}
@keyframes particle-float {
  0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
  25% { transform: translateY(-20px) translateX(10px); opacity: 0.7; }
  50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
  75% { transform: translateY(-25px) translateX(8px); opacity: 0.6; }
}
@keyframes border-rotate {
  0% { --angle: 0deg; }
  100% { --angle: 360deg; }
}
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.dashboard-card {
  position: relative;
}
.dashboard-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 1.5rem;
  padding: 2px;
  background: conic-gradient(from var(--angle), transparent 40%, rgba(59,130,246,0.5) 50%, transparent 60%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: border-rotate 4s linear infinite;
  pointer-events: none;
}
`;

/* ── Reveal on scroll ── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Animated counter ── */
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const duration = 1600;
          const startTime = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            start = Math.round(eased * value);
            el.textContent = `${start}${suffix}`;
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ── Section Divider (HandyPay-style + markers on edges) ── */
function SectionDivider() {
  return (
    <div className="relative h-px w-full">
      <div className="absolute inset-0 bg-neutral-200" />
    </div>
  );
}

/* ── How It Works — SVG path draw section ── */
function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    // Scroll-driven path draw
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section || !path) return;
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;
      const scrolled = Math.max(0, Math.min(1, (windowHeight - sectionTop) / (sectionHeight + windowHeight * 0.5)));
      path.style.strokeDashoffset = `${length * (1 - scrolled)}`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // IntersectionObserver for card reveals
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );
    cardsRef.current.forEach((card) => card && observer.observe(card));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const steps = [
    {
      icon: FileText,
      step: '01',
      title: 'Create & send invoice',
      desc: 'Generate an invoice with one click. Each tenant gets auto-numbered invoices. Share the payment link via WhatsApp, email, or text.',
    },
    {
      icon: Upload,
      step: '02',
      title: 'Tenant pays & uploads proof',
      desc: 'Tenant opens the link on any device — no app, no signup. They see your bank details, pay, and upload a screenshot as proof.',
    },
    {
      icon: CheckCircle,
      step: '03',
      title: 'Approve & track',
      desc: 'Review the proof, approve with one click. Watch your collection rate climb on the dashboard. Every payment documented.',
    },
  ];

  return (
    <section id="how-it-works" ref={sectionRef} className="relative py-16 md:py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-semibold text-neutral-900 mb-4 md:mb-6">
            Get Paid in 3 Simple Steps
          </h2>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-8">
            Create an invoice, share the link, and approve the proof. Start collecting rent in minutes, not days.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 text-sm w-48">
              Get started
            </Link>
            <a href="#pricing" className="inline-flex items-center justify-center px-6 py-3 bg-white text-neutral-900 border border-neutral-300 rounded-full font-medium text-sm hover:bg-neutral-50 transition-colors w-48">
              View plans
            </a>
          </div>
        </div>

        {/* Path + steps */}
        <div className="relative">
          {/* SVG S-curve path — desktop only */}
          <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full hidden md:block pointer-events-none" viewBox="0 0 800 900" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <path
              ref={pathRef}
              d="M400 0 C400 80, 650 100, 650 180 C650 260, 150 280, 150 360 C150 440, 650 460, 650 540 C650 620, 150 640, 150 720 C150 800, 400 820, 400 900"
              stroke="rgb(37,99,246)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.15"
            />
            {/* Glow version */}
            <path
              d="M400 0 C400 80, 650 100, 650 180 C650 260, 150 280, 150 360 C150 440, 650 460, 650 540 C650 620, 150 640, 150 720 C150 800, 400 820, 400 900"
              stroke="rgb(37,99,246)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              opacity="0.04"
              filter="url(#glow)"
            />
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          {/* Vertical line — mobile */}
          <div className="absolute top-0 bottom-0 left-6 w-px bg-blue-600/10 md:hidden" />

          {/* Step cards */}
          <div className="space-y-10 md:space-y-24 relative z-10">
            {steps.map((item, i) => (
              <div
                key={item.step}
                ref={(el) => { cardsRef.current[i] = el; }}
                className={`step-card flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-10 pl-10 md:pl-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Number node */}
                <div className={`flex-shrink-0 flex items-center gap-4 ${i % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto'} md:w-[60px] md:justify-center`}>
                  <div className="relative">
                    <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white border-2 border-neutral-900 shadow-[3px_3px_0px_0px_rgba(37,99,235,1)] flex items-center justify-center">
                      <span className="text-sm md:text-lg font-bold text-neutral-900">{item.step}</span>
                    </div>
                  </div>
                </div>

                {/* Card */}
                <div className={`flex-1 max-w-md ${i % 2 === 0 ? 'md:text-right md:ml-auto md:mr-16' : 'md:text-left md:mr-auto md:ml-16'}`}>
                  <div className="bg-white rounded-xl md:rounded-2xl border border-neutral-200 p-4 md:p-6 hover:border-neutral-300 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300">
                    <div className={`flex items-center gap-3 mb-3 md:mb-4 ${i % 2 === 0 ? 'md:justify-end' : ''}`}>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-600 flex items-center justify-center">
                        <item.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-neutral-900 mb-1.5 md:mb-2">{item.title}</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ Item ── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
      >
        <span className="text-base sm:text-lg md:text-xl font-medium text-neutral-900 pr-4">{question}</span>
        <span className="flex-shrink-0">
          {open ? (
            <Minus className="w-5 h-5 text-blue-600" />
          ) : (
            <Plus className="w-5 h-5 text-blue-600" />
          )}
        </span>
      </button>
      {open && (
        <div className="pb-6 pr-4 sm:pr-12">
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-black antialiased">
      <SEO
        title="Rent Collection Made Easy for Jamaican Landlords"
        description="Jamaica's #1 rent collection platform. Send invoices, track payments, automate reminders, and manage tenants and properties — all in one place. Start free today."
        keywords="rent collection Jamaica, collect rent online, Jamaican landlord software, rent management, tenant management, invoice tenants, rent payment app, property management Jamaica, EasyCollect, easy rent collect, easycollectja, landlord app Jamaica, rental property management, rent tracker, online rent payment Jamaica"
        path="/"
      />
      {/* ═══ HEADER ═══ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200/50 shadow-sm">
        <div className="transition-all duration-500 max-w-7xl mx-auto py-3 sm:py-5 px-4 sm:px-6">
          <div className="relative flex items-center justify-between">
            <Link to="/" className="flex items-center flex-shrink-0 relative z-10">
              <BrandLogo className="text-xl font-extrabold tracking-tight text-neutral-900" />
            </Link>

            <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 px-1.5 py-1.5">
                <a href="#features" className="px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 text-neutral-700 hover:text-neutral-900 hover:bg-white/60">Features</a>
                <a href="#how-it-works" className="px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 text-neutral-700 hover:text-neutral-900 hover:bg-white/60">How It Works</a>
                <a href="#pricing" className="px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 text-neutral-700 hover:text-neutral-900 hover:bg-white/60">Plans</a>
                <a href="#testimonials" className="px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-300 text-neutral-700 hover:text-neutral-900 hover:bg-white/60">Testimonials</a>
              </div>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-full transition-colors hover:bg-neutral-100"
              >
                <LogIn className="w-4 h-4" />
                <span>Log in</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center whitespace-nowrap font-medium h-9 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-4 py-2 text-[13px] cursor-pointer transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN — bordered content area ═══ */}
      <main className="flex flex-col md:border-x border-neutral-200 max-w-7xl mx-auto relative">

        {/* ═══ HERO ═══ */}
        <section className="relative pt-28 md:pt-32 pb-16 w-full overflow-hidden bg-white">
          {/* ── Animated decorative background ── */}
          <style dangerouslySetInnerHTML={{ __html: heroAnimStyles }} />

          {/* Left skyline — apartment complexes (hidden on small mobile) */}
          <svg className="absolute bottom-0 left-0 hidden sm:block sm:w-[600px] md:w-[850px] lg:w-[1000px] h-auto text-neutral-100 pointer-events-none select-none" viewBox="0 0 1000 800" fill="none" aria-hidden="true" style={{ animation: 'slide-up 1.2s ease-out both' }}>
            {/* Tower A — tall with antenna + balconies */}
            <rect x="0" y="60" width="120" height="740" rx="4" fill="currentColor" />
            <rect x="50" y="20" width="20" height="40" fill="currentColor" />
            <rect x="56" y="0" width="8" height="20" fill="currentColor" />
            {/* Balcony ledges */}
            <rect x="-6" y="140" width="132" height="4" fill="currentColor" opacity="0.7" />
            <rect x="-6" y="240" width="132" height="4" fill="currentColor" opacity="0.7" />
            <rect x="-6" y="340" width="132" height="4" fill="currentColor" opacity="0.7" />
            <rect x="-6" y="440" width="132" height="4" fill="currentColor" opacity="0.7" />
            {/* Windows — 3 cols x many rows */}
            {[100, 160, 200, 260, 300, 360, 400, 460, 500, 560].map((y, i) => (
              <g key={`la${i}`}>
                <rect x="16" y={y} width="22" height="28" rx="2" fill="white" opacity="0.5" />
                <rect x="50" y={y} width="22" height="28" rx="2" fill="white" opacity="0.5" />
                <rect x="82" y={y} width="22" height="28" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}

            {/* Building B — wide mid-rise with rooftop structure */}
            <rect x="135" y="250" width="130" height="550" rx="4" fill="currentColor" />
            <rect x="170" y="225" width="60" height="25" rx="3" fill="currentColor" />
            <rect x="190" y="210" width="20" height="15" fill="currentColor" />
            {[280, 330, 380, 430, 480, 530, 580].map((y, i) => (
              <g key={`lb${i}`}>
                <rect x="150" y={y} width="20" height="26" rx="2" fill="white" opacity="0.5" />
                <rect x="180" y={y} width="20" height="26" rx="2" fill="white" opacity="0.5" />
                <rect x="210" y={y} width="20" height="26" rx="2" fill="white" opacity="0.5" />
                <rect x="240" y={y} width="20" height="26" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}

            {/* Building C — L-shaped complex */}
            <rect x="280" y="380" width="160" height="420" rx="4" fill="currentColor" />
            <rect x="280" y="320" width="80" height="60" rx="4" fill="currentColor" />
            {[410, 455, 500, 545, 590, 635].map((y, i) => (
              <g key={`lc${i}`}>
                <rect x="296" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="324" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="352" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="380" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="408" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}

            {/* Building D — short wide block with entrance */}
            <rect x="455" y="520" width="140" height="280" rx="4" fill="currentColor" />
            <rect x="505" y="730" width="40" height="50" rx="3" fill="white" opacity="0.4" />
            {[548, 590, 632, 674].map((y, i) => (
              <g key={`ld${i}`}>
                <rect x="470" y={y} width="16" height="22" rx="2" fill="white" opacity="0.5" />
                <rect x="496" y={y} width="16" height="22" rx="2" fill="white" opacity="0.5" />
                <rect x="522" y={y} width="16" height="22" rx="2" fill="white" opacity="0.5" />
                <rect x="548" y={y} width="16" height="22" rx="2" fill="white" opacity="0.5" />
                <rect x="574" y={y} width="16" height="22" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}

            {/* Building E — small low block */}
            <rect x="610" y="620" width="110" height="180" rx="4" fill="currentColor" />
            {[645, 685].map((y, i) => (
              <g key={`le${i}`}>
                <rect x="624" y={y} width="14" height="20" rx="2" fill="white" opacity="0.5" />
                <rect x="648" y={y} width="14" height="20" rx="2" fill="white" opacity="0.5" />
                <rect x="672" y={y} width="14" height="20" rx="2" fill="white" opacity="0.5" />
                <rect x="696" y={y} width="14" height="20" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}
          </svg>

          {/* Right skyline — apartment complexes (hidden on small mobile) */}
          <svg className="absolute bottom-0 right-0 hidden sm:block sm:w-[550px] md:w-[780px] lg:w-[920px] h-auto text-neutral-100/80 pointer-events-none select-none" viewBox="0 0 920 750" fill="none" aria-hidden="true" style={{ animation: 'slide-up 1.4s ease-out 0.15s both' }}>
            {/* Building A — small block */}
            <rect x="200" y="600" width="110" height="150" rx="4" fill="currentColor" />
            {[624, 664].map((y, i) => (
              <g key={`ra${i}`}>
                <rect x="214" y={y} width="14" height="20" rx="2" fill="white" opacity="0.5" />
                <rect x="238" y={y} width="14" height="20" rx="2" fill="white" opacity="0.5" />
                <rect x="262" y={y} width="14" height="20" rx="2" fill="white" opacity="0.5" />
                <rect x="286" y={y} width="14" height="20" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}

            {/* Building B — wide block with balconies */}
            <rect x="325" y="430" width="150" height="320" rx="4" fill="currentColor" />
            <rect x="319" y="510" width="162" height="4" fill="currentColor" opacity="0.7" />
            <rect x="319" y="590" width="162" height="4" fill="currentColor" opacity="0.7" />
            {[458, 520, 540, 600, 620].map((y, i) => (
              <g key={`rb${i}`}>
                <rect x="342" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="372" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="402" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="432" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}

            {/* Tower C — tallest with crown + antenna */}
            <rect x="490" y="50" width="115" height="700" rx="4" fill="currentColor" />
            <rect x="520" y="20" width="55" height="30" rx="3" fill="currentColor" />
            <rect x="543" y="0" width="10" height="20" fill="currentColor" />
            <rect x="484" y="180" width="127" height="4" fill="currentColor" opacity="0.7" />
            <rect x="484" y="320" width="127" height="4" fill="currentColor" opacity="0.7" />
            <rect x="484" y="460" width="127" height="4" fill="currentColor" opacity="0.7" />
            {[80, 130, 200, 250, 340, 390, 480, 530, 580, 630].map((y, i) => (
              <g key={`rc${i}`}>
                <rect x="506" y={y} width="20" height="28" rx="2" fill="white" opacity="0.5" />
                <rect x="538" y={y} width="20" height="28" rx="2" fill="white" opacity="0.5" />
                <rect x="570" y={y} width="20" height="28" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}

            {/* Building D — mid-rise with rooftop */}
            <rect x="620" y="200" width="105" height="550" rx="4" fill="currentColor" />
            <rect x="645" y="175" width="55" height="25" rx="3" fill="currentColor" />
            {[235, 285, 335, 385, 435, 485, 535, 585].map((y, i) => (
              <g key={`rd${i}`}>
                <rect x="636" y={y} width="18" height="26" rx="2" fill="white" opacity="0.5" />
                <rect x="664" y={y} width="18" height="26" rx="2" fill="white" opacity="0.5" />
                <rect x="692" y={y} width="18" height="26" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}

            {/* Building E — wide complex */}
            <rect x="740" y="320" width="180" height="430" rx="4" fill="currentColor" />
            <rect x="734" y="420" width="192" height="4" fill="currentColor" opacity="0.7" />
            <rect x="734" y="530" width="192" height="4" fill="currentColor" opacity="0.7" />
            {[350, 430, 450, 540, 560, 620, 660].map((y, i) => (
              <g key={`re${i}`}>
                <rect x="758" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="786" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="814" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="842" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="870" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
                <rect x="898" y={y} width="18" height="24" rx="2" fill="white" opacity="0.5" />
              </g>
            ))}
          </svg>

          {/* ── Floating property-themed icons (hidden on mobile) ── */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden hidden md:block" aria-hidden="true">
            {/* Key icon — top left area */}
            <svg className="absolute top-[15%] left-[8%] w-10 h-10 md:w-14 md:h-14 text-blue-600/[0.07]" style={{ animation: 'float-slow 6s ease-in-out infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.5" cy="7.5" r="5.5" /><path d="M11.5 11.5 22 22M18 22l4-4M15 19l4-4" />
            </svg>

            {/* Dollar sign — top right */}
            <svg className="absolute top-[12%] right-[10%] w-10 h-10 md:w-14 md:h-14 text-blue-600/[0.07]" style={{ animation: 'float-medium 5s ease-in-out 0.5s infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>

            {/* Receipt — mid left */}
            <svg className="absolute top-[40%] left-[4%] w-9 h-9 md:w-12 md:h-12 text-blue-600/[0.07]" style={{ animation: 'drift-right 7s ease-in-out 1s infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M8 7h8M8 11h6M8 15h4" />
            </svg>

            {/* House — mid right */}
            <svg className="absolute top-[38%] right-[5%] w-10 h-10 md:w-14 md:h-14 text-blue-600/[0.07]" style={{ animation: 'drift-left 8s ease-in-out 0.3s infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.182V22h18V10.182L12 2z" /><rect x="9" y="14" width="6" height="8" rx="1" />
            </svg>

            {/* Shield/check — lower left */}
            <svg className="absolute top-[62%] left-[12%] w-8 h-8 md:w-11 md:h-11 text-blue-600/[0.07]" style={{ animation: 'float-fast 4.5s ease-in-out 2s infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
            </svg>

            {/* Wallet — lower right */}
            <svg className="absolute top-[58%] right-[9%] w-9 h-9 md:w-12 md:h-12 text-blue-600/[0.07]" style={{ animation: 'float-slow 7s ease-in-out 1.5s infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><circle cx="17" cy="14" r="1.5" />
            </svg>
          </div>

          {/* Subtle dot grid overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          <div className="container mx-auto max-w-6xl w-full px-4 sm:px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              {/* Pill badge */}
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200 shadow-sm mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs sm:text-sm text-neutral-600">Built for Jamaican landlords</span>
                  <span className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1">
                    Learn more
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-neutral-900 leading-[1.1] tracking-tight mb-4">
                  The easiest way to<br />collect <span className="text-blue-600">rent</span>.
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="text-base md:text-lg text-neutral-600 max-w-xl mb-8 leading-relaxed">
                  Send invoices, share payment links, get proof of payment, and track collections — all from one platform built for Jamaican landlords.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 w-full sm:w-auto px-4 sm:px-0">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer relative bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 text-sm w-48 shadow-lg shadow-blue-600/25"
                  >
                    Get started free
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-neutral-900 border border-neutral-300 rounded-full font-medium text-sm hover:bg-neutral-50 transition-colors w-48"
                  >
                    See how it works
                  </a>
                </div>
              </Reveal>

              <Reveal delay={400}>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <div className="w-5 h-5 rounded bg-blue-600/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-blue-600" strokeWidth={3} />
                  </div>
                  <span>Start free — No credit card required</span>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Hero showcase — two-panel mockup */}
          <div className="w-full px-4 sm:px-6 pb-16 pt-12">
            <div className="relative w-full mx-auto flex flex-col md:flex-row gap-6 justify-center" style={{ maxWidth: 960 }}>
              {/* Left panel — Invoice mockup */}
              <div className="w-full md:w-[380px] flex-shrink-0">
                <div className="bg-white rounded-2xl border-2 border-neutral-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <div className="bg-neutral-900 px-4 sm:px-5 py-3 sm:py-4">
                    <p className="text-neutral-400 text-xs font-medium tracking-wide">INV-ARB-003</p>
                    <p className="text-white text-lg font-bold mt-1">Monthly Rent</p>
                  </div>
                  <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 text-sm">
                    <div className="flex justify-between items-baseline"><span className="text-neutral-400 text-xs uppercase tracking-wide">Amount</span><span className="text-xl sm:text-2xl font-bold text-neutral-900">J$85,000</span></div>
                    <div className="h-px bg-neutral-100" />
                    <div className="flex justify-between items-center"><span className="text-neutral-400 text-xs uppercase tracking-wide">Due</span><span className="font-semibold text-neutral-900">Feb 28, 2026</span></div>
                    <div className="h-px bg-neutral-100" />
                    <div className="flex justify-between items-center"><span className="text-neutral-400 text-xs uppercase tracking-wide">Status</span><span className="text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">Unpaid</span></div>
                    <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-xs border border-neutral-200">
                      <p className="font-semibold text-neutral-900 uppercase tracking-wider text-[10px] mb-2">Bank Details</p>
                      <p className="flex justify-between"><span className="text-neutral-400">Bank</span> <strong className="text-neutral-900">NCB Jamaica</strong></p>
                      <p className="flex justify-between"><span className="text-neutral-400">Account</span> <strong className="text-neutral-900">Property Mgmt Ltd</strong></p>
                    </div>
                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <Upload className="h-4 w-4" /> Upload Proof
                    </button>
                  </div>
                </div>
              </div>

              {/* Right panel — Landlord photo card with gradient overlay */}
              <div className="hidden md:block flex-1">
                <div className="relative rounded-2xl border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(37,99,235,1)] overflow-hidden h-full min-h-[460px]">
                  <img
                    src="/leroy_skalstad-man-4333898_1280.jpg"
                    alt="Landlord collecting rent"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent" />
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Collecting rent since 2024</span>
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                      &ldquo;No more chasing<br />tenants for payment.&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Marcus R.</span>
                        <span className="text-xs text-white/50">Kingston, JA</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                      <div>
                        <span className="text-xl font-bold text-white">12</span>
                        <span className="text-xs text-white/50 ml-1">units</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div>
                        <span className="text-xl font-bold text-emerald-400">95%</span>
                        <span className="text-xs text-white/50 ml-1">collection rate</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div>
                        <span className="text-xl font-bold text-blue-400">J$1.2M</span>
                        <span className="text-xs text-white/50 ml-1">/mo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ FEATURES — Bento Grid ═══ */}
        <section id="features" className="relative py-16 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
            <Reveal>
              <div className="text-center mb-10 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-3 md:mb-4">
                  Everything You Need To Get Paid
                </h2>
                <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
                  Send invoices, track payments, automate reminders, and manage your entire rent collection from one simple dashboard.
                </p>
              </div>
            </Reveal>

            {/* Bento Row 1 */}
            <Reveal>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-5">
              {/* Card 1 — Invoicing (spans 3) */}
              <div className="md:col-span-3 bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden group hover:border-neutral-300 transition-colors">
                <div className="p-6 pb-0">
                  <div className="flex gap-4">
                    {/* Mini invoice card */}
                    <div className="flex-1 bg-white rounded-xl border border-neutral-200 shadow-sm p-4 max-w-[200px]">
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Invoice</p>
                      <p className="text-sm font-bold text-neutral-900 mb-3">INV-ARB-003</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-neutral-400">Amount</span><span className="font-bold text-neutral-900">J$85,000</span></div>
                        <div className="flex justify-between"><span className="text-neutral-400">Due</span><span className="font-medium text-neutral-700">Feb 28</span></div>
                        <div className="flex justify-between items-center"><span className="text-neutral-400">Status</span><span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">Pending</span></div>
                      </div>
                    </div>
                    {/* Mini invoice card 2 */}
                    <div className="flex-1 bg-white rounded-xl border border-neutral-200 shadow-sm p-4 max-w-[200px] hidden sm:block">
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Invoice</p>
                      <p className="text-sm font-bold text-neutral-900 mb-3">INV-ARB-004</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-neutral-400">Amount</span><span className="font-bold text-neutral-900">J$65,000</span></div>
                        <div className="flex justify-between"><span className="text-neutral-400">Due</span><span className="font-medium text-neutral-700">Mar 1</span></div>
                        <div className="flex justify-between items-center"><span className="text-neutral-400">Status</span><span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">Paid</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">Automatic invoicing</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">Generate invoices with auto-numbering per tenant. Track every dollar owed, per tenant, per month.</p>
                  </div>
                  <Link to="/signup" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
                    Try free &rarr;
                  </Link>
                </div>
              </div>

              {/* Card 2 — Dashboard / Track (spans 2) */}
              <div className="md:col-span-2 bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden group hover:border-neutral-300 transition-colors">
                <div className="p-6 pb-0">
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-neutral-900">Collections</span>
                      <span className="text-[10px] text-neutral-400">Feb 2026</span>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900 mb-0.5">J$680,000</div>
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+12.5%</span>
                      <span className="text-xs text-neutral-400">from last period</span>
                    </div>
                    {/* Mini chart */}
                    <div className="h-16 flex items-end gap-[3px]">
                      {[35, 45, 30, 55, 40, 65, 50, 70, 60, 80, 75, 85].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-blue-500 to-blue-400 opacity-80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">Track revenue & payouts</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">See expected vs. collected revenue at a glance from your dashboard.</p>
                  </div>
                  <Link to="/signup" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
                    Try free &rarr;
                  </Link>
                </div>
              </div>
            </div>

            </Reveal>
            {/* Bento Row 2 */}
            <Reveal delay={150}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 3 — Payment Proof */}
              <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden group hover:border-neutral-300 transition-colors">
                <div className="p-6 pb-0 flex justify-center">
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 w-full max-w-[300px] text-center">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-xs text-neutral-400 mb-1">Payment verified</p>
                    <p className="text-2xl font-bold text-neutral-900 mb-4">J$85,000</p>
                    <div className="space-y-2.5 text-xs text-left border-t border-neutral-100 pt-4">
                      <div className="flex justify-between"><span className="text-neutral-400">Invoice</span><span className="font-semibold text-neutral-900">#INV-ARB-003</span></div>
                      <div className="flex justify-between"><span className="text-neutral-400">Payment date</span><span className="font-semibold text-neutral-900">22 Feb 2026</span></div>
                      <div className="flex justify-between"><span className="text-neutral-400">Method</span><span className="font-semibold text-neutral-900">Bank Transfer</span></div>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">Proof of payment upload</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">Tenants upload proof of their bank transfers. Review, approve, or reject with one click.</p>
                  </div>
                  <Link to="/signup" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
                    Try free &rarr;
                  </Link>
                </div>
              </div>

              {/* Card 4 — Payment Links */}
              <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden group hover:border-neutral-300 transition-colors">
                <div className="p-6 pb-0 flex justify-center">
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden w-full max-w-[320px]">
                    <div className="bg-neutral-900 px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                        <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                        <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                      </div>
                      <div className="flex-1 bg-neutral-800 rounded-md px-3 py-1 text-[10px] text-neutral-400 font-mono truncate">
                        easycollect.com/pay/a3f8-b2c1...
                      </div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2 border border-blue-200">
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-bold text-neutral-900 mb-1">Monthly Rent — Feb 2026</p>
                      <p className="text-xs text-neutral-400 mb-3">J$85,000 due Feb 28</p>
                      <div className="flex gap-2 justify-center">
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">View Details</span>
                        <span className="text-[10px] font-medium bg-neutral-900 text-white px-2 py-1 rounded-full">Upload Proof</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">Shareable payment links</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">Each invoice gets a unique link — tenants view details and upload proof. No account needed.</p>
                  </div>
                  <Link to="/signup" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
                    Try free &rarr;
                  </Link>
                </div>
              </div>
            </div>
            </Reveal>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ HOW IT WORKS — SVG Path Draw ═══ */}
        <HowItWorks />

        <SectionDivider />

        {/* ═══ DASHBOARD / MANAGEMENT ═══ */}
        <section className="relative py-16 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
            <Reveal>
              <div className="relative bg-neutral-950 rounded-3xl overflow-hidden dashboard-card">
                {/* Background glow effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }} />

                {/* Radar ping rings */}
                {[0, 1.3, 2.6].map((delay) => (
                  <div
                    key={delay}
                    className="absolute top-1/3 left-1/2 w-[500px] h-[500px] rounded-full border border-blue-400/20 pointer-events-none"
                    style={{ animation: `radar-ping 4s ${delay}s ease-out infinite` }}
                  />
                ))}

                {/* Floating particles */}
                {[
                  { top: '15%', left: '10%', size: 3, dur: '6s', del: '0s' },
                  { top: '25%', left: '85%', size: 2, dur: '8s', del: '1s' },
                  { top: '60%', left: '15%', size: 2, dur: '7s', del: '2s' },
                  { top: '70%', left: '90%', size: 3, dur: '5s', del: '0.5s' },
                  { top: '40%', left: '5%', size: 2, dur: '9s', del: '3s' },
                  { top: '80%', left: '50%', size: 2, dur: '6s', del: '1.5s' },
                  { top: '10%', left: '60%', size: 3, dur: '7s', del: '2.5s' },
                  { top: '50%', left: '75%', size: 2, dur: '8s', del: '0.8s' },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-blue-400 pointer-events-none"
                    style={{
                      top: p.top, left: p.left,
                      width: p.size, height: p.size,
                      animation: `particle-float ${p.dur} ${p.del} ease-in-out infinite`,
                    }}
                  />
                ))}

                <div className="relative z-10 px-4 sm:px-6 md:px-12 lg:px-16 pt-10 md:pt-20 pb-0">
                  {/* Header */}
                  <div className="text-center mb-12 md:mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-xs text-white/70">Your command center</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 md:mb-6 leading-[1.1]">
                      Manage Properties, Tenants,<br className="hidden md:block" /> And Payments From Anywhere.
                    </h2>
                    <p className="text-base md:text-lg text-white/50 max-w-2xl mx-auto mb-8">
                      Your dashboard shows everything at a glance — expected revenue, collection progress, overdue tenants, and recent payments. No spreadsheets needed.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Link to="/signup" className="inline-flex items-center justify-center rounded-full font-medium transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-500 px-6 py-3 text-sm w-48 shadow-lg shadow-blue-600/25">
                        Start for free
                      </Link>
                      <a href="#features" className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white border border-white/10 rounded-full font-medium text-sm hover:bg-white/15 transition-colors w-48">
                        Explore features
                      </a>
                    </div>
                  </div>

                  {/* Feature pills row */}
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 md:mb-12">
                    {[
                      { icon: BarChart3, label: 'Real-time dashboard' },
                      { icon: Building2, label: 'Multi-property' },
                      { icon: Receipt, label: 'Auto receipts' },
                      { icon: Shield, label: 'Bank-grade security' },
                      { icon: Bell, label: 'Auto reminders' },
                      { icon: LinkIcon, label: 'Payment links' },
                    ].map((pill) => (
                      <div key={pill.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] transition-all duration-300 group cursor-default">
                        <pill.icon className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                        <span className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors">{pill.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Floating dashboard mockup — pushed to bottom edge */}
                  <div className="relative mx-auto max-w-4xl">
                    {/* Glow behind card */}
                    <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-2xl pointer-events-none" />
                    <div className="relative bg-white rounded-t-2xl border border-neutral-200 border-b-0 shadow-2xl shadow-blue-600/10 overflow-hidden">
                      {/* Browser chrome */}
                      <div className="flex items-center gap-2 px-5 py-3.5 bg-neutral-50 border-b border-neutral-200">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                          <div className="w-3 h-3 rounded-full bg-amber-400" />
                          <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        </div>
                        <div className="flex-1 max-w-md mx-auto bg-white rounded-lg px-4 py-1.5 text-xs text-neutral-400 font-mono border border-neutral-200 text-center">
                          app.easycollect.com/dashboard
                        </div>
                      </div>

                      {/* Dashboard content */}
                      <div className="p-4 sm:p-6 md:p-8">
                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-neutral-900">Dashboard</h3>
                              <p className="text-[10px] text-neutral-400">February 2026</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-lg border border-blue-200">This Month</div>
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                              <Bell className="w-3.5 h-3.5 text-neutral-500" />
                            </div>
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 md:mb-6">
                          {[
                            { label: 'Expected', value: 'J$840,000', change: null, color: 'text-neutral-900' },
                            { label: 'Collected', value: 'J$680,000', change: '+12.5%', color: 'text-emerald-600' },
                            { label: 'Outstanding', value: 'J$160,000', change: null, color: 'text-amber-600' },
                            { label: 'Overdue', value: '2 tenants', change: '-1', color: 'text-red-500' },
                          ].map((s) => (
                            <div key={s.label} className="bg-neutral-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-neutral-100">
                              <p className="text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">{s.label}</p>
                              <p className={`text-sm sm:text-base md:text-lg font-bold ${s.color}`}>{s.value}</p>
                              {s.change && (
                                <p className={`text-[10px] font-semibold mt-1 ${s.change.startsWith('+') ? 'text-emerald-500' : 'text-red-400'}`}>{s.change} from last month</p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Chart + recent activity — hidden on mobile for cleaner look */}
                        <div className="hidden md:grid grid-cols-5 gap-4">
                          {/* Chart */}
                          <div className="col-span-3 bg-neutral-50 rounded-xl border border-neutral-100 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-semibold text-neutral-700">Monthly Collections</span>
                              <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Collected</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-200" /> Expected</span>
                              </div>
                            </div>
                            <div className="h-28 flex items-end gap-[6px]">
                              {[
                                { e: 90, c: 72 }, { e: 90, c: 85 }, { e: 90, c: 65 }, { e: 90, c: 88 },
                                { e: 90, c: 78 }, { e: 90, c: 90 }, { e: 90, c: 70 }, { e: 90, c: 82 },
                                { e: 90, c: 75 }, { e: 90, c: 86 }, { e: 90, c: 80 }, { e: 90, c: 81 },
                              ].map((bar, i) => (
                                <div key={i} className="flex-1 flex flex-col gap-[2px]">
                                  <div className="w-full rounded-t-sm bg-neutral-200/60" style={{ height: `${bar.e - bar.c}%` }} />
                                  <div className="w-full rounded-b-sm bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${bar.c}%` }} />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recent activity */}
                          <div className="col-span-2 bg-neutral-50 rounded-xl border border-neutral-100 p-4">
                            <p className="text-xs font-semibold text-neutral-700 mb-3">Recent Activity</p>
                            <div className="space-y-3">
                              {[
                                { name: 'Marcus R.', action: 'paid', amount: 'J$85,000', time: '2h ago', color: 'bg-emerald-500' },
                                { name: 'Keisha T.', action: 'proof uploaded', amount: 'J$65,000', time: '5h ago', color: 'bg-blue-500' },
                                { name: 'Andre W.', action: 'overdue', amount: 'J$72,000', time: '1d ago', color: 'bg-red-400' },
                              ].map((item) => (
                                <div key={item.name} className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-neutral-800 font-medium truncate">{item.name} — <span className="text-neutral-400">{item.action}</span></p>
                                    <p className="text-[10px] text-neutral-400">{item.amount} &middot; {item.time}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Collection progress — segmented bar */}
                        <div className="bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100 mt-4">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Collection Rate</span>
                            <span className="text-lg font-bold text-emerald-600 tabular-nums">81%</span>
                          </div>
                          <div className="flex gap-[3px]">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 flex-1 rounded-sm ${
                                  i < 16
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]'
                                    : i < 18
                                      ? 'bg-amber-300'
                                      : 'bg-neutral-200'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400"><span className="w-2 h-2 rounded-sm bg-emerald-400" />Collected</span>
                            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400"><span className="w-2 h-2 rounded-sm bg-amber-300" />Pending</span>
                            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400"><span className="w-2 h-2 rounded-sm bg-neutral-200" />Outstanding</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ PRICING ═══ */}
        <section id="pricing" className="relative py-16 md:py-32 bg-neutral-50 overflow-hidden">
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          <div className="container mx-auto px-6 lg:px-8 max-w-5xl relative z-10">
            <Reveal>
              <div className="text-center mb-16">
                <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-4">Pricing</span>
                <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Simple, transparent pricing</h2>
                <p className="text-lg text-neutral-500 max-w-xl mx-auto">
                  Start free and upgrade when you need more. No hidden fees, cancel anytime.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Free plan */}
                <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6 sm:p-8 flex flex-col">
                  <div className="mb-6 sm:mb-8">
                    <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Free</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl sm:text-5xl font-bold text-neutral-900">J$0</span>
                      <span className="text-neutral-400 text-sm">/month</span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-3">Perfect for landlords just getting started with a few tenants.</p>
                  </div>
                  <div className="space-y-3 mb-8 flex-1">
                    {['Up to 5 tenants', 'Up to 2 properties', 'Invoice generation', 'Payment links', 'Proof upload & review', 'Email reminders', 'Dashboard & reports'].map((f) => (
                      <div key={f} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-neutral-600" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-neutral-700">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center rounded-xl font-semibold transition-colors cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 px-6 py-3.5 text-sm w-full"
                  >
                    Get started free
                  </Link>
                </div>

                {/* Pro plan */}
                <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-[0_0_0_1px_rgba(37,99,235,0.1),0_8px_40px_-12px_rgba(37,99,235,0.25)] p-6 sm:p-8 flex flex-col relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 rounded-full uppercase tracking-wider">Most Popular</span>
                  </div>
                  <div className="mb-6 sm:mb-8">
                    <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Pro</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl sm:text-5xl font-bold text-neutral-900">J$3,500</span>
                      <span className="text-neutral-400 text-sm">/month</span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-3">For growing landlords who need unlimited power and premium features.</p>
                  </div>
                  <div className="space-y-3 mb-8 flex-1">
                    {['Unlimited tenants', 'Unlimited properties', 'Everything in Free, plus:', 'Auto-reminders (daily)', 'CSV export', 'Receipt generation', 'Priority support', 'Custom branding', 'Team members'].map((f, i) => (
                      <div key={f} className={`flex items-center gap-3 ${i === 2 ? 'pt-2 mt-2 border-t border-neutral-100' : ''}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i === 2 ? 'bg-transparent' : 'bg-blue-50'}`}>
                          {i === 2 ? null : <Check className="w-3 h-3 text-blue-600" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm ${i === 2 ? 'font-semibold text-neutral-900' : 'text-neutral-700'}`}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center rounded-xl font-semibold transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700 px-6 py-3.5 text-sm w-full shadow-lg shadow-blue-600/25"
                  >
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ TESTIMONIALS ═══ */}
        <section id="testimonials" className="relative py-16 md:py-32 bg-[#0a1628] overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="container mx-auto max-w-6xl px-6 relative z-10">
            <Reveal>
              <div className="text-center mb-16">
                <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-400 mb-4">Testimonials</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Results That Speak For<br />Themselves
                </h2>
                <p className="text-lg text-white/40 max-w-2xl mx-auto">
                  Join landlords across Jamaica who are collecting rent faster and easier with EasyCollect
                </p>
              </div>
            </Reveal>

            {/* Stats row */}
            <Reveal delay={100}>
              <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto mb-12 md:mb-16">
                {[
                  { val: 95, suf: '%', label: 'faster payments' },
                  { val: 3, suf: 'x', label: 'less time spent' },
                  { val: 100, suf: '%', label: 'documented proof' },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-400 mb-1"><Counter value={s.val} suffix={s.suf} /></div>
                    <div className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Featured quote */}
            <Reveal delay={150}>
              <div className="relative max-w-3xl mx-auto mb-12">
                <svg className="absolute -top-4 -left-2 w-10 h-10 md:w-16 md:h-16 text-blue-500/10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <blockquote className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 font-medium leading-relaxed text-center">
                  &ldquo;I used to chase tenants for weeks. Now I send a link and they pay within minutes. The payment proof feature means no more arguments about who paid what.&rdquo;
                </blockquote>
                <div className="flex items-center justify-center gap-3 mt-8">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face&auto=format&q=80"
                    alt="Marcus Robinson"
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30"
                  />
                  <div className="text-left">
                    <span className="font-semibold text-white text-sm">Marcus Robinson</span>
                    <p className="text-xs text-white/40">Property Owner, Kingston</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Smaller testimonial cards — 2 rows of 3 with staggered heights */}
            <Reveal delay={250}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Shelly-Ann Palmer',
                    role: 'Landlord, Montego Bay',
                    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'The payment proof feature is brilliant. No more "I already sent it" back and forth — everything is documented.',
                  },
                  {
                    name: 'Andre Williams',
                    role: 'Property Manager, Portmore',
                    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'Managing 12 units used to be a nightmare of spreadsheets. Now I see exactly who paid and who didn\'t.',
                  },
                  {
                    name: 'Keisha Thompson',
                    role: 'Landlord, Spanish Town',
                    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'The automatic reminders are a lifesaver. I don\'t have to send awkward messages anymore.',
                  },
                  {
                    name: 'Tyrone Mitchell',
                    role: 'Property Owner, Half Way Tree',
                    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'My tenants love the payment links. They just click, see my bank details, pay, and upload the proof. No app needed.',
                  },
                  {
                    name: 'Davina Richards',
                    role: 'Property Manager, Mandeville',
                    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&h=96&fit=crop&crop=face&auto=format&q=80',
                    quote: 'I can see my expected income vs collected at a glance. Best decision I made for my rental business.',
                  },
                ].map((t) => (
                  <div key={t.name} className="bg-white/[0.04] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.1] transition-all duration-300">
                    <p className="text-white/70 text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={t.photo}
                        alt={t.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <span className="font-medium text-white/90 text-xs">{t.name}</span>
                        <p className="text-[10px] text-white/30">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={350}>
              <div className="mt-16 text-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  Start Collecting Rent
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ FAQ ═══ */}
        <section className="py-16 md:py-32 bg-white overflow-hidden">
          <div className="container mx-auto max-w-6xl px-4 w-full">
            <Reveal>
              <div className="grid md:grid-cols-12 gap-12">
                <div className="md:col-span-4 md:sticky md:top-28 md:self-start">
                  <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-4">FAQ</span>
                  <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 text-neutral-900">
                    Frequently Asked<br />Questions
                  </h2>
                  <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                    Can&apos;t find what you&apos;re looking for? Reach out to our team and we&apos;ll get back to you.
                  </p>
                  <a href="mailto:support@easycollect.com" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    Contact support
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="md:col-span-8">
                  <div className="border-l-2 border-blue-600/20 pl-4 sm:pl-6 md:pl-8 space-y-0">
                    <FAQItem
                      question="How much does EasyCollect cost?"
                      answer="EasyCollect is completely free to use for up to 5 tenants and 2 properties. No monthly fees, no hidden costs. When you're ready to scale, the Pro plan is J$3,500/month for unlimited tenants and properties."
                    />
                    <FAQItem
                      question="Do my tenants need to create an account?"
                      answer="No! That's the beauty of payment links. Your tenant receives a link, opens it in their browser, sees the invoice and your bank details, pays, and uploads proof — all without downloading an app or creating an account."
                    />
                    <FAQItem
                      question="How do payment proofs work?"
                      answer="After your tenant transfers money to your bank account, they upload a screenshot of the confirmation through the payment link. You'll see the proof in your Payments dashboard where you can approve or reject it with one click."
                    />
                    <FAQItem
                      question="Can I manage multiple properties?"
                      answer="Yes! The free plan supports up to 2 properties. With Pro, you get unlimited properties and units, each with their own tenants and invoices — all managed from a single dashboard."
                    />
                    <FAQItem
                      question="How do automatic reminders work?"
                      answer="When enabled, EasyCollect sends daily email reminders to tenants with overdue invoices. Each reminder includes the invoice details, your bank information, and a payment link for easy proof upload."
                    />
                    <FAQItem
                      question="Is my data secure?"
                      answer="Absolutely. EasyCollect uses Supabase with Row Level Security, meaning your data is isolated and protected. All connections are encrypted, and payment proof images are stored in secure cloud storage."
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <SectionDivider />

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-10 md:py-24 bg-white overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
            <div className="max-w-[1400px] mx-auto">
              <div className="relative bg-blue-600 rounded-2xl text-center mx-auto overflow-hidden" style={{ padding: 'clamp(40px, 8vw, 80px) clamp(20px, 4vw, 40px)' }}>
                {/* Noise texture */}
                <div className="absolute inset-0 opacity-[0.08]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px',
                }} />

                <div className="relative z-10 flex flex-col items-center gap-5 sm:gap-8">
                  <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight">
                    Ready to get started?
                  </h2>
                  <p className="text-base md:text-lg text-white/90 max-w-xl leading-relaxed">
                    Join landlords across Jamaica who use EasyCollect to send invoices, collect proof of payment, and track their rental income — all for free.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to="/signup"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-neutral-100 transition-colors shadow-lg cursor-pointer"
                    >
                      Create free account
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-full font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
                    >
                      Log in
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-white/80">
                    <div className="flex -space-x-2">
                      {[
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face&auto=format&q=80',
                        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=64&h=64&fit=crop&crop=face&auto=format&q=80',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face&auto=format&q=80',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face&auto=format&q=80',
                      ].map((src, i) => (
                        <img key={i} src={src} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-blue-600" />
                      ))}
                    </div>
                    <span className="text-sm">Trusted by landlords across Jamaica</span>
                  </div>
                </div>
              </div>
            </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="w-full overflow-hidden relative z-50 bg-white md:border-x border-neutral-200 max-w-7xl mx-auto">
        <div className="bg-[#1a3a5c] text-white">
          <div className="container mx-auto px-6 pt-12 md:pt-16 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-10 md:mb-16">
              <div className="col-span-2 md:col-span-1">
                <div className="mb-4">
                  <BrandLogo className="text-xl font-extrabold tracking-tight" coinColor="rgba(255,255,255,0.8)" />
                </div>
                <p className="text-sm text-white/60 mb-6">
                  Collect rent simply.<br />Get paid on time.
                </p>
                <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} EasyCollect</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-white/80 mb-4 uppercase tracking-wider">Product</h3>
                <ul className="space-y-3">
                  <li><a href="#features" className="text-white/60 hover:text-white transition-colors text-sm">Features</a></li>
                  <li><a href="#pricing" className="text-white/60 hover:text-white transition-colors text-sm">Pricing</a></li>
                  <li><a href="#how-it-works" className="text-white/60 hover:text-white transition-colors text-sm">How It Works</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-white/80 mb-4 uppercase tracking-wider">Company</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">About</a></li>
                  <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Contact</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-white/80 mb-4 uppercase tracking-wider">Legal</h3>
                <ul className="space-y-3">
                  <li><Link to="/terms" className="text-white/60 hover:text-white transition-colors text-sm">Terms</Link></li>
                  <li><Link to="/privacy" className="text-white/60 hover:text-white transition-colors text-sm">Privacy</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-sm text-white/80 mb-4 uppercase tracking-wider">For Landlords</h3>
                <ul className="space-y-3">
                  <li><Link to="/signup" className="text-white/60 hover:text-white transition-colors text-sm">Sign Up</Link></li>
                  <li><Link to="/login" className="text-white/60 hover:text-white transition-colors text-sm">Log In</Link></li>
                </ul>
              </div>
            </div>

            <div className="max-w-3xl mx-auto text-center mb-8">
              <p className="text-sm text-white/60 leading-relaxed">
                <span className="text-blue-400 font-semibold">EasyCollect</span> was created to simplify rent collection for landlords and property managers across Jamaica. Our mission is to remove the friction from getting paid — making it simple to send invoices, receive proof of payment, and track your rental income.
              </p>
            </div>
          </div>

          {/* Giant watermark text */}
          <div className="relative w-full overflow-hidden">
            <div className="text-[20vw] md:text-[18vw] font-bold text-white/[0.04] whitespace-nowrap text-center leading-none select-none pointer-events-none -mb-[4vw]">
              EasyCollect
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
