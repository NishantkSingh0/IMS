import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiLock, FiMail, FiArrowLeft, FiCheckCircle, FiClock, FiShield, FiZap,
  FiPackage, FiShoppingCart, FiBarChart2, FiUsers, FiFileText, FiRepeat,
  FiTruck, FiPrinter, FiDatabase, FiUser, FiBox
} from 'react-icons/fi';

// ---------------------------------------------------------------------------
// Static content — grounded in the product's actual modules (see README)
// ---------------------------------------------------------------------------

const METRICS = [
  { value: '50+', label: 'Products tracked' },
  { value: '100+', label: 'Invoices generated' },
  { value: '15+', label: 'Customers on record' },
  { value: '3 mo', label: 'Sales history modelled' },
];

const LEDGER_ITEMS = [
  {
    code: 'INV-01',
    module: 'Billing & POS',
    desc: 'Build an invoice in seconds, apply GST and discounts automatically, then print or download it as a PDF.',
    icon: FiShoppingCart,
  },
  {
    code: 'INV-02',
    module: 'Inventory Control',
    desc: 'Watch stock levels in real time, set reorder points, and get warned before an item runs out.',
    icon: FiPackage,
  },
  {
    code: 'INV-03',
    module: 'Customer Records',
    desc: 'Keep purchase history and outstanding balances against every customer, automatically.',
    icon: FiUsers,
  },
  {
    code: 'INV-04',
    module: 'Analytics & Reporting',
    desc: 'Revenue, profit, and category-wise sales, broken down without building a spreadsheet.',
    icon: FiBarChart2,
  },
  {
    code: 'INV-05',
    module: 'Staff & Roles',
    desc: 'Give each person only the access their role needs, and see who did what, and when.',
    icon: FiUser,
  },
  {
    code: 'INV-06',
    module: 'Department Transfers',
    desc: 'Move stock between departments and keep a clean, searchable audit trail as it happens.',
    icon: FiRepeat,
  },
];

const MANAGER_DUTIES = [
  'Create invoices and take payment at the counter',
  'Add and adjust products, categories, and suppliers',
  'Record stock in / stock out as it happens',
  'Look up a customer\u2019s history before a sale',
  'Check the day\u2019s sales total without asking anyone',
];

const OWNER_DUTIES = [
  'Read weekly and monthly revenue at a glance',
  'See which products and customers matter most',
  'Add staff and decide exactly what they can touch',
  'Pull GST-ready reports for any date range',
  'Set tax rules, invoice formats, and store settings',
];

const WORKFLOW = [
  { n: '01', title: 'Stock in', desc: 'Receive goods, log supplier and quantity, and the count updates instantly.', icon: FiTruck },
  { n: '02', title: 'Bill & sell', desc: 'Ring up a sale, apply tax and discount, hand over a printed or digital invoice.', icon: FiPrinter },
  { n: '03', title: 'Track', desc: 'Every unit and rupee is logged the moment it moves — nothing waits for a nightly sync.', icon: FiZap },
  { n: '04', title: 'Reconcile', desc: 'Close the day against a report that already matches what\u2019s on the shelf.', icon: FiCheckCircle },
];

const TRUST_POINTS = [
  { title: 'Role-based access', desc: 'Every login is scoped by JWT authentication, so staff only reach what their role permits.', icon: FiShield },
  { title: 'A record that holds up', desc: 'Built on PostgreSQL, so stock and sales history stay consistent even under load.', icon: FiDatabase },
  { title: 'Reports you can hand over', desc: 'Export to CSV, PDF, or Excel for accountants, auditors, or your own records.', icon: FiFileText },
  { title: 'Runs on your terms', desc: 'Deploy it on your own infrastructure or ours \u2014 the data stays yours either way.', icon: FiLock },
];

// ---------------------------------------------------------------------------

const Login = () => {
  const [loginType, setLoginType] = useState(null); // null, 'owner', 'manager'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const sectionRefs = useRef([]);
  sectionRefs.current = [];
  const addSectionRef = (el) => {
    if (el && !sectionRefs.current.includes(el)) sectionRefs.current.push(el);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('ims-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loginType]);

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
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setLoginType(null);
    setEmail('');
    setPassword('');
  };

  // Shared animation styles, injected once
  const AnimationStyles = () => (
    <style>{`
      .ims-item {
        opacity: 0;
        transform: translateY(22px);
        transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .ims-in .ims-item { opacity: 1; transform: translateY(0); }
      .ims-in .ims-d1 { transition-delay: 0.05s; }
      .ims-in .ims-d2 { transition-delay: 0.12s; }
      .ims-in .ims-d3 { transition-delay: 0.19s; }
      .ims-in .ims-d4 { transition-delay: 0.26s; }
      .ims-in .ims-d5 { transition-delay: 0.33s; }
      .ims-in .ims-d6 { transition-delay: 0.40s; }
      @media (prefers-reduced-motion: reduce) {
        .ims-item { transition: none; opacity: 1; transform: none; }
      }
    `}</style>
  );

  // -------------------------------------------------------------------------
  // Landing page — 7 sections
  // -------------------------------------------------------------------------
  if (!loginType) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AnimationStyles />

        {/* 1 — HERO */}
        <section ref={addSectionRef} className="relative border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-24 pb-20 lg:pt-32 lg:pb-28">
            <div className="ims-item ims-d1 inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 mb-10 font-mono text-xs text-white/70">
              System manifest &nbsp;\u2014&nbsp; IMS / 2026
            </div>
            <h1 className="ims-item ims-d2 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] max-w-3xl">
              Every item counted. Every sale logged. Every report ready.
            </h1>
            <p className="ims-item ims-d3 mt-6 text-lg text-white/60 max-w-xl leading-relaxed">
              One platform for inventory, billing, staff, and analytics \u2014 with a
              dashboard built for the counter and another built for the boardroom.
            </p>
            <div className="ims-item ims-d4 mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setLoginType('owner')}
                className="px-7 py-3.5 bg-white text-black font-semibold rounded-md hover:bg-white/90 transition-colors"
              >
                Continue as Owner
              </button>
              <button
                onClick={() => setLoginType('manager')}
                className="px-7 py-3.5 border border-white/30 text-white font-semibold rounded-md hover:border-white hover:bg-white/5 transition-colors"
              >
                Continue as Manager
              </button>
            </div>
          </div>
        </section>

        {/* 2 — LIVE METRICS STRIP */}
        <section ref={addSectionRef} className="bg-white text-black border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-14">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {METRICS.map((m, i) => (
                <div
                  key={m.label}
                  className={`ims-item ims-d${i + 1} py-4 lg:py-0 lg:px-8 ${i > 0 ? 'lg:border-l border-black/10' : ''}`}
                >
                  <div className="font-mono text-3xl sm:text-4xl font-semibold tabular-nums">{m.value}</div>
                  <div className="mt-2 text-sm text-black/55">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 — FEATURE LEDGER */}
        <section ref={addSectionRef} className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 lg:py-24">
            <div className="ims-item flex items-end justify-between flex-wrap gap-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What\u2019s on the manifest</h2>
              <span className="font-mono text-sm text-white/40">6 modules</span>
            </div>

            <div className="border-t border-white/15">
              {LEDGER_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.code}
                    className={`ims-item ims-d${i + 1} group grid grid-cols-1 sm:grid-cols-[100px_260px_1fr_auto] gap-x-6 gap-y-2 items-start py-7 border-b border-white/15`}
                  >
                    <span className="font-mono text-sm text-white/40">{item.code}</span>
                    <h3 className="text-lg font-semibold">{item.module}</h3>
                    <p className="text-white/55 leading-relaxed sm:pr-8">{item.desc}</p>
                    <Icon className="hidden sm:block w-5 h-5 text-white/30 group-hover:text-white/70 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4 — MANAGER VS OWNER */}
        <section ref={addSectionRef} className="bg-white text-black border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 lg:py-24">
            <h2 className="ims-item text-3xl sm:text-4xl font-bold tracking-tight mb-4">Two dashboards, one ledger</h2>
            <p className="ims-item ims-d1 text-black/55 max-w-xl mb-14 leading-relaxed">
              The person at the counter and the person reading the numbers need
              different views of the same data. IMS gives each of them exactly that.
            </p>

            <div className="grid md:grid-cols-2 gap-px bg-black/10 border border-black/10">
              <div className="ims-item ims-d2 bg-white p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-md bg-black flex items-center justify-center">
                    <FiBox className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Store Manager</h3>
                </div>
                <ul className="space-y-4">
                  {MANAGER_DUTIES.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-black/70">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-black/40 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ims-item ims-d3 bg-white p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-md bg-black flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Business Owner</h3>
                </div>
                <ul className="space-y-4">
                  {OWNER_DUTIES.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-black/70">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-black/40 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5 — WORKFLOW */}
        <section ref={addSectionRef} className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 lg:py-24">
            <h2 className="ims-item text-3xl sm:text-4xl font-bold tracking-tight mb-14">How a day runs</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {WORKFLOW.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.n} className={`ims-item ims-d${i + 1}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-mono text-sm text-white/40">{step.n}</span>
                      <Icon className="w-4 h-4 text-white/40" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-white/55 leading-relaxed text-sm">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6 — TRUST / OPERATIONS */}
        <section ref={addSectionRef} className="bg-white text-black border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 lg:py-24">
            <h2 className="ims-item text-3xl sm:text-4xl font-bold tracking-tight mb-14">Built for real operations</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {TRUST_POINTS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className={`ims-item ims-d${i + 1}`}>
                    <Icon className="w-6 h-6 mb-4" />
                    <h3 className="font-semibold mb-2">{p.title}</h3>
                    <p className="text-black/55 text-sm leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7 — FINAL CTA + FOOTER */}
        <section ref={addSectionRef}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-20 lg:pt-24 pb-10">
            <div className="ims-item flex flex-col items-start">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-lg">
                Choose a dashboard to continue.
              </h2>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setLoginType('owner')}
                  className="px-7 py-3.5 bg-white text-black font-semibold rounded-md hover:bg-white/90 transition-colors"
                >
                  Owner login
                </button>
                <button
                  onClick={() => setLoginType('manager')}
                  className="px-7 py-3.5 border border-white/30 text-white font-semibold rounded-md hover:border-white hover:bg-white/5 transition-colors"
                >
                  Manager login
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 sm:px-10 pb-10 pt-8 border-t border-dashed border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-mono text-xs text-white/40">IMS \u2014 Inventory Management System</p>
            <p className="text-xs text-white/40">\u00a9 2026 All rights reserved.</p>
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Login form page
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex bg-black">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-white text-black">
        <div className="max-w-md">
          <div className="w-16 h-16 bg-black rounded-md flex items-center justify-center mb-8">
            {loginType === 'owner' ? (
              <FiUser className="w-8 h-8 text-white" />
            ) : (
              <FiBox className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            {loginType === 'owner' ? 'Owner dashboard' : 'Manager dashboard'}
          </h1>
          <p className="text-black/60 text-lg leading-relaxed">
            {loginType === 'owner'
              ? 'Read the numbers, manage staff, and set the rules the rest of the store runs on.'
              : 'Bill, stock, and serve customers without breaking your stride.'}
          </p>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8">
            {[
              { icon: FiZap, title: 'Fast', desc: 'Built for the counter' },
              { icon: FiShield, title: 'Secure', desc: 'Role-based access' },
              { icon: FiClock, title: '24/7', desc: 'Always available' },
              { icon: FiCheckCircle, title: 'Reliable', desc: 'Consistent records' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <f.icon className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-black/50 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button
            onClick={handleBack}
            className="flex items-center text-white/50 hover:text-white mb-8 transition-colors text-sm"
          >
            <FiArrowLeft className="mr-2" />
            Back to role selection
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {loginType === 'owner' ? 'Owner login' : 'Manager login'}
            </h2>
            <p className="text-white/50 mt-2">
              {loginType === 'owner'
                ? 'Sign in to view business analytics'
                : 'Sign in to manage store operations'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-white/20 rounded-md text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition"
                  placeholder={loginType === 'owner' ? 'owner@business.com' : 'manager@business.com'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-white/20 rounded-md text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition"
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white text-black font-semibold rounded-md hover:bg-white/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-md bg-white/5 border border-white/10">
            <p className="text-sm font-medium text-white mb-2">
              Demo credentials ({loginType === 'owner' ? 'Owner' : 'Manager'})
            </p>
            <div className="text-sm text-white/50 font-mono">
              {loginType === 'owner' ? (
                <>
                  <p>admin@oaknore.in</p>
                  <p>O$1234567890</p>
                </>
              ) : (
                <>
                  <p>harvansh@oaknore.in / inventory@oaknore.in</p>
                  <p>O$1234567890</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;