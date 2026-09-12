import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiLock, FiMail, FiArrowLeft, FiCheckCircle, FiClock, FiShield, FiZap,
  FiPackage, FiShoppingCart, FiBarChart2, FiUsers, FiFileText, FiRepeat,
  FiTruck, FiPrinter, FiDatabase, FiUser, FiArrowRight, FiChevronDown,
} from 'react-icons/fi';

// ─── Static data ────────────────────────────────────────────────────────────

const METRICS = [
  { value: '50+', label: 'Products tracked' },
  { value: '100+', label: 'Invoices generated' },
  { value: '15+', label: 'Customers on record' },
  { value: '3 mo', label: 'Sales history modelled' },
];

const MODULES = [
  { code: 'M-01', name: 'Billing & POS', desc: 'Build an invoice in seconds, apply GST and discounts automatically, then print or download as PDF.',           icon: FiShoppingCart },
  { code: 'M-02', name: 'Inventory Control', desc: 'Watch stock levels in real time, set reorder points, and get warned before an item runs out.',                  icon: FiPackage },
  { code: 'M-03', name: 'Customer Records', desc: 'Keep purchase history and outstanding balances against every customer, automatically.',                         icon: FiUsers },
  { code: 'M-04', name: 'Analytics & Reporting', desc: 'Revenue, profit, and category-wise sales — broken down without building a spreadsheet.',                        icon: FiBarChart2 },
  { code: 'M-05', name: 'Staff & Roles', desc: 'Give each person only the access their role needs, and see who did what, and when.',                            icon: FiUser },
  { code: 'M-06', name: 'Department Transfers', desc: 'Move stock between departments and keep a clean, searchable audit trail as it happens.',                         icon: FiRepeat },
]; 

const WORKFLOW = [
  { n: '01', title: 'Stock in',    desc: 'Receive goods, log supplier and quantity — the count updates the moment you save.',                 icon: FiTruck },
  { n: '02', title: 'Bill & sell', desc: 'Ring up a sale, apply tax and discount, hand over a printed or digital invoice.',                   icon: FiPrinter },
  { n: '03', title: 'Track',       desc: 'Every unit and rupee is logged the moment it moves — nothing waits for a nightly sync.',            icon: FiZap },
  { n: '04', title: 'Reconcile',   desc: 'Close the day against a report that already matches what\'s on the shelf.',                         icon: FiCheckCircle },
];

const TRUST = [
  { title: 'Role-based access',      desc: 'Every login is scoped by JWT authentication — staff only reach what their role permits.',      icon: FiShield },
  { title: 'A record that holds up', desc: 'Built on PostgreSQL so stock and sales history stay consistent even under load.',               icon: FiDatabase },
  { title: 'Reports you can hand over', desc: 'Export to CSV, PDF, or Excel for accountants, auditors, or your own records.',              icon: FiFileText },
  { title: 'Runs on your terms',     desc: 'Deploy on your own infrastructure or ours — the data stays yours either way.',                 icon: FiLock },
];

const MANAGER_DUTIES = [
  'Create invoices and take payment at the counter',
  'Add and adjust products, categories, and suppliers',
  'Record stock in / stock out as it happens',
  'Look up a customer\'s history before a sale',
  'Check the day\'s sales total without asking anyone',
];

const OWNER_DUTIES = [
  'Read weekly and monthly revenue at a glance',
  'See which products and customers matter most',
  'Add staff and decide exactly what they can touch',
  'Pull GST-ready reports for any date range',
  'Set tax rules, invoice formats, and store settings',
];

// ─── Animation styles (injected once) ───────────────────────────────────────

const AnimStyles = () => (
  <style>{`
    /* scroll-reveal */
    .hp-el {
      opacity: 0;
      transform: translateY(32px);
      transition: opacity 0.75s cubic-bezier(0.22,1,0.36,1),
                  transform 0.75s cubic-bezier(0.22,1,0.36,1);
    }
    .hp-visible .hp-el { opacity: 1; transform: translateY(0); }

    /* stagger helpers */
    .hp-visible .hp-s1  { transition-delay: 0.04s; }
    .hp-visible .hp-s2  { transition-delay: 0.10s; }
    .hp-visible .hp-s3  { transition-delay: 0.16s; }
    .hp-visible .hp-s4  { transition-delay: 0.22s; }
    .hp-visible .hp-s5  { transition-delay: 0.28s; }
    .hp-visible .hp-s6  { transition-delay: 0.34s; }

    /* slide-from-left variant */
    .hp-el-left {
      opacity: 0;
      transform: translateX(-24px);
      transition: opacity 0.75s cubic-bezier(0.22,1,0.36,1),
                  transform 0.75s cubic-bezier(0.22,1,0.36,1);
    }
    .hp-visible .hp-el-left { opacity: 1; transform: translateX(0); }

    /* fade-up for hero (no observer needed — always visible) */
    @keyframes heroUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .hero-anim-1 { animation: heroUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.10s both; }
    .hero-anim-2 { animation: heroUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
    .hero-anim-3 { animation: heroUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.34s both; }
    .hero-anim-4 { animation: heroUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.46s both; }
    .hero-anim-5 { animation: heroUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.58s both; }

    /* ticker marquee */
    @keyframes marquee {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    .marquee-track { animation: marquee 28s linear infinite; }

    /* blinking cursor */
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
    .cursor { animation: blink 1s step-end infinite; }

    /* nav blur */
    .hp-nav {
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    /* grain overlay */
    .hp-grain::after {
      content: '';
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 200px 200px;
    }

    /* form input */
    .hp-input {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 8px;
      color: #fff;
      transition: border-color 0.2s;
    }
    .hp-input::placeholder { color: rgba(255,255,255,0.28); }
    .hp-input:focus { outline: none; border-color: rgba(255,255,255,0.7); }

    /* metric counter shimmer */
    @keyframes shimmer {
      from { background-position: -200% center; }
      to   { background-position:  200% center; }
    }
    .metric-val {
      background: linear-gradient(90deg, #fff 40%, #aaa 50%, #fff 60%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .hp-el, .hp-el-left { transition: none; opacity: 1; transform: none; }
      .hero-anim-1,.hero-anim-2,.hero-anim-3,.hero-anim-4,.hero-anim-5 { animation: none; opacity:1; transform:none; }
      .marquee-track { animation: none; }
      .metric-val { animation: none; background: #fff; -webkit-text-fill-color:#fff; }
    }
  `}</style>
);

// ─── Reusable hook for IntersectionObserver ──────────────────────────────────

function useScrollReveal(deps = []) {
  const refs = useRef([]);
  refs.current = [];
  const addRef = (el) => {
    if (el && !refs.current.includes(el)) refs.current.push(el);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('hp-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );
    refs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return addRef;
}

// ─── Login component ─────────────────────────────────────────────────────────

const Login = () => {
  const [loginType, setLoginType]   = useState(null); // null | 'owner' | 'manager'
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const { login }                   = useAuth();
  const navigate                    = useNavigate();
  const addRef                      = useScrollReveal([loginType]);

  // Navbar shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success(`Welcome to the ${loginType === 'owner' ? 'Owner' : 'Manager'} dashboard`);
        navigate('/');
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setLoginType(null);
    setEmail('');
    setPassword('');
  };

  // ── Login form (shown after role selection) ────────────────────────────────
  if (loginType) {
    return (
      <div className="min-h-screen flex bg-black">
        <AnimStyles />

        {/* Left — branding panel */}
        <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-white text-black">
          {/* subtle grid bg */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative z-10 flex flex-col justify-between h-full w-full p-14">
            {/* top */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="IMS" className="w-7 h-7 object-contain" />
              <span className="font-mono text-xs font-semibold tracking-widest uppercase text-black/50">IMS</span>
            </div>

            {/* center */}
            <div>
              <h1 className="text-5xl font-bold tracking-tight leading-[1.06] mb-5">
                {loginType === 'owner' ? 'Owner\ndashboard.' : 'Manager\ndashboard.'}
              </h1>
              <p className="text-black/55 text-lg leading-relaxed max-w-sm">
                {loginType === 'owner'
                  ? 'Read the numbers, manage staff, and set the rules the rest of the store runs on.'
                  : 'Bill, stock, and serve customers without breaking your stride.'}
              </p>
              <div className="mt-12 grid grid-cols-2 gap-6">
                {[
                  { icon: FiZap,         title: 'Fast',     desc: 'Built for the counter' },
                  { icon: FiShield,      title: 'Secure',   desc: 'Role-based JWT access' },
                  { icon: FiClock,       title: '24 / 7',   desc: 'Always available' },
                  { icon: FiCheckCircle, title: 'Reliable', desc: 'Consistent records' },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-black/8 flex items-center justify-center shrink-0 mt-0.5">
                      <f.icon className="w-4 h-4 text-black/60" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{f.title}</p>
                      <p className="text-black/45 text-xs mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* bottom */}
            <p className="font-mono text-xs text-black/30">© 2026 OAKnORE · IMS</p>
          </div>
        </div>

        {/* Right — form panel */}
        <div className="w-full lg:w-[48%] flex items-center justify-center p-8 lg:p-14">
          <div className="w-full max-w-[400px]">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-white/40 hover:text-white mb-10 transition-colors text-sm"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="mb-9">
              <p className="font-mono text-xs text-white/35 tracking-widest uppercase mb-3">
                {loginType === 'owner' ? 'Owner access' : 'Manager access'}
              </p>
              <h2 className="text-3xl font-bold text-white tracking-tight">Sign in</h2>
              <p className="text-white/45 mt-2 text-sm">
                {loginType === 'owner'
                  ? 'Access business analytics and controls.'
                  : 'Access store operations and billing.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
                  Email address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="hp-input w-full pl-10 pr-4 py-3 text-sm"
                    placeholder={loginType === 'owner' ? 'owner@oaknore.in' : 'manager@oaknore.in'}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 w-4 h-4" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="hp-input w-full pl-10 pr-4 py-3 text-sm"
                    placeholder="••••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 bg-white text-black text-sm font-bold rounded-lg
                           hover:bg-white/90 active:scale-[0.98] transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>Sign in <FiArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            {/* <div className="mt-8 p-4 rounded-xl bg-white/[0.04] border border-white/10">
              <p className="text-xs font-semibold text-white/50 mb-2.5 tracking-wide uppercase">
                Demo credentials
              </p>
              <div className="space-y-1 font-mono text-xs text-white/40">
                {loginType === 'owner' ? (
                  <>
                    <p>admin@oaknore.in</p>
                    <p>O$1234567890</p>
                  </>
                ) : (
                  <>
                    <p>harvansh@oaknore.in</p>
                    <p>O$1234567890</p>
                  </>
                )}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    );
  }

  // ── Ticker items for marquee strip ────────────────────────────────────────
  const tickerItems = [
    'Billing & POS', 'Inventory Control', 'Customer Records',
    'Analytics', 'Staff & Roles', 'Department Transfers',
    'GST Reports', 'Stock Alerts', 'PDF Invoices', 'Role-based Access',
  ];

  // ── Homepage ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-black text-white min-h-screen hp-grain">
      <AnimStyles />

      {/* ── Fixed Navbar ── */}
      <nav
        className={`hp-nav fixed top-0 inset-x-0 z-50 transition-all duration-300
          ${scrolled ? 'bg-black/80 border-b border-white/10' : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="IMS" className="w-7 h-7 object-contain" />
            <span className="font-mono text-sm font-bold tracking-widest text-white uppercase">IMS</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLoginType('manager')}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Manager
            </button>
            <button
              onClick={() => setLoginType('owner')}
              className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90 active:scale-95 transition-all"
            >
              Owner login
            </button>
          </div>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden min-h-screen flex flex-col justify-center pt-16">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="w-[900px] h-[900px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
          />
        </div>
        {/* Grid bg */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-24 lg:py-32">
          {/* Badge */}
          <div className="hero-anim-1 inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            <span className="font-mono text-xs text-white/55 tracking-widest uppercase">
              Smart Business Management · 2026
            </span>
          </div>

          {/* Headline */}
          <h1 className="hero-anim-2 text-[clamp(2.8rem,7vw,6.5rem)] font-black tracking-tight leading-[0.95] max-w-7xl">
            Every item<br />
            <span className="text-white/30">counted.</span><br />
            Every sale<br />
            <span className="text-white/30">logged.</span>
          </h1>

          {/* Sub */}
          <p className="hero-anim-3 mt-8 text-xl sm:text-2xl text-white/50 max-w-2xl leading-relaxed font-light">
            One platform for inventory, billing, staff, and analytics —
            a dashboard built for the counter and another for the boardroom.
          </p>

          {/* CTAs */}
          <div className="hero-anim-4 mt-12 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setLoginType('owner')}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-base font-bold
                         rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all"
            >
              Owner dashboard
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => setLoginType('manager')}
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white text-base font-semibold
                         rounded-xl hover:border-white/50 hover:bg-white/5 active:scale-[0.97] transition-all"
            >
              Manager dashboard
            </button>
          </div>

          {/* Scroll cue */}
          <div className="hero-anim-5 mt-24 flex items-center gap-2 text-white/25 text-sm">
            <FiChevronDown className="w-4 h-4 animate-bounce" />
            <span className="font-mono text-xs tracking-widest uppercase">Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* ── 2. MARQUEE TICKER ── */}
      <div className="border-y border-white/10 bg-white/[0.02] py-5 overflow-hidden select-none">
        <div className="marquee-track flex gap-12 whitespace-nowrap w-max">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="font-mono text-xs tracking-widest text-white/30 uppercase flex items-center gap-12">
              {item}
              <span className="text-white/15 text-base">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. METRICS ── */}
      <section ref={addRef} className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 lg:py-28">
          <div className="hp-el hp-s1 mb-16">
            <p className="font-mono text-xs text-white/35 tracking-widest uppercase mb-4">By the numbers</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1]">
              Real data.<br /><span className="text-white/30">Real operations.</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
            {METRICS.map((m, i) => (
              <div key={m.label} className={`hp-el hp-s${i + 2} bg-black p-10 lg:p-12`}>
                <div className="metric-val font-mono text-5xl sm:text-6xl font-black tabular-nums mb-3">
                  {m.value}
                </div>
                <div className="text-white/40 text-sm font-medium">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. MODULES ── */}
      <section ref={addRef} className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 lg:py-28">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-16">
            <div>
              <p className="hp-el hp-s1 font-mono text-xs text-white/35 tracking-widest uppercase mb-4">Modules</p>
              <h2 className="hp-el hp-s2 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1]">
                What's on<br /><span className="text-white/30">the manifest</span>
              </h2>
            </div>
            <span className="hp-el hp-s3 font-mono text-sm text-white/25 self-end pb-1">6 modules</span>
          </div>

          <div className="border-t border-white/10">
            {MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.code}
                  className={`hp-el hp-s${Math.min(i + 1, 6)} group grid grid-cols-1 sm:grid-cols-[90px_1fr_2fr_40px]
                              gap-x-8 gap-y-2 items-center py-8 border-b border-white/10
                              hover:bg-white/[0.02] transition-colors px-4 -mx-4 rounded-lg`}
                >
                  <span className="font-mono text-xs text-white/25">{mod.code}</span>
                  <h3 className="text-xl font-bold">{mod.name}</h3>
                  <p className="text-white/45 leading-relaxed">{mod.desc}</p>
                  <Icon className="hidden sm:block w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors justify-self-end" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. DUAL DASHBOARD ── */}
      <section ref={addRef} className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 lg:py-28">
          <div className="mb-16">
            <p className="hp-el hp-s1 font-mono text-xs text-white/35 tracking-widest uppercase mb-4">Access</p>
            <h2 className="hp-el hp-s2 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1] max-w-2xl">
              Two dashboards,<br /><span className="text-white/30">one ledger</span>
            </h2>
            <p className="hp-el hp-s3 mt-6 text-white/45 max-w-xl leading-relaxed text-lg">
              The person at the counter and the person reading the numbers need
              different views of the same data. IMS gives each of them exactly that.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Manager card */}
            <div className="hp-el hp-s4 group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] p-8 lg:p-10 hover:border-white/25 hover:bg-white/[0.055] transition-all">
              <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-white/[0.03] group-hover:bg-white/[0.05] transition-all" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-1">Store Manager</h3>
                <p className="text-white/40 text-sm mb-8">Day-to-day operations</p>
                <ul className="space-y-3.5">
                  {MANAGER_DUTIES.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-white/60 text-sm">
                      <span className="mt-2 w-1 h-1 rounded-full bg-white/40 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setLoginType('manager')}
                  className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors group/btn"
                >
                  Manager login
                  <FiArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Owner card */}
            <div className="hp-el hp-s5 group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] p-8 lg:p-10 hover:border-white/25 hover:bg-white/[0.055] transition-all">
              <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-white/[0.03] group-hover:bg-white/[0.05] transition-all" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-1">Business Owner</h3>
                <p className="text-white/40 text-sm mb-8">Strategy & oversight</p>
                <ul className="space-y-3.5">
                  {OWNER_DUTIES.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-white/60 text-sm">
                      <span className="mt-2 w-1 h-1 rounded-full bg-white/40 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setLoginType('owner')}
                  className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-white/80 transition-colors group/btn"
                >
                  Owner login
                  <FiArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. WORKFLOW ── */}
      <section ref={addRef} className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 lg:py-28">
          <div className="mb-16">
            <p className="hp-el hp-s1 font-mono text-xs text-white/35 tracking-widest uppercase mb-4">Workflow</p>
            <h2 className="hp-el hp-s2 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1]">
              How a day<br /><span className="text-white/30">runs</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WORKFLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className={`hp-el hp-s${i + 1} relative rounded-2xl border border-white/10 bg-white/[0.02] p-8
                              hover:border-white/20 hover:bg-white/[0.04] transition-all`}
                >
                  <span className="font-mono text-5xl font-black text-white/[0.06] absolute top-6 right-7 select-none">
                    {step.n}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 text-white/50" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7. TRUST ── */}
      <section ref={addRef} className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 lg:py-28">
          <div className="mb-16">
            <p className="hp-el hp-s1 font-mono text-xs text-white/35 tracking-widest uppercase mb-4">Infrastructure</p>
            <h2 className="hp-el hp-s2 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1] max-w-xl">
              Built for real<br /><span className="text-white/30">operations</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRUST.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className={`hp-el hp-s${i + 1} rounded-2xl border border-white/10 bg-white/[0.02] p-8
                              hover:border-white/20 hover:bg-white/[0.04] transition-all`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 text-white/50" />
                  </div>
                  <h3 className="font-bold text-lg mb-3">{p.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 8. FINAL CTA ── */}
      <section ref={addRef}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-28 lg:py-36">
          <div className="hp-el hp-s1 text-center max-w-4xl mx-auto">
            <p className="font-mono text-xs text-white/35 tracking-widest uppercase mb-6">Get started</p>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-10">
              Choose a dashboard<br /><span className="text-white/30">to continue.</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setLoginType('owner')}
                className="group inline-flex items-center justify-center gap-2 px-9 py-4 bg-white text-black
                           text-base font-bold rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all"
              >
                Owner dashboard
                <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => setLoginType('manager')}
                className="inline-flex items-center justify-center gap-2 px-9 py-4 border border-white/20
                           text-white text-base font-semibold rounded-xl hover:border-white/50
                           hover:bg-white/5 active:scale-[0.97] transition-all"
              >
                Manager dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-white/10">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs text-white/30 tracking-widest uppercase">
                IMS — Inventory Management System
              </span>
            </div>
            <p className="text-xs text-white/25 font-mono">© 2026 OAKnORE. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
