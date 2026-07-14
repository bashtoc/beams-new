import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import "./App.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useNameEnquiry } from "./hooks/useNameEnquiry";

type PricingItem = {
  id: string;
  type: string;
  code: string;
  label: string;
  description: string | null;
  amount: number;
  currency: string;
  billingPeriod: string;
};

type PricingResponse = {
  setup: PricingItem[];
  hosting: PricingItem[];
  domains: PricingItem[];
};

type WebsiteSample = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  imageUrl: string;
  websiteUrl?: string | null;
};

const FALLBACK_WEBSITE_SAMPLES: WebsiteSample[] = [
  {
    id: "fallback-stords",
    title: "Stords Hair Care Storefront",
    description:
      "A responsive product storefront sample for beauty, hair care, and personal care businesses.",
    category: "E-commerce",
    imageUrl: "/customewebsite.webp",
    websiteUrl: "https://stordslab.com",
  },
];

const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`;
const API_ENV = import.meta.env.VITE_API_ENV || "local";
const LOCAL_API_BASE_URL =
  import.meta.env.VITE_LOCAL_API_BASE_URL || "http://localhost:50001/api";
const PRODUCTION_API_BASE_URL =
  import.meta.env.VITE_PRODUCTION_API_BASE_URL ||
  "https://api.beams.saference.com/api";
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (API_ENV === "local" ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL)
).replace(/\/$/, "");
const REMEMBERED_LOGIN_EMAIL_KEY = "beams_remembered_login_email";
const formatDisplayDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

type OverviewPayment = {
  id: string;
  name: string;
  time: string;
  amount: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  payoutStatus: string;
};

type WebsiteStatusData = {
  domain: string | null;
  status: string;
  rawStatus: string;
  domainStatus?: string;
  uptime: number;
  lastPayment: string | null;
  nextPayment: string | null;
  gracePeriodEndsAt: string | null;
  hostingAmount: number;
  sslActive?: boolean;
  analytics?: {
    weeklyVisits: number;
    pageSpeedMobile: number;
    pageSpeedDesktop: number;
    bounceRate: number;
    avgDurationSeconds: number;
  } | null;
};

type HostingBillingData = {
  lastPaymentAmount: string;
  lastPaymentDate: string;
  nextPaymentDate: string;
  dueAmount: number;
  hasPaidFirstTime?: boolean;
  setupAmount?: number;
  domainAmount?: number;
  hostingAmount?: number;
  domainSuffix?: string;
  history: {
    id: string;
    service: string;
    date: string;
    amount: string;
    method: string;
    status: string;
  }[];
};

type HostingPaymentAccount = {
  paymentId: string;
  amount: number;
  expiresAt: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type OverviewData = {
  totalRevenue: number;
  pendingPayouts: number;
  totalCommission: number;
  totalCustomers: number;
  websiteStatus: string;
  uptime: number;
  website: WebsiteStatusData;
  revenueTimeline: { month: string; amount: number }[];
  recentPayments: OverviewPayment[];
};

type DashboardSettings = {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  transactionPinStatus: string;
  company: {
    businessName: string;
    description: string | null;
    sector: string;
    domain: string;
    isRegistered: boolean;
    primaryColor?: string;
    logoUrl?: string | null;
    webhookUrl?: string;
    whitelistIps?: string;
    withdrawalAccountNumber?: string | null;
    withdrawalAccountName?: string | null;
    withdrawalBankName?: string | null;
    withdrawalBankCode?: string | null;
  } | null;
  virtualAccount: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    status: string;
  } | null;
};

const emptyOverviewData: OverviewData = {
  totalRevenue: 0,
  pendingPayouts: 0,
  totalCommission: 0,
  totalCustomers: 0,
  websiteStatus: "Offline",
  uptime: 0,
  website: {
    domain: null,
    status: "Offline",
    rawStatus: "offline",
    domainStatus: "disconnected",
    uptime: 0,
    lastPayment: null,
    nextPayment: null,
    gracePeriodEndsAt: null,
    hostingAmount: 0,
    sslActive: false,
    analytics: null,
  },
  revenueTimeline: [],
  recentPayments: [],
};

const emptyDashboardSettings: DashboardSettings = {
  email: "",
  firstName: "",
  lastName: "",
  fullName: "Customer",
  transactionPinStatus: "not_set",
  company: null,
  virtualAccount: null,
};

const onlineSteps = [
  [
    "1",
    "Sign up",
    "Create your free Beams account and tell us a bit about your business.",
  ],
  [
    "2",
    "Choose a plan",
    "Select the website package that fits your business needs.",
  ],
  [
    "3",
    "We build your site",
    "Our expert team designs and publishes a stunning, modern website for you.",
  ],
  [
    "4",
    "Start receiving payments",
    "Use your dedicated account number to accept payments directly.",
  ],
];

const projects = [
  {
    category: "Client",
    images: [
      "/customewebsite.webp",
      "/customewebsite.webp",
      "/customewebsite.webp",
    ],
    name: "Custom website",
    number: "01",
  },
  {
    category: "Personal",
    images: [
      "/dedicatedaccount.webp",
      "/dedicatedaccount.webp",
      "/dedicatedaccount.webp",
    ],
    name: "Custom account numbers",
    number: "02",
  },
  {
    category: "Client",
    images: [
      "/analyticsimage.webp",
      "/analyticsimage.webp",
      "/analyticsimage.webp",
    ],
    name: "Analytics",
    number: "03",
  },
  {
    category: "Client",
    images: ["/hostingimage.webp", "/hostingimage.webp", "/hostingimage.webp"],
    name: "Hosting and maintenance",
    number: "04",
  },
];

type FadeInProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

function FadeIn<T extends ElementType = "div">({
  as,
  children,
  className,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  ...props
}: FadeInProps<T>) {
  const Component = useMemo(() => motion.create(as ?? "div"), [as]);

  return (
    <Component
      className={className}
      initial={{ opacity: 0, x, y }}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
      viewport={{ once: true, margin: "50px", amount: 0 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      {...props}
    >
      {children}
    </Component>
  );
}

type AppPage =
  | "home"
  | "pricing"
  | "about"
  | "contact"
  | "guide"
  | "started"
  | "business"
  | "login"
  | "dashboard"
  | "privacy";

function BeamsBrand({
  currentPage,
  onNavigate,
}: {
  currentPage?: AppPage;
  onNavigate?: (page: AppPage) => void;
}) {
  const isLight =
    currentPage === "pricing" ||
    currentPage === "about" ||
    currentPage === "contact" ||
    currentPage === "guide" ||
    currentPage === "started" ||
    currentPage === "business" ||
    currentPage === "login";
  return (
    <a
      className={`group inline-flex items-center gap-3 cursor-pointer transition-colors duration-200 ${
        isLight ? "text-[#0C0C0C]" : "text-[#D7E2EA]"
      }`}
      onClick={(e) => {
        if (onNavigate) {
          e.preventDefault();
          onNavigate("home");
        }
      }}
      aria-label="Beams home"
    >
      <img
        src="/beamswhite.png"
        alt="Beams logo"
        className={`h-11 w-11 object-contain rounded-2xl transition duration-200 group-hover:scale-105 ${
          isLight ? "invert" : ""
        }`}
      />
      <span className="text-xl font-black uppercase tracking-wider sm:text-2xl">
        Beams
      </span>
    </a>
  );
}

function GetStartedButton({
  isLight,
  currentPage,
  onNavigate,
}: {
  isLight?: boolean;
  currentPage?: AppPage;
  onNavigate?: (page: AppPage) => void;
}) {
  const isLoginPage = currentPage === "started" || currentPage === "business";
  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest transition duration-200 hover:-translate-y-0.5 sm:px-6 sm:text-sm cursor-pointer ${
        isLight
          ? "bg-[#0C0C0C] text-[#D7E2EA] hover:bg-[#1C1C1C]"
          : "bg-[#D7E2EA] text-[#0C0C0C] hover:bg-white"
      }`}
      onClick={(e) => {
        e.preventDefault();
        if (isLoginPage && onNavigate) {
          onNavigate("login");
        } else if (onNavigate) {
          onNavigate("started");
        }
      }}
    >
      {isLoginPage ? "Login" : "Get Started"}
    </a>
  );
}

function HeaderSection({
  currentPage,
  onNavigate,
}: {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}) {
  const isLight = currentPage !== "home";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = ["Pricing", "About", "Contact", "Business Guide"];
  const pageMap: Record<string, AppPage> = {
    Pricing: "pricing",
    About: "about",
    Contact: "contact",
    "Business Guide": "guide",
  };

  return (
    <>
      <FadeIn
        as="header"
        className={`z-30 relative grid grid-cols-2 sm:grid-cols-3 items-center gap-6 px-6 py-6 transition-all duration-200 md:px-10 md:py-8 ${
          isLight ? "bg-white text-[#0C0C0C]" : "bg-[#0C0C0C] text-[#D7E2EA]"
        }`}
        y={-20}
      >
        <BeamsBrand currentPage={currentPage} onNavigate={onNavigate} />

        {/* Desktop Navigation */}
        <nav className="hidden items-center justify-self-center gap-4 text-xs font-medium tracking-wider sm:flex md:gap-8 md:text-base lg:text-[1.05rem]">
          {navLinks.map((item) => {
            const targetPage = pageMap[item];
            const isActive = currentPage === targetPage;
            return (
              <a
                className={`whitespace-nowrap transition duration-200 hover:opacity-100 cursor-pointer ${
                  isActive
                    ? isLight
                      ? "text-black font-black"
                      : "text-white font-bold opacity-100"
                    : isLight
                    ? "text-black/60 hover:text-black"
                    : "text-[#D7E2EA]/70 opacity-70"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(targetPage);
                }}
                key={item}
              >
                {item}
              </a>
            );
          })}
        </nav>

        {/* Desktop Get Started / Mobile Hamburger Row */}
        <div className="flex items-center justify-end gap-4 justify-self-end">
          <div className="hidden sm:block">
            <GetStartedButton
              isLight={isLight}
              currentPage={currentPage}
              onNavigate={onNavigate}
            />
          </div>

          {/* Hamburger button visible only below sm breakpoint */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`sm:hidden p-2 rounded-xl border transition focus:outline-none ${
              isLight
                ? "border-slate-200 text-[#0C0C0C] hover:bg-slate-100"
                : "border-slate-200/20 text-[#D7E2EA] hover:bg-slate-200/10"
            }`}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              // Close X Icon
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Hamburger Bars Icon
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            )}
          </button>
        </div>
      </FadeIn>

      {/* Mobile Slide-Down Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`sm:hidden fixed inset-x-0 top-20 z-20 flex flex-col gap-6 border-b px-6 py-8 text-center shadow-2xl ${
              isLight
                ? "border-slate-200 bg-white text-[#0C0C0C]"
                : "border-slate-200/10 bg-[#0C0C0C] text-[#D7E2EA]"
            }`}
          >
            {/* Menu items */}
            <div className="flex flex-col gap-5 text-sm font-bold uppercase tracking-widest">
              {navLinks.map((item) => {
                const targetPage = pageMap[item];
                const isActive = currentPage === targetPage;
                return (
                  <a
                    key={item}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate(targetPage);
                    }}
                    className={`py-2 transition ${
                      isActive
                        ? isLight
                          ? "text-black font-black underline underline-offset-4"
                          : "text-white"
                        : isLight
                        ? "text-slate-500 hover:text-black"
                        : "text-[#D7E2EA]/60 hover:text-white"
                    } cursor-pointer`}
                  >
                    {item}
                  </a>
                );
              })}
            </div>

            {/* Action button inside Mobile menu */}
            <div
              className={`pt-4 flex flex-col gap-3 border-t ${
                isLight ? "border-slate-200" : "border-slate-200/10"
              }`}
            >
              <GetStartedButton
                isLight={isLight}
                currentPage={currentPage}
                onNavigate={(page) => {
                  setMobileMenuOpen(false);
                  onNavigate(page);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function HeroSection({
  onNavigate,
}: {
  onNavigate: (page: AppPage) => void;
}) {
  return (
    <section className="relative flex min-h-screen flex-col overflow-x-clip bg-[#0C0C0C]">
      <div className="relative z-10 flex flex-col items-center px-6 py-16 md:px-10 md:py-20">
        <FadeIn className="mx-auto max-w-6xl text-center" delay={0.15} y={40}>
          <h1 className="text-[clamp(3.35rem,8vw,6rem)] font-black uppercase leading-[0.9] tracking-tight text-white">
            Everything you need to build, scale and run your business
          </h1>
          <p className="mx-auto mt-7 max-w-3xl text-[clamp(1rem,2vw,1.5rem)] font-light uppercase leading-snug tracking-wide text-[#D7E2EA]">
            Custom website, custom account numbers, analytics, hosting and
            maintenance
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <GetStartedButton onNavigate={onNavigate} />
            <a
              className="inline-flex items-center rounded-full border-2 border-[#D7E2EA] px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition duration-200 hover:bg-[#D7E2EA]/10 sm:px-6 sm:text-sm"
              href="#price"
            >
              See Features
            </a>
          </div>
        </FadeIn>

        <FadeIn className="relative mt-16 w-full max-w-5xl" delay={0.35} y={30}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-8 rounded-full bg-[#1D5CA6]/15 blur-3xl"></div>
            <img
              alt="Beams SaaS admin dashboard with payments, analytics, website status, and account number panels"
              className="relative w-full h-auto object-contain"
              draggable="false"
              src="/heroimageb.png"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section
      className="rounded-t-[40px] bg-white px-5 py-20 sm:rounded-t-[50px] sm:px-8 sm:py-24 md:rounded-t-[60px] md:px-10 md:py-32"
      id="price"
    >
      <FadeIn>
        <h2 className="mx-auto mb-16 max-w-[700px] text-center text-[clamp(2rem,4.2vw,60px)] font-black uppercase leading-none tracking-tight text-[#0C0C0C] sm:mb-20 md:mb-24">
          Get your business online in 4 simple steps.
        </h2>
      </FadeIn>
      <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-5">
        {onlineSteps.map(([number, name, description], index) => (
          <FadeIn
            className="flex h-[260px] w-[260px] flex-none flex-col rounded-[28px] bg-white p-6 text-[#0C0C0C] shadow-[0_24px_50px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] lg:h-[280px] lg:w-[280px]"
            delay={index * 0.08}
            key={number}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#06113c] text-xl font-black text-white">
              {number}
            </span>
            <div className="mt-auto">
              <h3 className="text-xl font-black uppercase leading-none text-[#0C0C0C] lg:text-2xl">
                {name}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-[#0C0C0C] lg:text-base">
                {description}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function ProjectsSection() {
  const stackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      className="relative z-10 -mt-10 rounded-t-[40px] bg-[#0C0C0C] px-4 pt-20 pb-12 sm:-mt-12 sm:rounded-t-[50px] sm:px-6 sm:pt-24 md:-mt-14 md:rounded-t-[60px] md:px-8 md:pt-32 md:pb-20"
      id="projects"
    >
      <FadeIn>
        <h2 className="hero-heading mb-16 text-center text-[clamp(3rem,4.2vw,60px)] font-black uppercase leading-none tracking-tight sm:mb-20 md:mb-28">
          Features
        </h2>
      </FadeIn>
      <div
        ref={stackRef}
        className="relative mx-auto max-w-7xl"
        style={{ height: `${projects.length * 100}vh` }}
      >
        <div className="sticky top-24 h-[calc(100vh-6rem)] overflow-hidden">
          {projects.map((project, index) => (
            <ProjectCard
              index={index}
              key={project.number}
              progress={scrollYProgress}
              project={project}
              total={projects.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({
  index,
  progress,
  project,
  total,
}: {
  index: number;
  progress: MotionValue<number>;
  project: (typeof projects)[number];
  total: number;
}) {
  const step = 1 / Math.max(total - 1, 1);
  const start = Math.max(0, (index - 1) * step);
  const end = index * step;
  const motionEnd = Math.max(end, start + 0.001);
  const incomingY = useTransform(progress, [start, motionEnd], ["105%", "0%"]);
  const y = index === 0 ? "0%" : incomingY;
  const numberClass =
    project.number === "01"
      ? "text-[clamp(3rem,4.2vw,60px)] font-semibold"
      : project.number === "04"
      ? "text-[clamp(3rem,4.9vw,70px)] font-black"
      : "text-[clamp(3rem,6.25vw,90px)] font-black";

  return (
    <motion.article
      className="absolute inset-0 overflow-hidden rounded-[40px] border-2 border-[#D7E2EA] bg-[#0C0C0C] p-4 sm:rounded-[50px] sm:p-6 md:rounded-[60px] md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      style={{
        zIndex: (index + 1) * 10,
        y,
      }}
    >
      <div className="mb-6 flex flex-wrap items-center gap-6 text-[#D7E2EA]">
        <span className={`${numberClass} leading-none`}>{project.number}</span>
        <h3 className="text-[clamp(1.8rem,4.2vw,60px)] font-black uppercase leading-none tracking-tight">
          {project.name}
        </h3>
      </div>
      <div className="grid gap-3 md:grid-cols-[0.4fr_0.6fr]">
        <div className="grid gap-3">
          <img
            alt={`${project.name} preview one`}
            className="h-[clamp(130px,16vw,230px)] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
            loading="lazy"
            src={project.images[0]}
          />
          <img
            alt={`${project.name} preview two`}
            className="h-[clamp(160px,22vw,340px)] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
            loading="lazy"
            src={project.images[1]}
          />
        </div>
        <img
          alt={`${project.name} large preview`}
          className="h-full min-h-[360px] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
          loading="lazy"
          src={project.images[2]}
        />
      </div>
    </motion.article>
  );
}

function PricingPage() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
      {/* Background light glow effects */}
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#1D5CA6]/5 blur-3xl"></div>
      <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-96 w-96 rounded-full bg-[#D7E2EA]/5 blur-3xl"></div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <FadeIn className="text-center" delay={0.1}>
          <span className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Pricing Plans
          </span>
          <h1 className="mt-6 text-[clamp(2.5rem,7vw,5rem)] font-black uppercase leading-[0.9] tracking-tight text-[#0C0C0C]">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,2vw,1.3rem)] font-light uppercase leading-snug tracking-wide text-slate-500">
            No contracts, no hidden charges. Just premium infrastructure built
            to scale.
          </p>
        </FadeIn>

        {/* Cards Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {/* Web Hosting */}
          <FadeIn
            className="flex flex-col rounded-2xl bg-white p-8 shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
            delay={0.2}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Web Hosting
            </h3>
            <div className="mt-6 flex items-baseline text-[#0C0C0C]">
              <span className="text-3xl font-black">₦</span>
              <span className="text-6xl font-black tracking-tight">3,000</span>
              <span className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                / month
              </span>
            </div>
            <p className="mt-4 text-xs font-light text-slate-500 leading-relaxed">
              Complete web hosting and maintenance package to keep your business
              running smoothly.
            </p>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <ul className="space-y-3 text-xs font-medium text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  High-speed CDN hosting
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  Free SSL Certificate
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  99.9% Uptime SLA
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  Regular security updates
                </li>
              </ul>
            </div>
          </FadeIn>

          {/* Collections */}
          <FadeIn
            className="flex flex-col rounded-2xl bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border-2 border-[#0C0C0C] relative transition-all duration-300 hover:-translate-y-1.5"
            delay={0.28}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
              Collections
            </h3>
            <div className="mt-6 flex items-baseline text-[#0C0C0C]">
              <span className="text-6xl font-black tracking-tight">1.5%</span>
              <span className="ml-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                on collections
              </span>
            </div>
            <p className="mt-4 text-xs font-light text-slate-500 leading-relaxed">
              Seamless, automated payment collections using custom dedicated
              virtual account numbers.
            </p>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <ul className="space-y-3 text-xs font-medium text-[#0C0C0C]">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  Dedicated virtual accounts
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  Instant settlement webhook
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  1.5% transaction cap fee
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  Developer friendly APIs
                </li>
              </ul>
            </div>
          </FadeIn>

          {/* Transparency */}
          <FadeIn
            className="flex flex-col rounded-2xl bg-white p-8 shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
            delay={0.36}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              No Hidden Fees
            </h3>
            <div className="mt-6 flex items-baseline text-[#0C0C0C]">
              <span className="text-6xl font-black tracking-tight">₦0</span>
              <span className="ml-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                hidden costs
              </span>
            </div>
            <p className="mt-4 text-xs font-light text-slate-500 leading-relaxed">
              No onboarding charges, setup fees, or monthly maintenance
              contracts.
            </p>
            <div className="mt-8 border-t border-slate-100 pt-6">
              <ul className="space-y-3 text-xs font-medium text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  Zero setup fees
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  Zero monthly contract fees
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  Pay only for what you use
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0C0C0C]"></span>
                  Clear billing dashboard
                </li>
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function AboutUsPage() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
      {/* Background light glow effects */}
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#1D5CA6]/5 blur-3xl"></div>
      <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-96 w-96 rounded-full bg-[#D7E2EA]/5 blur-3xl"></div>

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <FadeIn className="text-center" delay={0.1}>
          <span className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            About Beams
          </span>
          <h1 className="mt-6 text-[clamp(2.5rem,7vw,5rem)] font-black uppercase leading-[0.9] tracking-tight text-[#0C0C0C]">
            Safer Intelligence Technology
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,2vw,1.3rem)] font-light uppercase leading-snug tracking-wide text-slate-500">
            Beams is owned and powered by Safer Intelligence Technology --
            building premium digital tools to scale operations.
          </p>
        </FadeIn>

        {/* Content grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <FadeIn
            className="rounded-2xl bg-white p-8 shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
            delay={0.2}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
              Our Mission
            </h3>
            <p className="mt-4 text-xs font-light leading-relaxed text-slate-500">
              At Safer Intelligence Technology, we believe financial operations
              should be frictionless, secure, and fully automated. Beams was
              designed to integrate cleanly into any scale of business, giving
              developers and founders the exact tools they need to run
              collections and hosting like a pro.
            </p>
          </FadeIn>

          <FadeIn
            className="rounded-2xl bg-white p-8 shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
            delay={0.28}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
              Safer Intelligence
            </h3>
            <p className="mt-4 text-xs font-light leading-relaxed text-slate-500">
              Safer Intelligence Technology designs state-of-the-art automation
              and database suites that safeguard transactions and streamline
              operational overhead. Beams is our flagship fintech collection
              system, serving companies globally with bulletproof hosting and
              accounts infrastructure.
            </p>
          </FadeIn>
        </div>

        {/* Core values block */}
        <FadeIn
          className="mt-12 rounded-[32px] border border-slate-100 bg-slate-50 p-8 md:p-12 text-center"
          delay={0.35}
        >
          <h3 className="text-xl font-black uppercase tracking-tight text-[#0C0C0C]">
            Our Core Standards
          </h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <span className="text-base font-bold text-[#0C0C0C] block">
                Security
              </span>
              <p className="mt-2 text-xs font-light text-slate-500">
                Encrypted payment integrations and bank-level protection.
              </p>
            </div>
            <div>
              <span className="text-base font-bold text-[#0C0C0C] block">
                Speed
              </span>
              <p className="mt-2 text-xs font-light text-slate-500">
                Instant webhook settlements and swift hosting CDNs.
              </p>
            </div>
            <div>
              <span className="text-base font-bold text-[#0C0C0C] block">
                Reliability
              </span>
              <p className="mt-2 text-xs font-light text-slate-500">
                99.9% uptime powered by Safer Intelligence networks.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function ContactPage() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
      {/* Background light glow effects */}
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#1D5CA6]/5 blur-3xl"></div>
      <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-96 w-96 rounded-full bg-[#D7E2EA]/5 blur-3xl"></div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <FadeIn className="text-center" delay={0.1}>
          <span className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Contact Us
          </span>
          <h1 className="mt-6 text-[clamp(2.5rem,7vw,5rem)] font-black uppercase leading-[0.9] tracking-tight text-[#0C0C0C]">
            Get In Touch
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,2vw,1.3rem)] font-light uppercase leading-snug tracking-wide text-slate-500">
            Have questions or ready to integrate Beams? Let us know how we can
            support your business.
          </p>
        </FadeIn>

        {/* Cards Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {/* Email Card */}
          <FadeIn
            className="flex flex-col items-center text-center rounded-2xl bg-white p-8 shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
            delay={0.2}
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-[#0C0C0C] border border-slate-100 shadow-sm">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
              Email Us
            </h3>
            <a
              href="mailto:beams@saference.com"
              className="mt-4 text-xs font-medium text-slate-500 hover:text-[#0C0C0C] hover:underline transition"
            >
              beams@saference.com
            </a>
          </FadeIn>

          {/* Phone Card */}
          <FadeIn
            className="flex flex-col items-center text-center rounded-2xl bg-white p-8 shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
            delay={0.28}
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-[#0C0C0C] border border-slate-100 shadow-sm">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
              Call Us
            </h3>
            <a
              href="tel:+2347062466015"
              className="mt-4 text-xs font-medium text-slate-500 hover:text-[#0C0C0C] hover:underline transition"
            >
              +234 706 246 6015
            </a>
          </FadeIn>

          {/* Location Card */}
          <FadeIn
            className="flex flex-col items-center text-center rounded-2xl bg-white p-8 shadow-[0_15px_45px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
            delay={0.36}
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-[#0C0C0C] border border-slate-100 shadow-sm">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
              Visit Us
            </h3>
            <p className="mt-4 text-xs font-medium text-slate-500">
              Lagos, Nigeria
            </p>
          </FadeIn>
        </div>

        {/* Contact Form card */}
        <FadeIn
          className="mt-16 rounded-[32px] border border-slate-100 bg-slate-50 p-8 md:p-12 text-center"
          delay={0.45}
        >
          <h3 className="text-2xl font-black uppercase tracking-tight text-[#0C0C0C]">
            Send a Message
          </h3>
          <form
            className="mt-8 space-y-6 max-w-lg mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-6 sm:grid-cols-2 text-left">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-[#0C0C0C] focus:border-slate-800 focus:outline-none transition shadow-sm"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-[#0C0C0C] focus:border-slate-800 focus:outline-none transition shadow-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            <div className="text-left">
              <label
                htmlFor="contact-message"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-[#0C0C0C] focus:border-slate-800 focus:outline-none transition resize-none shadow-sm"
                placeholder="Write your message here..."
              ></textarea>
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#0C0C0C] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition duration-200 hover:-translate-y-0.5 shadow-sm"
              >
                Send Message
              </button>
            </div>
          </form>
        </FadeIn>
      </div>
    </section>
  );
}

function BusinessGuidePage() {
  const [openSector, setOpenSector] = useState<string | null>(null);
  const [activePreviewProduct, setActivePreviewProduct] = useState<{
    name: string;
    image: string;
    description: string;
  } | null>(null);
  const sectors = [
    {
      title: "Hair Care",
      icon: "💇🏽",
      description:
        "Personal grooming and natural care products enjoy repeat purchases. Research organic and chemical-free recipes.",
      products: [
        {
          name: "Batana Oil",
          image: "/haircare-batana-oil.png",
          description:
            "A rich botanical oil positioned for customers looking for shine, scalp nourishment, and a premium natural hair care routine.",
        },
        {
          name: "Relaxer",
          image: "/haircare-relaxer.png",
          description:
            "A salon-focused smoothing cream for customers who want easier styling, softer texture, and a polished straight-hair finish.",
        },
        {
          name: "Hair Lotion",
          image: "/haircare-lotion.png",
          description:
            "A daily moisturizing lotion for softening dry hair, improving manageability, and supporting repeat purchase habits.",
        },
      ],
    },
    {
      title: "Fashion & Wears",
      icon: "🛍️",
      description:
        "The fashion industry is highly profitable with the right niche. Focus on curating high-quality items with unique brand appeal.",
    },
    {
      title: "Furniture",
      icon: "🪑",
      description:
        "Home aesthetics are more important than ever. Ergonomic and space-saving furniture is in high demand.",
    },
    {
      title: "Body Lotion & Skincare",
      icon: "🧴",
      description:
        "Skincare products are daily essentials. High-quality body lotions and scrubs have massive customer retention.",
    },
    {
      title: "Electronics Accessories",
      icon: "🎧",
      description:
        "Gadget accessories sell fast due to continuous device upgrades. Focus on sleek design and everyday utility.",
    },
    {
      title: "Kitchen & Home",
      icon: "🏠",
      description:
        "Aesthetic and organized homes bring peace of mind. Curate minimal products that organize kitchen and dining spaces.",
    },
  ];

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <FadeIn className="text-center" delay={0.1}>
          <span className="text-xs font-black uppercase tracking-[0.28em] text-[#0C0C0C]/65">
            Research Guide
          </span>
          <h1 className="mt-6 text-[clamp(2.3rem,7vw,4.8rem)] font-black uppercase leading-[0.9] tracking-tight text-[#0C0C0C]">
            Business Guide
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-[clamp(1rem,2vw,1.3rem)] font-light uppercase leading-snug tracking-wide text-[#0C0C0C]/80">
            Planning to start a business? Here is a curated set of products in
            different industries for you to research and start selling.
          </p>
        </FadeIn>

        {/* Sectors Vertical Stack */}
        <div className="mt-16 flex flex-col gap-6 w-full">
          {sectors.map((sector, index) => {
            const isOpen = openSector === sector.title;

            return (
              <FadeIn
                as="button"
                className="w-full flex flex-col rounded-2xl bg-white p-6 text-left shadow-[0_15px_45px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
                delay={index * 0.06}
                key={sector.title}
                onClick={() => setOpenSector(isOpen ? null : sector.title)}
                type="button"
              >
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-50 text-2xl shadow-sm">
                      {sector.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-wider text-[#0C0C0C]">
                        {sector.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 mt-1 max-w-2xl">
                        {sector.description}
                      </p>
                    </div>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0C0C0C] text-xl font-light leading-none text-white shadow-sm transition hover:scale-105">
                    {isOpen ? "-" : "+"}
                  </span>
                </div>

                <div
                  className={`w-full grid transition-all duration-300 ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden w-full">
                    {"products" in sector && sector.products && (
                      <>
                        <div className="grid gap-4 w-full">
                          {sector.products.map((product) => (
                            <div
                              key={product.name}
                              className="grid gap-4 rounded-xl bg-slate-50/50 p-4 sm:grid-cols-[110px_1fr] text-left w-full"
                            >
                              <img
                                alt={`${product.name} product`}
                                className="h-24 w-full rounded-lg object-cover sm:w-24 cursor-zoom-in hover:opacity-90 transition duration-200"
                                loading="lazy"
                                src={product.image}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePreviewProduct(product);
                                }}
                              />
                              <div className="flex flex-col justify-center">
                                <h4 className="text-xs font-black uppercase tracking-wider text-[#0C0C0C]">
                                  {product.name}
                                </h4>
                                <p className="mt-1.5 text-xs font-light leading-relaxed text-slate-500">
                                  {product.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 rounded-2xl bg-white p-5 text-left shadow-[0_14px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100">
                          <h4 className="text-xs font-black uppercase tracking-wider text-[#0C0C0C]">
                            Manufacturer Contact
                          </h4>
                          <p className="mt-2 text-xs font-light leading-relaxed text-slate-500">
                            Interested in these products, custom-made formulas,
                            or private branding? Contact the manufacturer.
                          </p>
                          <div className="mt-4 grid gap-2 text-xs font-bold md:grid-cols-3">
                            <a
                              className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-[#0C0C0C] transition hover:bg-slate-100"
                              href="mailto:sales@oclabotanicals.com"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <span aria-hidden="true">✉️</span>
                              sales@oclabotanicals.com
                            </a>
                            <a
                              className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-[#0C0C0C] transition hover:bg-slate-100"
                              href="tel:+2347014311814"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <span aria-hidden="true">☎️</span>
                              +2347014311814
                            </a>
                            <a
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700 transition hover:bg-emerald-100"
                              href="https://wa.me/2347014311814"
                              onClick={(event) => event.stopPropagation()}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              <svg
                                aria-hidden="true"
                                className="h-4 w-4 fill-current"
                                viewBox="0 0 24 24"
                              >
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 2.7 1.488 4.74 1.49 5.34-.002 9.684-4.35 9.687-9.69.001-2.586-1-5.018-2.827-6.848-1.827-1.83-4.257-2.836-6.843-2.837-5.346 0-9.692 4.347-9.695 9.688-.001 1.9.489 3.09 1.42 4.67l-1.01 3.69 3.828-.997z" />
                              </svg>
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>

      {/* Product Image Zoom Modal Overlay */}
      <AnimatePresence>
        {activePreviewProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePreviewProduct(null)}
            className="fixed inset-0 z-50 bg-[#0C0C0C]/40 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out text-left"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 max-w-md w-full relative overflow-hidden text-center cursor-default"
            >
              <button
                onClick={() => setActivePreviewProduct(null)}
                className="absolute top-6 right-6 bg-slate-100 hover:bg-slate-200 text-[#0C0C0C] h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition z-10"
              >
                ✕
              </button>
              <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 aspect-[4/3] max-h-[260px] w-full">
                <img
                  alt={`${activePreviewProduct.name} preview`}
                  src={activePreviewProduct.image}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="mt-4 text-sm font-black uppercase tracking-wider text-[#0C0C0C] text-center">
                {activePreviewProduct.name}
              </h3>
              <p className="mt-2 text-xs font-light text-slate-500 max-w-sm mx-auto leading-relaxed text-center">
                {activePreviewProduct.description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function GetStartedPage({
  selectedDomain,
  setSelectedDomain,
  onNavigate,
}: {
  selectedDomain: string | null;
  setSelectedDomain: (domain: string | null) => void;
  onNavigate: (
    page:
      | "home"
      | "pricing"
      | "about"
      | "contact"
      | "guide"
      | "started"
      | "business"
      | "login"
      | "dashboard"
  ) => void;
}) {
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [pricingError, setPricingError] = useState("");
  const [websiteSamples, setWebsiteSamples] = useState<WebsiteSample[]>(
    FALLBACK_WEBSITE_SAMPLES
  );

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/pricing`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load pricing.");
        setPricing(data.pricing);
        setPricingError("");
      } catch (err) {
        console.warn("Pricing fetch failed.", err);
        setPricingError("Pricing is unavailable. Please try again shortly.");
      }
    };

    fetchPricing();
  }, [onNavigate]);

  useEffect(() => {
    let isMounted = true;

    const fetchWebsiteSamples = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/website-samples`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load website samples.");
        }

        if (
          isMounted &&
          Array.isArray(data.samples) &&
          data.samples.length > 0
        ) {
          setWebsiteSamples(data.samples);
        }
      } catch (err) {
        console.warn("Website samples fetch failed.", err);
      }
    };

    fetchWebsiteSamples();

    return () => {
      isMounted = false;
    };
  }, []);

  const setupItem = pricing?.setup[0];
  const hostingItem = pricing?.hosting[0];
  const selectedDomainItem = pricing?.domains.find(
    (item) => item.label === selectedDomain
  );
  const totalAmount =
    setupItem && hostingItem && selectedDomainItem
      ? setupItem.amount + hostingItem.amount + selectedDomainItem.amount
      : 0;

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
      {/* Background light glow effects */}
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#1D5CA6]/5 blur-3xl"></div>
      <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-96 w-96 rounded-full bg-[#D7E2EA]/5 blur-3xl"></div>

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <FadeIn className="text-center" delay={0.1}>
          <h1 className="mt-6 text-[clamp(2.2rem,5.5vw,3.8rem)] font-black uppercase leading-[1.1] tracking-tight text-[#0C0C0C]">
            Custom website and every tool you need to power your business
          </h1>
        </FadeIn>

        {/* Welcome message card */}
        <FadeIn
          className="mx-auto mt-10 max-w-3xl p-8 text-center"
          delay={0.18}
        >
          <p className="text-base md:text-lg font-normal leading-relaxed text-slate-800">
            If you are interested in uplifting your existing business to give it
            an online presence with a custom website, receive payments online,
            gain business analytics, web maintenance and hosting, you are in the
            right place.
          </p>
          <p className="mt-6 text-base md:text-lg font-normal leading-relaxed text-slate-800">
            If you are starting a new business, you may want to check out our{" "}
            <a
              onClick={(e) => {
                e.preventDefault();
                onNavigate("guide");
              }}
              className="text-[#0C0C0C] font-black underline cursor-pointer hover:text-slate-900 transition"
            >
              business guide
            </a>{" "}
            to see products and guides to start selling.
          </p>
        </FadeIn>

        {/* Custom Website Samples */}
        <FadeIn className="mt-10" delay={0.22}>
          <div className="flex justify-center mb-4">
            <a
              href={websiteSamples[0]?.websiteUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0C0C0C] hover:bg-slate-100 hover:-translate-y-0.5 transition shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
            >
              Website {websiteSamples.length > 1 ? "Samples" : "Sample"}
            </a>
          </div>
          <div
            className={
              websiteSamples.length > 1
                ? "-mx-6 flex snap-x gap-5 overflow-x-auto px-6 pb-4 md:-mx-10 md:px-10"
                : "mx-auto max-w-2xl"
            }
          >
            {websiteSamples.map((sample) => {
              const sampleCard = (
                <div className="rounded-[24px] bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.09)] ring-1 ring-slate-100 overflow-hidden">
                  <img
                    src={sample.imageUrl}
                    alt={sample.title}
                    loading="lazy"
                    className="w-full h-auto rounded-[18px] object-cover transition duration-300 hover:opacity-95"
                  />
                  {(sample.title || sample.category) && (
                    <div className="flex flex-col gap-1 px-3 py-4 text-left">
                      {sample.category && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {sample.category}
                        </span>
                      )}
                      <h3 className="text-base font-black uppercase text-[#0C0C0C]">
                        {sample.title}
                      </h3>
                      {sample.description && (
                        <p className="text-sm font-normal leading-relaxed text-slate-600">
                          {sample.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );

              const cardClassName =
                websiteSamples.length > 1
                  ? "block w-[82vw] max-w-2xl flex-none snap-center cursor-pointer"
                  : "block cursor-pointer";

              return sample.websiteUrl ? (
                <a
                  key={sample.id}
                  href={sample.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClassName}
                >
                  {sampleCard}
                </a>
              ) : (
                <div key={sample.id} className={cardClassName}>
                  {sampleCard}
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* What you will get Section */}
        <div className="mt-16 text-center">
          <h2 className="text-xl font-black uppercase tracking-wider text-[#0C0C0C]">
            What you will get
          </h2>
          {pricingError && (
            <p className="mx-auto mt-3 max-w-md text-xs font-bold text-rose-500">
              {pricingError}
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Custom Website */}
          <FadeIn
            className="flex flex-col rounded-[32px] bg-white p-8 shadow-[0_28px_80px_rgba(6,17,60,0.1)] ring-1 ring-white/70"
            delay={0.25}
          >
            <h3 className="text-base font-bold uppercase tracking-wider text-[#0C0C0C]/70">
              Custom Website
            </h3>
            <div className="mt-4 flex items-baseline text-[#0C0C0C]">
              <span className="text-2xl font-black">₦</span>
              <span className="text-5xl font-black tracking-tight">
                {setupItem ? setupItem.amount.toLocaleString() : "..."}
              </span>
            </div>
            <p className="mt-3 text-xs font-light text-slate-500 leading-relaxed">
              {setupItem?.description ||
                "One-time setup fee for a responsive, modern website optimized for conversions."}
            </p>
          </FadeIn>

          {/* Hosting */}
          <FadeIn
            className="flex flex-col rounded-[32px] bg-white p-8 shadow-[0_28px_80px_rgba(6,17,60,0.1)] ring-1 ring-white/70"
            delay={0.3}
          >
            <h3 className="text-base font-bold uppercase tracking-wider text-[#0C0C0C]/70">
              Hosting
            </h3>
            <div className="mt-4 flex items-baseline text-[#0C0C0C]">
              <span className="text-2xl font-black">₦</span>
              <span className="text-5xl font-black tracking-tight">
                {hostingItem ? hostingItem.amount.toLocaleString() : "..."}
              </span>
              <span className="ml-1 text-xs font-bold text-slate-500 uppercase">
                / month
              </span>
            </div>
            <p className="mt-3 text-xs font-light text-slate-500 leading-relaxed">
              {hostingItem?.description ||
                "Secure CDN hosting, SSL, analytics integrations, and continuous maintenance."}
            </p>
          </FadeIn>

          {/* Custom Domain */}
          <FadeIn
            className="flex flex-col rounded-[32px] bg-white p-8 shadow-[0_28px_80px_rgba(6,17,60,0.1)] ring-1 ring-white/70"
            delay={0.35}
          >
            <h3 className="text-base font-bold uppercase tracking-wider text-[#0C0C0C]/70">
              Custom Domain
            </h3>
            <span className="text-[10px] font-bold text-amber-600 uppercase mt-1 block">
              Please select your domain:
            </span>

            <div className="mt-4 space-y-2">
              {(pricing?.domains || []).map((item) => {
                const isSelected = selectedDomain === item.label;
                return (
                  <button
                    key={item.code}
                    onClick={() => setSelectedDomain(item.label)}
                    className={`w-full flex justify-between items-center px-4 py-2.5 rounded-2xl border text-xs font-bold transition duration-200 ${
                      isSelected
                        ? "border-slate-800 bg-[#0C0C0C]/5 text-[#0C0C0C]"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-[#0C0C0C]/75"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-slate-800 bg-slate-800 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                        )}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <span>
                      {formatNaira(item.amount)}{" "}
                      <span className="text-[10px] text-slate-400 font-light">
                        / yr
                      </span>
                    </span>
                  </button>
                );
              })}
              {!pricing && !pricingError && (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-400">
                  Loading domain prices...
                </div>
              )}
            </div>
            <p className="mt-4 text-xs font-light text-slate-500 leading-relaxed">
              Renewal rates might differ due to currency fluctuations and first
              time coupon fees.
            </p>
            <div className="mt-auto pt-5">
              <a
                href="https://www.namecheap.com/domains/domain-name-search/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0C0C0C] hover:bg-slate-50 transition"
              >
                Check if your domain is available
              </a>
            </div>
          </FadeIn>
        </div>

        {/* Dynamic Payment Summary Card */}
        {selectedDomain && setupItem && hostingItem && selectedDomainItem && (
          <FadeIn
            className="mx-auto mt-12 w-full max-w-4xl rounded-[32px] bg-white p-6 shadow-[0_28px_90px_rgba(6,17,60,0.12)] ring-1 ring-white/70 md:p-8"
            delay={0.1}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C]/70 text-center mb-6">
              Payment Summary
            </h3>
            <div className="space-y-3 text-sm font-normal text-slate-700">
              <div className="flex justify-between">
                <span>Custom Website Setup (One-time)</span>
                <span className="font-bold text-[#0C0C0C]">
                  {formatNaira(setupItem.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fast CDN Hosting (1st Month)</span>
                <span className="font-bold text-[#0C0C0C]">
                  {formatNaira(hostingItem.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Custom Domain ({selectedDomain})</span>
                <span className="font-bold text-[#0C0C0C]">
                  {formatNaira(selectedDomainItem.amount)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-4 mt-2 flex justify-between text-base font-black text-[#0C0C0C] uppercase tracking-wider">
                <span>Total Amount to Pay</span>
                <span>{formatNaira(totalAmount)}</span>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Buttons Section */}
        <FadeIn
          className="mt-12 flex flex-col items-center justify-center gap-4"
          delay={0.2}
        >
          {(!selectedDomain || !selectedDomainItem) && (
            <span className="text-xs font-bold text-amber-600 animate-pulse tracking-wide">
              * Please select a domain type above to continue
            </span>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
            <a
              href="https://wa.me/2347062466015"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#1FB85A] focus:outline-none"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.97L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.04 2Zm0 18.16h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.25-4.39c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.2 8.2 0 0 1 2.41 5.84c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.16c-.25-.12-1.47-.73-1.7-.81-.23-.08-.4-.12-.57.12-.17.25-.65.81-.8.98-.15.17-.3.19-.55.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.38.11-.5.11-.11.25-.3.37-.45.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.02 2.58.12.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.43.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
              </svg>
              Talk to real human
            </a>

            <button
              onClick={() => {
                if (selectedDomainItem) onNavigate("business");
              }}
              disabled={!selectedDomainItem}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-black uppercase tracking-widest transition duration-200 ${
                selectedDomainItem
                  ? "bg-[#0C0C0C] text-[#D7E2EA] hover:-translate-y-0.5 hover:bg-[#1C1C1C]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function CtaSection({
  onNavigate,
}: {
  onNavigate: (
    page:
      | "home"
      | "pricing"
      | "about"
      | "contact"
      | "guide"
      | "started"
      | "business"
      | "login"
      | "dashboard"
  ) => void;
}) {
  return (
    <section className="relative overflow-hidden bg-white py-24 px-6 text-center border-t border-slate-100 rounded-t-[40px] md:rounded-t-[60px]">
      <div className="relative z-10 mx-auto max-w-4xl">
        <FadeIn>
          <h2 className="text-[clamp(2.2rem,4.2vw,60px)] font-black uppercase leading-[0.9] tracking-tight text-[#0C0C0C]">
            Ready to uplift your business <br className="hidden sm:inline" />
            and bring it online?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xs sm:text-sm font-medium uppercase tracking-wider text-black leading-relaxed">
            Whether you want to launch a brand new venture or modernize your
            existing company, Beams provides the complete stack. Get a custom
            website, virtual payment account numbers, real-time analytics, and
            enterprise hosting in one click.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => onNavigate("started")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0C0C0C] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition duration-200 hover:-translate-y-0.5"
            >
              Get Started Now
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function FooterSection({
  onNavigate,
}: {
  onNavigate?: (page: AppPage) => void;
}) {
  return (
    <footer className="border-t border-[#D7E2EA]/10 bg-[#0C0C0C] px-6 py-16 text-[#D7E2EA] md:px-10 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4 lg:gap-16">
        {/* Brand & Description */}
        <div className="md:col-span-2">
          <BeamsBrand onNavigate={onNavigate} />
          <p className="mt-6 max-w-sm text-sm font-light leading-relaxed text-[#D7E2EA]/70">
            Everything you need to build, scale, and run your business. Custom
            website, custom account numbers, analytics, hosting and maintenance.
          </p>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#D7E2EA]">
            Products
          </h4>
          <ul className="mt-4 space-y-3 text-sm font-light text-[#D7E2EA]/70">
            <li>
              <a href="#projects" className="transition hover:text-white">
                Custom Website
              </a>
            </li>
            <li>
              <a href="#projects" className="transition hover:text-white">
                Account Numbers
              </a>
            </li>
            <li>
              <a href="#projects" className="transition hover:text-white">
                Analytics
              </a>
            </li>
            <li>
              <a href="#projects" className="transition hover:text-white">
                Hosting & Maintenance
              </a>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#D7E2EA]">
            Company
          </h4>
          <ul className="mt-4 space-y-3 text-sm font-light text-[#D7E2EA]/70">
            <li>
              <a
                className="transition hover:text-white cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate("about");
                }}
              >
                About Us
              </a>
            </li>
            <li>
              <a
                className="transition hover:text-white cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate("contact");
                }}
              >
                Contact
              </a>
            </li>
            <li>
              <a
                className="transition hover:text-white cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate("privacy");
                }}
              >
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-[#D7E2EA]/10 pt-8 sm:flex-row">
        <p className="text-xs font-light text-[#D7E2EA]/50">
          &copy; {new Date().getFullYear()} Beams. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/beams_saference?s=11"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="rounded-full border border-[#D7E2EA]/15 p-2 transition hover:bg-[#D7E2EA]/10 hover:text-white"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/beams_saference?igsh=MWk4czNyaTR4bnF4bw%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="rounded-full border border-[#D7E2EA]/15 p-2 transition hover:bg-[#D7E2EA]/10 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>

          <a
            href="https://www.tiktok.com/@beamssaference?_r=1&_t=ZS-97qqLMkJzQC"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="rounded-full border border-[#D7E2EA]/15 p-2 transition hover:bg-[#D7E2EA]/10 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M16.6 5.82c-1.12-.73-1.83-1.95-1.95-3.32h-3.4v13.3a2.84 2.84 0 1 1-2.02-2.72V9.63a6.24 6.24 0 1 0 5.42 6.17V8.96a7.1 7.1 0 0 0 4.16 1.34V6.9a3.8 3.8 0 0 1-2.21-1.08Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

function BusinessInfoPage({
  selectedDomain,
  onNavigate,
}: {
  selectedDomain: string | null;
  onNavigate: (page: AppPage) => void;
}) {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [domainName, setDomainName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0C0C0C");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "personal" | "otp" | "business_form" | "summary" | "paid"
  >("personal");
  const [copied, setCopied] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [bankDetails, setBankDetails] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null>(null);
  const [invoiceTotal, setInvoiceTotal] = useState(19000);
  const [invoiceSetupFee, setInvoiceSetupFee] = useState(5000);
  const [invoiceDomainFee, setInvoiceDomainFee] = useState(16000);
  const [invoiceHostingFee, setInvoiceHostingFee] = useState(3000);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);

  const colorPresets = [
    "#0C0C0C", // Black
    "#1D5CA6", // Beams Blue
    "#0F766E", // Teal
    "#B45309", // Amber
    "#4338CA", // Indigo
    "#BE185D", // Pink
    "#15803D", // Green
  ];

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/pricing`);
        const data = await res.json();
        if (res.ok) {
          setPricing(data.pricing);
        }
      } catch (err) {
        console.warn("Pricing fetch failed on business step.", err);
      }
    };

    fetchPricing();
  }, [onNavigate]);

  const setupItem = pricing?.setup[0];
  const hostingItem = pricing?.hosting[0];
  const selectedDomainItem = pricing?.domains.find(
    (item) => item.label === selectedDomain
  );
  const totalAmount =
    setupItem && hostingItem && selectedDomainItem
      ? setupItem.amount + hostingItem.amount + selectedDomainItem.amount
      : invoiceTotal;
  const maskEmail = (value: string) => {
    const [name = "", domain = ""] = value.split("@");
    if (!name || !domain) return value;

    const visibleName =
      name.length <= 2
        ? `${name[0] || ""}*`
        : `${name.slice(0, 2)}${"*".repeat(Math.min(name.length - 2, 5))}`;
    const [domainName = "", domainSuffix = ""] = domain.split(".");
    const visibleDomain =
      domainName.length <= 2
        ? `${domainName[0] || ""}*`
        : `${domainName.slice(0, 2)}${"*".repeat(
            Math.min(domainName.length - 2, 4)
          )}`;

    return `${visibleName}@${visibleDomain}${
      domainSuffix ? `.${domainSuffix}` : ""
    }`;
  };

  // Synchronize dynamic total amount with default state
  useEffect(() => {
    setInvoiceTotal(totalAmount);
  }, [totalAmount]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedLogoTypes = new Set([
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/svg+xml",
      ]);
      if (!allowedLogoTypes.has(file.type)) {
        setOtpError("Upload a business logo as PNG, JPG, WebP, or SVG.");
        setLogoFile(null);
        setLogoPreview(null);
        e.currentTarget.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setOtpError("Business logo must not be larger than 5MB.");
        setLogoFile(null);
        setLogoPreview(null);
        e.currentTarget.value = "";
        return;
      }

      setOtpError("");
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingOtp(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_BASE_URL}/onboarding/personal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendingOtp(false);
        setCurrentStep("otp");
        if (data.dev_code) {
          console.log(
            `[Beams OTP Sandbox] Dev OTP code generated: ${data.dev_code}`
          );
        }
      } else {
        setSendingOtp(false);
        setOtpError(data.message || "Failed to send verification OTP.");
      }
    } catch (err) {
      console.warn(
        "Backend server offline. Simulating local sandbox OTP code 123456."
      );
      setSendingOtp(false);
      setCurrentStep("otp");
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingOtp(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_BASE_URL}/onboarding/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpInput }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("beams_auth_token", data.token);
        setVerifyingOtp(false);
        setCurrentStep("business_form");
      } else {
        setVerifyingOtp(false);
        setOtpError(data.message || "OTP verification failed.");
      }
    } catch (err) {
      setVerifyingOtp(false);
      if (otpInput === "123456") {
        localStorage.setItem("beams_auth_token", "mock_sandbox_auth_token");
        setCurrentStep("business_form");
      } else {
        setOtpError(
          "Invalid OTP code. Enter 123456 to verify in sandbox mode."
        );
      }
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile) {
      setOtpError("Company logo is required. Please upload a logo.");
      return;
    }
    setSubmittingProfile(true);
    setOtpError("");
    try {
      const token = localStorage.getItem("beams_auth_token");
      const formData = new FormData();
      formData.append("businessName", businessName);
      formData.append("domainPrefix", domainName);
      formData.append("domainSuffix", selectedDomain || ".com");
      formData.append("isRegistered", isRegistered ? "true" : "false");
      formData.append("sector", category);
      formData.append("description", description);
      formData.append("primaryColor", primaryColor);
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      // Save Company Profile Details (Logo to storage)
      const compRes = await fetch(`${API_BASE_URL}/onboarding/company`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!compRes.ok) {
        const errorData = await compRes.json();
        throw new Error(
          errorData.message || "Failed to save company settings."
        );
      }
      const compData = await compRes.json();
      if (compData.logoUrl) {
        setLogoPreview(compData.logoUrl);
      }

      // Next, generate safehaven payment invoice and virtual account number
      if (!setupItem || !hostingItem || !selectedDomainItem) {
        throw new Error(
          "Pricing is unavailable. Please go back and reload pricing."
        );
      }

      const pricingSnapshot = {
        setupCode: setupItem.code,
        setupAmount: setupItem.amount,
        hostingCode: hostingItem.code,
        hostingAmount: hostingItem.amount,
        domainCode: selectedDomainItem.code,
        domainAmount: selectedDomainItem.amount,
        domainSuffix: selectedDomain,
        totalAmount,
      };

      const payRes = await fetch(`${API_BASE_URL}/onboarding/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pricingSnapshot }),
      });

      const payData = await payRes.json();
      if (payRes.ok) {
        setBankDetails({
          bankName: payData.bankDetails.bankName,
          accountNumber: payData.bankDetails.accountNumber,
          accountName: payData.bankDetails.accountName,
        });
        setInvoiceTotal(payData.invoice.totalAmount);
        setInvoiceSetupFee(payData.invoice.setupFee);
        setInvoiceDomainFee(payData.invoice.domainFee);
        setInvoiceHostingFee(payData.invoice.hostingFee);
        setSubmittingProfile(false);
        setCurrentStep("summary");
      } else {
        throw new Error(
          payData.message || "Failed to generate billing address."
        );
      }
    } catch (err: any) {
      console.warn("Profile/payment submission failed.", err.message);
      setOtpError(err.message || "Unable to generate payment invoice.");
      setSubmittingProfile(false);
    }
  };

  const handleCopyAccount = () => {
    const actNumber = bankDetails?.accountNumber || "9038427183";
    navigator.clipboard.writeText(actNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmTransfer = async () => {
    setVerifyingPayment(true);
    const actNumber = bankDetails?.accountNumber || "9038427183";
    try {
      // Direct POST to settlement webhook to notify local backend of transaction success
      await fetch(`${API_BASE_URL}/webhooks/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: actNumber,
          amount: invoiceTotal,
        }),
      });

      setTimeout(() => {
        setVerifyingPayment(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          onNavigate("dashboard");
        }, 1500);
      }, 2000);
    } catch (err) {
      console.warn("Backend offline. Completing sandbox payment simulation.");
      setTimeout(() => {
        setVerifyingPayment(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          onNavigate("dashboard");
        }, 1500);
      }, 2000);
    }
  };

  if (currentStep === "paid") {
    return (
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 py-16 bg-white text-[#0C0C0C]">
        <div className="text-center max-w-md mx-auto">
          {verifyingPayment ? (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full border-4 border-t-slate-800 border-slate-200 animate-spin"></div>
              <h2 className="mt-6 text-xl font-black uppercase tracking-tight text-[#0C0C0C]">
                Verifying Transfer...
              </h2>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Our payment collections API is scanning the bank settlement
                network for your transaction. This will only take a moment.
              </p>
            </div>
          ) : paymentSuccess ? (
            <div className="flex flex-col items-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-black uppercase tracking-tight text-[#0C0C0C]">
                Payment Verified!
              </h2>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Thank you! Your setup fee has been received. Handing over to
                your Beams Dashboard admin portal now...
              </p>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  if (currentStep === "summary") {
    return (
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
        <div className="pointer-events-none absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#1D5CA6]/5 blur-3xl"></div>
        <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-96 w-96 rounded-full bg-[#D7E2EA]/5 blur-3xl"></div>

        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <FadeIn className="text-center" delay={0.1}>
            <span className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
              Order Confirmation
            </span>
            <h1 className="mt-4 text-[clamp(2rem,6vw,4rem)] font-black uppercase leading-[0.9] tracking-tight text-[#0C0C0C]">
              Review & Pay
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-xs font-light text-slate-500 leading-relaxed">
              Verify your custom website setup specifications and make payment
              to provision your server hosting.
            </p>
          </FadeIn>

          <div className="mt-12 grid gap-8 md:grid-cols-[1.2fr_1fr] items-start">
            {/* Summary Details Panel */}
            <FadeIn
              className="rounded-3xl bg-white p-6 md:p-8 shadow-[0_28px_90px_rgba(6,17,60,0.12)] space-y-6"
              delay={0.2}
            >
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#0C0C0C] pb-3">
                  Setup Specifications
                </h3>
                <div className="mt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-[110px_1fr] rounded-2xl bg-white px-3 py-2">
                    <span className="text-slate-400 font-bold uppercase">
                      Client Name
                    </span>
                    <span className="text-[#0C0C0C] font-semibold">
                      {firstName} {lastName}
                    </span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] rounded-2xl bg-white px-3 py-2">
                    <span className="text-slate-400 font-bold uppercase">
                      Email Address
                    </span>
                    <span className="text-[#0C0C0C] font-semibold">
                      {email}
                    </span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] rounded-2xl bg-white px-3 py-2">
                    <span className="text-slate-400 font-bold uppercase">
                      Business Name
                    </span>
                    <span className="text-[#0C0C0C] font-semibold">
                      {businessName}
                    </span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] rounded-2xl bg-white px-3 py-2">
                    <span className="text-slate-400 font-bold uppercase">
                      Domain Suffix
                    </span>
                    <span className="text-[#0C0C0C] font-semibold">
                      {selectedDomain || ".com"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] rounded-2xl bg-white px-3 py-2">
                    <span className="text-slate-400 font-bold uppercase">
                      Chosen URL
                    </span>
                    <span className="text-[#0C0C0C] font-bold lowercase">
                      {domainName
                        ? `${domainName.toLowerCase()}${
                            selectedDomain || ".com"
                          }`
                        : `mybrand${selectedDomain || ".com"}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] rounded-2xl bg-white px-3 py-2">
                    <span className="text-slate-400 font-bold uppercase">
                      Registration
                    </span>
                    <span className="text-[#0C0C0C] font-semibold">
                      {isRegistered
                        ? "Yes (CAC Registered)"
                        : "No (Sole Proprietorship)"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] rounded-2xl bg-white px-3 py-2">
                    <span className="text-slate-400 font-bold uppercase">
                      Sector
                    </span>
                    <span className="text-[#0C0C0C] font-semibold capitalize">
                      {category || "Other"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] rounded-2xl bg-white px-3 py-2 items-center">
                    <span className="text-slate-400 font-bold uppercase">
                      Brand Accent
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="text-[#0C0C0C] font-mono font-bold text-[10px]">
                        {primaryColor}
                      </span>
                    </div>
                  </div>
                  {logoPreview && (
                    <div className="grid grid-cols-[110px_1fr] rounded-2xl bg-white px-3 py-2 items-center">
                      <span className="text-slate-400 font-bold uppercase">
                        Business Logo
                      </span>
                      <img
                        src={logoPreview}
                        alt="Logo summary"
                        className="h-8 max-w-[80px] object-contain rounded border border-slate-100 p-0.5 bg-slate-50"
                      />
                    </div>
                  )}
                  <div className="flex flex-col py-1 text-left">
                    <span className="text-slate-400 font-bold uppercase mb-1">
                      Description
                    </span>
                    <p className="text-slate-600 font-light leading-relaxed bg-white p-3 rounded-xl">
                      {description || "No description added."}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Account Information Panel */}
            <div className="space-y-6">
              {/* Invoice Fee Card */}
              <FadeIn
                className="rounded-3xl bg-white p-6 shadow-[0_28px_90px_rgba(6,17,60,0.12)]"
                delay={0.26}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Total Setup Fee
                </h3>
                <div className="mt-4 flex items-baseline text-[#0C0C0C]">
                  <span className="text-2xl font-black">₦</span>
                  <span className="text-5xl font-black tracking-tight">
                    {invoiceTotal.toLocaleString()}
                  </span>
                </div>
                <div className="mt-6 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Custom Website Setup</span>
                    <span className="font-bold text-[#0C0C0C]">
                      ₦{invoiceSetupFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>
                      Custom Domain Registration ({selectedDomain || ".com"})
                    </span>
                    <span className="font-bold text-[#0C0C0C]">
                      ₦{invoiceDomainFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Hosting & Security (Month 1)</span>
                    <span className="font-bold text-[#0C0C0C]">
                      ₦{invoiceHostingFee.toLocaleString()}
                    </span>
                  </div>
                </div>
              </FadeIn>

              {/* Bank Transfer Details Card */}
              <FadeIn
                className="rounded-3xl bg-white p-6 shadow-[0_28px_90px_rgba(6,17,60,0.12)] text-left relative overflow-hidden"
                delay={0.32}
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0C0C0C]">
                  Virtual Bank Account
                </h3>
                <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                  Make a transfer to this dedicated virtual account details
                  generated by Safer Intelligence collections network.
                </p>

                <div className="mt-5 space-y-4">
                  <div className="bg-slate-50/70 p-4 rounded-2xl shadow-[0_12px_34px_rgba(6,17,60,0.06)] flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        Account Number
                      </span>
                      <span className="text-lg font-black text-[#0C0C0C] tracking-wide">
                        {bankDetails?.accountNumber || "9038427183"}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyAccount}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0C0C0C] text-[10px] font-bold uppercase transition"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50/70 p-3 rounded-xl shadow-[0_10px_24px_rgba(6,17,60,0.05)]">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        Bank Name
                      </span>
                      <span
                        className="font-bold text-[#0C0C0C] mt-0.5 block truncate"
                        title={bankDetails?.bankName || "Providus Bank"}
                      >
                        {bankDetails?.bankName || "Providus Bank"}
                      </span>
                    </div>
                    <div className="bg-slate-50/70 p-3 rounded-xl shadow-[0_10px_24px_rgba(6,17,60,0.05)]">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        Account Name
                      </span>
                      <span
                        className="font-bold text-[#0C0C0C] text-[10px] truncate mt-0.5 block"
                        title={
                          bankDetails?.accountName ||
                          "Pending backend account name"
                        }
                      >
                        {bankDetails?.accountName ||
                          "Pending backend account name"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmTransfer}
                  className="w-full mt-6 py-3.5 rounded-full bg-[#0C0C0C] text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition duration-200 hover:-translate-y-0.5 shadow-sm text-center"
                >
                  I have made the transfer
                </button>

                <button
                  onClick={() => setCurrentStep("business_form")}
                  className="w-full mt-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#0C0C0C] transition"
                >
                  ← Edit Specifications
                </button>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (currentStep === "otp") {
    return (
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
        <div className="pointer-events-none absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#1D5CA6]/5 blur-3xl"></div>
        <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-96 w-96 rounded-full bg-[#D7E2EA]/5 blur-3xl"></div>

        <div className="relative z-10 mx-auto w-full max-w-md">
          <FadeIn className="text-center" delay={0.1}>
            <span className="text-xs font-black uppercase tracking-[0.28em] text-[#0C0C0C]">
              Step 1b of 3
            </span>
            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-[#0C0C0C]">
              Verify Email
            </h1>
            <p className="mt-3 text-xs font-light text-slate-500 leading-relaxed">
              We sent a 6-digit verification code to{" "}
              <span className="font-bold text-[#0C0C0C]">
                {maskEmail(email)}
              </span>
              . Please enter it below to proceed.
            </p>
          </FadeIn>

          <FadeIn
            className="mt-8 rounded-[40px] bg-white p-8 shadow-[0_28px_90px_rgba(6,17,60,0.12)] border border-slate-100 text-center"
            delay={0.2}
          >
            <form className="space-y-6" onSubmit={handleOtpVerify}>
              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0C0C0C] text-center mb-2">
                  6-Digit OTP Code
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  required
                  maxLength={6}
                  placeholder="••••••"
                  value={otpInput}
                  onChange={(e) =>
                    setOtpInput(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full rounded-2xl bg-white px-4 py-3.5 text-center text-2xl font-black tracking-widest text-[#0C0C0C] shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-800/60 transition"
                />
              </div>

              {otpError && (
                <p className="text-xs font-bold text-rose-500">{otpError}</p>
              )}

              <button
                type="submit"
                disabled={verifyingOtp}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0C0C0C] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-[#D7E2EA] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1C1C1C] disabled:bg-slate-100 disabled:text-slate-400"
              >
                {verifyingOtp ? "Verifying OTP..." : "Verify Email"}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep("personal")}
                className="text-[10px] font-bold uppercase text-slate-400 hover:text-[#0C0C0C] block mx-auto transition"
              >
                ← Back to profile setup
              </button>
            </form>
          </FadeIn>
        </div>
      </section>
    );
  }

  if (currentStep === "business_form") {
    return (
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
        <div className="pointer-events-none absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#1D5CA6]/5 blur-3xl"></div>
        <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-96 w-96 rounded-full bg-[#D7E2EA]/5 blur-3xl"></div>

        <div className="relative z-10 mx-auto w-full max-w-3xl">
          <FadeIn className="text-center" delay={0.1}>
            <span className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
              Step 2 of 3
            </span>
            <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-black uppercase leading-[0.9] tracking-tight text-[#0C0C0C]">
              Business Profile
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm font-light text-slate-500 leading-relaxed">
              Configure parameters relating to your custom website storefront
              and domain suffix settings.
            </p>
          </FadeIn>

          <FadeIn
            className="mt-12 rounded-[40px] bg-white/80 p-8 shadow-[0_28px_90px_rgba(6,17,60,0.12)] ring-1 ring-white/70 backdrop-blur-md md:p-12"
            delay={0.2}
          >
            <form className="space-y-8" onSubmit={handleBusinessSubmit}>
              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70">
                  Business Name
                </label>
                <div className="mt-2 rounded-2xl bg-white shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition focus-within:ring-2 focus-within:ring-slate-800/60 font-bold">
                  <input
                    type="text"
                    required
                    placeholder="My Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-transparent px-4 py-3.5 text-sm text-[#0C0C0C] focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Domain Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70">
                  Chosen Domain Name
                </label>
                <div className="mt-2 flex overflow-hidden rounded-2xl bg-white shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition focus-within:ring-2 focus-within:ring-slate-800/60">
                  <input
                    type="text"
                    required
                    placeholder="mybrandname"
                    value={domainName}
                    onChange={(e) => setDomainName(e.target.value)}
                    className="w-full bg-transparent px-4 py-3.5 text-sm text-[#0C0C0C] focus:outline-none font-bold"
                  />
                  <span className="flex items-center bg-slate-100 px-4 py-3.5 text-sm font-bold text-[#0C0C0C]/60 shadow-[-8px_0_18px_rgba(6,17,60,0.05)]">
                    {selectedDomain || ".com"}
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Enter your preferred brand name. Suffix pre-selected from your
                  previous step.
                </p>
              </div>

              {/* Is registered */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70">
                  Is your business registered?
                </label>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsRegistered(true)}
                    className={`flex flex-col items-center justify-center rounded-2xl p-4 shadow-[0_12px_32px_rgba(6,17,60,0.07)] ring-1 transition duration-200 ${
                      isRegistered === true
                        ? "bg-[#0C0C0C]/5 text-[#0C0C0C] ring-slate-800/60"
                        : "bg-white text-slate-600 ring-slate-100 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_16px_38px_rgba(6,17,60,0.1)]"
                    }`}
                  >
                    <span className="text-sm font-bold">Yes</span>
                    <span className="text-[10px] opacity-75 mt-1">
                      CAC / Registered LLC
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRegistered(false)}
                    className={`flex flex-col items-center justify-center rounded-2xl p-4 shadow-[0_12px_32px_rgba(6,17,60,0.07)] ring-1 transition duration-200 ${
                      isRegistered === false
                        ? "bg-[#0C0C0C]/5 text-[#0C0C0C] ring-slate-800/60"
                        : "bg-white text-slate-600 ring-slate-100 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_16px_38px_rgba(6,17,60,0.1)]"
                    }`}
                  >
                    <span className="text-sm font-bold">
                      No / Sole Proprietorship
                    </span>
                    <span className="text-[10px] opacity-75 mt-1">
                      Standard setup
                    </span>
                  </button>
                </div>
              </div>

              {/* Category / Sector */}
              <div>
                <label
                  htmlFor="sector-select"
                  className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70"
                >
                  Business Sector / Category
                </label>
                <select
                  id="sector-select"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-2 w-full cursor-pointer appearance-none rounded-2xl bg-white px-4 py-3.5 text-sm text-[#0C0C0C] shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition focus:outline-none focus:ring-2 focus:ring-slate-800/60"
                >
                  <option value="">Select your sector</option>
                  <option value="fashion">Fashion & Wears</option>
                  <option value="furniture">Furniture & Homeware</option>
                  <option value="haircare">Hair Care & Grooming</option>
                  <option value="bodylotion">Body Lotion & Skincare</option>
                  <option value="electronics">Electronics & Gadgets</option>
                  <option value="other">Other / Custom Services</option>
                </select>
              </div>

              {/* Business Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70">
                  Describe your business
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 w-full resize-none rounded-2xl bg-white px-4 py-3.5 text-sm text-[#0C0C0C] shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition focus:outline-none focus:ring-2 focus:ring-slate-800/60"
                  placeholder="What products do you sell? Describe your target audience and service offering..."
                ></textarea>
              </div>

              {/* Primary Brand Color */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70">
                  Business Primary Color
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPrimaryColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-8 w-8 rounded-full border-2 transition duration-200 relative ${
                        primaryColor === color
                          ? "border-slate-800 scale-110 shadow-sm"
                          : "border-transparent hover:scale-105"
                      }`}
                      aria-label={`Select brand color ${color}`}
                    >
                      {primaryColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs font-medium text-slate-500">
                      Hex:
                    </span>
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-center font-bold text-[#0C0C0C] focus:border-slate-800 focus:outline-none"
                    />
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-7 w-7 rounded-lg cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>
              </div>

              {/* Business Logo Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70">
                  Upload Business Logo
                </label>
                <div className="mt-2 flex items-center gap-6">
                  <div className="relative flex-1 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 transition p-6 text-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <svg
                        className="mx-auto h-8 w-8 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                        />
                      </svg>
                      <p className="text-xs font-medium text-slate-700">
                        Drag logo here or click to browse
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Supports PNG, JPG, or SVG up to 5MB
                      </p>
                    </div>
                  </div>

                  {logoPreview && (
                    <div className="h-20 w-20 rounded-2xl border border-slate-200 bg-white p-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0C0C0C] px-10 py-4 text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition duration-200 hover:-translate-y-0.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {submittingProfile
                    ? "Submitting Profile..."
                    : "Submit & Continue"}
                </button>
              </div>
            </form>
          </FadeIn>
        </div>
      </section>
    );
  }

  // default: currentStep === 'personal'
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#1D5CA6]/5 blur-3xl"></div>
      <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-96 w-96 rounded-full bg-[#D7E2EA]/5 blur-3xl"></div>

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <FadeIn className="text-center" delay={0.1}>
          <span className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Step 1 of 3
          </span>
          <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-black uppercase leading-[0.9] tracking-tight text-[#0C0C0C]">
            Personal Details
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-light text-slate-500 leading-relaxed">
            Provide your basic contact information. We will verify your email
            address before setting up your website profile.
          </p>
        </FadeIn>

        <FadeIn
          className="mt-12 rounded-[40px] bg-white/80 p-8 shadow-[0_28px_90px_rgba(6,17,60,0.12)] ring-1 ring-white/70 backdrop-blur-md md:p-12 max-w-2xl mx-auto"
          delay={0.2}
        >
          <form className="space-y-8" onSubmit={handlePersonalSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70">
                  First Name
                </label>
                <div className="mt-2 rounded-2xl bg-white shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition focus-within:ring-2 focus-within:ring-slate-800/60 font-bold">
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent px-4 py-3.5 text-sm text-[#0C0C0C] focus:outline-none font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70">
                  Last Name
                </label>
                <div className="mt-2 rounded-2xl bg-white shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition focus-within:ring-2 focus-within:ring-slate-800/60 font-bold">
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent px-4 py-3.5 text-sm text-[#0C0C0C] focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70">
                Email Address
              </label>
              <div className="mt-2 rounded-2xl bg-white shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition focus-within:ring-2 focus-within:ring-slate-800/60 font-bold">
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-4 py-3.5 text-sm text-[#0C0C0C] focus:outline-none font-bold"
                />
              </div>
            </div>

            {otpError && (
              <p className="text-xs font-bold text-rose-500 text-center">{otpError}</p>
            )}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0C0C0C] px-10 py-4 text-xs font-black uppercase tracking-widest text-[#D7E2EA] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1C1C1C]"
              >
                {sendingOtp ? "Sending OTP Code..." : "Continue"}
              </button>
            </div>
          </form>
        </FadeIn>
      </div>
    </section>
  );
}

function LoginPage({
  onNavigate,
}: {
  onNavigate: (
    page:
      | "home"
      | "pricing"
      | "about"
      | "contact"
      | "guide"
      | "started"
      | "business"
      | "login"
      | "dashboard"
  ) => void;
}) {
  const [email, setEmail] = useState(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem(REMEMBERED_LOGIN_EMAIL_KEY) || ""
  );
  const [otpCode, setOtpCode] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loginStep, setLoginStep] = useState<"email" | "otp" | "passcode">(
    "email"
  );
  const [passcodeMode, setPasscodeMode] = useState<"set" | "enter">("enter");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loginError, setLoginError] = useState("");

  const maskEmail = (value: string) => {
    const [name = "", domain = ""] = value.split("@");
    if (!name || !domain) return value;
    const [domainName = "", domainSuffix = ""] = domain.split(".");
    const visibleName =
      name.length <= 2
        ? `${name[0] || ""}*`
        : `${name.slice(0, 2)}${"*".repeat(Math.min(name.length - 2, 5))}`;
    const visibleDomain =
      domainName.length <= 2
        ? `${domainName[0] || ""}*`
        : `${domainName.slice(0, 2)}${"*".repeat(
            Math.min(domainName.length - 2, 4)
          )}`;
    return `${visibleName}@${visibleDomain}${
      domainSuffix ? `.${domainSuffix}` : ""
    }`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);
    setIsSubmitting(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(REMEMBERED_LOGIN_EMAIL_KEY, normalizedEmail);
        setIsSubmitting(false);
        setLoginStep("otp");
        if (data.dev_code) {
          console.log(
            `[Beams Login OTP Sandbox] Dev OTP code generated: ${data.dev_code}`
          );
        }
      } else {
        setIsSubmitting(false);
        setLoginError(data.message || "Unable to send verification code.");
      }
    } catch (err) {
      console.warn("Login OTP request failed.", err);
      setIsSubmitting(false);
      setLoginError(
        "Unable to contact the authentication server. Please try again."
      );
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
      setLoginError("Enter the 6-digit verification code sent to your email.");
      return;
    }

    setIsSubmitting(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSubmitting(false);
        setPasscodeMode(
          data.transactionPinStatus === "not_set" ? "set" : "enter"
        );
        setLoginStep("passcode");
      } else {
        setIsSubmitting(false);
        setLoginError(data.message || "OTP verification failed.");
      }
    } catch (err) {
      console.warn("Login OTP verification failed.", err);
      setIsSubmitting(false);
      setLoginError("Unable to verify your code right now. Please try again.");
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(passcode)) {
      setLoginError("Passcode must be exactly 4 digits.");
      return;
    }

    setIsSubmitting(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/passcode/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin: passcode }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("beams_auth_token", data.token);
        setIsSubmitting(false);
        setSuccess(true);
        setTimeout(() => {
          onNavigate("dashboard");
        }, 900);
      } else {
        setIsSubmitting(false);
        setLoginError(data.message || "Passcode verification failed.");
      }
    } catch (err) {
      console.warn("Passcode login failed.", err);
      setIsSubmitting(false);
      setLoginError("Unable to complete login right now. Please try again.");
    }
  };

  const formTitle =
    loginStep === "email"
      ? "Enter Email"
      : loginStep === "otp"
      ? "Verify Email"
      : passcodeMode === "set"
      ? "Set Passcode"
      : "Enter Passcode";
  const formSubtitle =
    loginStep === "email"
      ? "Enter your business email and we will send a secure one-time code."
      : loginStep === "otp"
      ? `We sent a 6-digit code to ${maskEmail(email)}.`
      : passcodeMode === "set"
      ? "Create a 4-digit passcode for future dashboard access."
      : "Enter your 4-digit passcode to open your dashboard.";

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 py-16 md:px-10 md:py-24 bg-white text-[#0C0C0C]">
      {/* Background light glow effects */}
      <div className="pointer-events-none absolute left-[-10%] top-[20%] h-80 w-80 rounded-full bg-[#1D5CA6]/5 blur-3xl"></div>
      <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-96 w-96 rounded-full bg-[#D7E2EA]/5 blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md">
        <FadeIn className="text-center" delay={0.1}>
          <span className="text-xs font-black uppercase tracking-[0.28em] text-[#0C0C0C]/60">
            Secure Access
          </span>
          <h1 className="mt-6 text-4xl font-black uppercase tracking-tight text-[#0C0C0C]">
            Log In
          </h1>
          <p className="mt-3 text-sm font-light text-slate-500 leading-relaxed">
            {formSubtitle}
          </p>
        </FadeIn>

        <FadeIn
          className="mt-8 rounded-[40px] bg-white p-8 shadow-[0_28px_90px_rgba(6,17,60,0.12)] ring-1 ring-white/70 md:p-10"
          delay={0.2}
        >
          {success ? (
            <div className="text-center py-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold uppercase tracking-wider text-[#0C0C0C]">
                Login Successful
              </h3>
              <p className="mt-2 text-xs font-light text-slate-500">
                Redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={
                loginStep === "email"
                  ? handleEmailSubmit
                  : loginStep === "otp"
                  ? handleOtpSubmit
                  : handlePasscodeSubmit
              }
            >
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold text-center">
                  ⚠️ {loginError}
                </div>
              )}

              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  {loginStep === "email"
                    ? "Step 1 of 3"
                    : loginStep === "otp"
                    ? "Step 2 of 3"
                    : "Step 3 of 3"}
                </span>
                <h2 className="mt-2 text-lg font-black uppercase tracking-tight text-[#0C0C0C]">
                  {formTitle}
                </h2>
              </div>

              {loginStep === "email" && (
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-2xl bg-white px-4 py-3.5 text-sm text-[#0C0C0C] shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800/60"
                    placeholder="name@company.com"
                  />
                </div>
              )}

              {loginStep === "otp" && (
                <div>
                  <label
                    htmlFor="login-otp"
                    className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70 text-center"
                  >
                    6-Digit Email Code
                  </label>
                  <input
                    id="login-otp"
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="mt-2 w-full rounded-2xl bg-white px-4 py-3.5 text-center text-2xl font-black tracking-widest text-[#0C0C0C] shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800/60"
                    placeholder="••••••"
                  />
                </div>
              )}

              {loginStep === "passcode" && (
                <div>
                  <label
                    htmlFor="login-passcode"
                    className="block text-xs font-bold uppercase tracking-wider text-[#0C0C0C]/70 text-center"
                  >
                    {passcodeMode === "set"
                      ? "Create 4-Digit Passcode"
                      : "4-Digit Passcode"}
                  </label>
                  <input
                    id="login-passcode"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    pattern="[0-9]*"
                    required
                    maxLength={4}
                    value={passcode}
                    onChange={(e) =>
                      setPasscode(e.target.value.replace(/\D/g, ""))
                    }
                    className="mt-2 w-full rounded-2xl bg-white px-4 py-3.5 text-center text-2xl font-black tracking-widest text-[#0C0C0C] shadow-[0_12px_34px_rgba(6,17,60,0.08)] ring-1 ring-slate-100 transition placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800/60"
                    placeholder="••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0C0C0C] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-[#D7E2EA] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1C1C1C] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Please wait..."
                  : loginStep === "email"
                  ? "Send Code"
                  : loginStep === "otp"
                  ? "Verify Email"
                  : passcodeMode === "set"
                  ? "Set Passcode"
                  : "Enter Dashboard"}
              </button>

              {loginStep !== "email" && (
                <button
                  type="button"
                  onClick={() => {
                    setLoginError("");
                    setPasscode("");
                    setOtpCode("");
                    setLoginStep(loginStep === "passcode" ? "otp" : "email");
                  }}
                  className="w-full text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#0C0C0C] transition"
                >
                  Back
                </button>
              )}

              <div className="text-center pt-4 border-t border-slate-200">
                <span className="text-xs font-light text-slate-500">
                  Don't have an account?{" "}
                </span>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("started");
                  }}
                  className="text-xs font-bold text-[#0C0C0C] hover:underline cursor-pointer"
                >
                  Get Started
                </a>
              </div>
            </form>
          )}
        </FadeIn>
      </div>
    </section>
  );
}

function DashboardPage({
  onNavigate,
}: {
  onNavigate: (page: "home" | "pricing" | "about" | "contact" | "guide" | "started" | "business" | "login" | "dashboard") => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse section from /dashboard/:section
  const pathParts = location.pathname.replace(/^\//, "").split("/");
  const sectionParam = pathParts[1] || "overview";

  // Map URL paths to the original string names
  const sectionMap: Record<string, string> = {
    overview: "Overview",
    wallet: "Wallet",
    payments: "Payments",
    "my-website": "My Website",
    hosting: "Hosting & Maintenance",
    settings: "Settings",
    support: "Support"
  };
  
  const activeDashboardSection = sectionMap[sectionParam] || "Overview";

  const setActiveDashboardSection = (sectionName: string) => {
    // Reverse map from string name to URL path
    const entry = Object.entries(sectionMap).find(([, value]) => value === sectionName);
    const path = entry ? entry[0] : "overview";
    navigate(`/dashboard/${path}`);
  };

  const searchQuery = "";
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [pinError, setPinError] = useState("");
  const [settingPin, setSettingPin] = useState(false);
  const [overviewData, setOverviewData] =
    useState<OverviewData>(emptyOverviewData);
  const [overviewError, setOverviewError] = useState("");
  const [websiteData, setWebsiteData] = useState<WebsiteStatusData>(
    emptyOverviewData.website
  );
  const [hostingBilling, setHostingBilling] = useState<HostingBillingData>({
    lastPaymentAmount: "₦0",
    lastPaymentDate: "N/A",
    nextPaymentDate: "N/A",
    dueAmount: 0,
    hasPaidFirstTime: true,
    setupAmount: 0,
    domainAmount: 0,
    hostingAmount: 0,
    domainSuffix: ".xyz",
    history: [],
  });
  const [dashboardOwnerName, setDashboardOwnerName] = useState("Customer");
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(
    emptyDashboardSettings
  );
  const [settingsCurrentPasscode, setSettingsCurrentPasscode] = useState("");
  const [settingsNewPasscode, setSettingsNewPasscode] = useState("");
  const [settingsConfirmPasscode, setSettingsConfirmPasscode] = useState("");
  const [settingsPasscodeError, setSettingsPasscodeError] = useState("");
  const [settingsPasscodeSuccess, setSettingsPasscodeSuccess] = useState("");
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);
  const [showSettingsPasscodeForm, setShowSettingsPasscodeForm] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<"user_details" | "company_profile" | "withdrawal_details" | "virtual_account" | "passcode_update">("user_details");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [accountStep, setAccountStep] = useState<"form" | "otp" | "processing">(
    "form"
  );
  const [bvnInput, setBvnInput] = useState("");
  const [rcNumberInput, setRcNumberInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [identityId, setIdentityId] = useState("");
  const [accountOtp, setAccountOtp] = useState("");
  const [accountError, setAccountError] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingWithdrawal, setIsEditingWithdrawal] = useState(false);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebhookUrl, setEditWebhookUrl] = useState("");
  const [editWhitelistIps, setEditWhitelistIps] = useState("");
  const [editWithdrawalAccountNumber, setEditWithdrawalAccountNumber] = useState("");
  const [editWithdrawalAccountName, setEditWithdrawalAccountName] = useState("");
  const [editWithdrawalBankCode, setEditWithdrawalBankCode] = useState("");
  const [editWithdrawalBankName, setEditWithdrawalBankName] = useState("");
  const [banksList, setBanksList] = useState<any[]>([]);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companySaveError, setCompanySaveError] = useState("");
  const [companySaveSuccess, setCompanySaveSuccess] = useState("");
  const [showCompanySavePinModal, setShowCompanySavePinModal] = useState(false);
  const [companySavePin, setCompanySavePin] = useState("");

  const { accountName: fetchedAccountName, isLoading: isNameEnquiryLoading, error: nameEnquiryError } = useNameEnquiry(editWithdrawalBankCode, editWithdrawalAccountNumber);

  useEffect(() => {
    if (fetchedAccountName) {
      setEditWithdrawalAccountName(fetchedAccountName);
    }
  }, [fetchedAccountName]);

  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawOtpModalOpen, setWithdrawOtpModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawOtp, setWithdrawOtp] = useState("");
  const [withdrawPin, setWithdrawPin] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Fetch settings when Dashboard mounts to verify PIN configuration status
  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem("beams_auth_token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/user/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDashboardOwnerName(data.fullName || data.email || "Customer");
        setDashboardSettings({
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          fullName: data.fullName || data.email || "Customer",
          transactionPinStatus: data.transactionPinStatus || "not_set",
          company: data.company || null,
          virtualAccount: data.virtualAccount || null,
        });
        if (data.transactionPinStatus === "not_set") {
          setShowPinModal(true);
        }
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("beams_auth_token");
        localStorage.removeItem("beams_sandbox_pin_configured");
        onNavigate("login");
      }
    } catch (err) {
      console.warn(
        "Backend server offline. Setting up mock PIN prompt fallback."
      );
      const sandboxPinSet = localStorage.getItem(
        "beams_sandbox_pin_configured"
      );
      if (!sandboxPinSet) {
        setShowPinModal(true);
      }
    }
  };

  const startEditingCompany = () => {
    setEditBusinessName(dashboardSettings.company?.businessName || "");
    setEditDescription(dashboardSettings.company?.description || "");
    setEditWebhookUrl(dashboardSettings.company?.webhookUrl || "");
    setEditWhitelistIps(dashboardSettings.company?.whitelistIps || "");
    setEditWithdrawalAccountNumber(dashboardSettings.company?.withdrawalAccountNumber || "");
    setEditWithdrawalAccountName(dashboardSettings.company?.withdrawalAccountName || "");
    setEditWithdrawalBankCode(dashboardSettings.company?.withdrawalBankCode || "");
    setEditWithdrawalBankName(dashboardSettings.company?.withdrawalBankName || "");
    setBankSearchTerm(dashboardSettings.company?.withdrawalBankName || "");
    setCompanySaveError("");
    setCompanySaveSuccess("");
    setIsEditingCompany(true);
  };

  const startEditingWithdrawal = () => {
    setEditBusinessName(dashboardSettings.company?.businessName || "");
    setEditDescription(dashboardSettings.company?.description || "");
    setEditWebhookUrl(dashboardSettings.company?.webhookUrl || "");
    setEditWhitelistIps(dashboardSettings.company?.whitelistIps || "");
    setEditWithdrawalAccountNumber(dashboardSettings.company?.withdrawalAccountNumber || "");
    setEditWithdrawalAccountName(dashboardSettings.company?.withdrawalAccountName || "");
    setEditWithdrawalBankCode(dashboardSettings.company?.withdrawalBankCode || "");
    setEditWithdrawalBankName(dashboardSettings.company?.withdrawalBankName || "");
    setBankSearchTerm(dashboardSettings.company?.withdrawalBankName || "");
    setCompanySaveError("");
    setCompanySaveSuccess("");
    setIsEditingWithdrawal(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBusinessName.trim()) {
      setCompanySaveError("Business name is required.");
      return;
    }

    setCompanySaveError("");
    setCompanySavePin("");
    setShowCompanySavePinModal(true);
  };

  const confirmSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(companySavePin)) {
      setCompanySaveError("Passcode must be exactly 4 digits.");
      return;
    }

    setIsSavingCompany(true);
    setCompanySaveError("");
    setCompanySaveSuccess("");

    try {
      const token = localStorage.getItem("beams_auth_token");
      const res = await fetch(`${API_BASE_URL}/user/settings/company`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName: editBusinessName.trim(),
          description: editDescription.trim(),
          webhookUrl: editWebhookUrl.trim(),
          whitelistIps: editWhitelistIps.trim(),
          withdrawalAccountNumber: editWithdrawalAccountNumber.trim(),
          withdrawalAccountName: editWithdrawalAccountName.trim(),
          withdrawalBankCode: editWithdrawalBankCode.trim(),
          withdrawalBankName: editWithdrawalBankName.trim(),
          pin: companySavePin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update company details.");
      }

      setCompanySaveSuccess("Details updated successfully.");
      setDashboardSettings((current) => ({
        ...current,
        company: data.company,
      }));
      setIsEditingCompany(false);
      setIsEditingWithdrawal(false);
      setShowCompanySavePinModal(false);
    } catch (err) {
      setCompanySaveError(
        err instanceof Error ? err.message : "Unable to update company details."
      );
    } finally {
      setIsSavingCompany(false);
      setCompanySavePin("");
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/banks`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBanksList(data.banks || []);
      }
    } catch (err) {
      console.error("Failed to fetch banks", err);
    }
  };

  useEffect(() => {
    fetchUserSettings();
    fetchBanks();
  }, [onNavigate]);

  const handleVerifyBvn = async () => {
    if (!bvnInput || !/^\d{11}$/.test(bvnInput.trim())) {
      setAccountError("Please enter a valid 11-digit BVN.");
      return;
    }
    if (!phoneInput || phoneInput.trim().length < 10) {
      setAccountError("Please enter a valid phone number.");
      return;
    }
    setAccountLoading(true);
    setAccountError("");
    try {
      const token = localStorage.getItem("beams_auth_token");
      const res = await fetch(`${API_BASE_URL}/user/verify-bvn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bvn: bvnInput.trim(),
          phoneNumber: phoneInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIdentityId(data.identityId);
        setAccountStep("otp");
      } else {
        setAccountError(data.message || "BVN verification failed.");
      }
    } catch (err) {
      setAccountError("Server connection failed. Please try again.");
    } finally {
      setAccountLoading(false);
    }
  };

  const handleCreateSubaccount = async () => {
    if (!accountOtp || accountOtp.trim().length < 4) {
      setAccountError("Please enter the OTP sent to your phone.");
      return;
    }
    setAccountLoading(true);
    setAccountError("");
    try {
      const token = localStorage.getItem("beams_auth_token");
      const payload: any = {
        bvn: bvnInput.trim(),
        phoneNumber: phoneInput.trim(),
        identityId,
        otp: accountOtp.trim(),
      };
      
      if (dashboardSettings?.company?.isRegistered) {
        payload.companyRegistrationNumber = rcNumberInput.trim();
      }

      const res = await fetch(`${API_BASE_URL}/user/create-subaccount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchUserSettings();
        // Reset form
        setBvnInput("");
        setPhoneInput("");
        setAccountOtp("");
        setIdentityId("");
        setAccountStep("form");
      } else {
        setAccountError(data.message || "Account creation failed.");
      }
    } catch (err) {
      setAccountError("Server connection failed. Please try again.");
    } finally {
      setAccountLoading(false);
    }
  };
  const fetchWalletDetails = async () => {
    setIsWalletLoading(true);
    try {
      const token = localStorage.getItem("beams_auth_token");
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/dashboard/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWalletBalance(data.balance || "0");
        setWalletTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch wallet details:", error);
    } finally {
      setIsWalletLoading(false);
    }
  };

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem("beams_auth_token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/dashboard/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to load overview.");
        setOverviewData({
          totalRevenue: Number(data.totalRevenue || 0),
          pendingPayouts: Number(data.pendingPayouts || 0),
          totalCommission: Number(data.totalCommission || 0),
          totalCustomers: Number(data.totalCustomers || 0),
          websiteStatus: data.websiteStatus || "Offline",
          uptime: Number(data.uptime || 0),
          website: {
            ...emptyOverviewData.website,
            ...(data.website || {}),
            hostingAmount: Number(data.website?.hostingAmount || 0),
            uptime: Number(data.website?.uptime || data.uptime || 0),
          },
          revenueTimeline: data.revenueTimeline || [],
          recentPayments: data.recentPayments || [],
        });
        if (data.website) {
          setWebsiteData({
            ...emptyOverviewData.website,
            ...data.website,
            hostingAmount: Number(data.website.hostingAmount || 0),
            uptime: Number(data.website.uptime || data.uptime || 0),
          });
        }
        setOverviewError("");
      } catch (err) {
        console.warn("Dashboard overview fetch failed.", err);
        setOverviewError("Unable to load live overview data.");
        setOverviewData(emptyOverviewData);
      }
    };

    fetchOverview();
    fetchWalletDetails();
  }, []);

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError("");

    try {
      const token = localStorage.getItem("beams_auth_token");
      if (!withdrawOtpModalOpen) {
        // Step 1: Request OTP
        const res = await fetch(`${API_BASE_URL}/dashboard/wallet/send-otp`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setWithdrawOtpModalOpen(true);
          setWithdrawError("");
        } else {
          setWithdrawError(data.message || "Failed to send OTP");
        }
      } else {
        // Step 2: Submit withdrawal
        if (!withdrawOtp || !withdrawPin) {
          setWithdrawError("Please enter OTP and Passcode");
          setWithdrawLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/dashboard/wallet/withdraw`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            amount: withdrawAmount,
            otp: withdrawOtp,
            pin: withdrawPin
          })
        });
        const data = await res.json();
        if (data.success) {
          // Reset and close
          setWithdrawModalOpen(false);
          setWithdrawOtpModalOpen(false);
          setWithdrawAmount("");
          setWithdrawOtp("");
          setWithdrawPin("");
          fetchWalletDetails(); // Refresh balance
        } else {
          setWithdrawError(data.message || "Withdrawal failed");
        }
      }
    } catch (err: any) {
      setWithdrawError(err.message || "Something went wrong.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pinCode)) {
      setPinError("Security PIN must be exactly 4 digits.");
      return;
    }

    setSettingPin(true);
    setPinError("");
    try {
      const token = localStorage.getItem("beams_auth_token");
      const res = await fetch(`${API_BASE_URL}/user/set-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin: pinCode }),
      });

      const data = await res.json();
      if (res.ok) {
        setSettingPin(false);
        setShowPinModal(false);
        localStorage.setItem("beams_sandbox_pin_configured", "true");
      } else {
        setSettingPin(false);
        setPinError(data.message || "Failed to save security PIN.");
      }
    } catch (err) {
      console.warn(
        "Backend offline. Simulating local sandbox PIN creation success."
      );
      setSettingPin(false);
      setShowPinModal(false);
      localStorage.setItem("beams_sandbox_pin_configured", "true");
    }
  };
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [hostingPaymentAccount, setHostingPaymentAccount] =
    useState<HostingPaymentAccount | null>(null);
  const [hostingPaymentError, setHostingPaymentError] = useState("");
  const [copiedHostingAccount, setCopiedHostingAccount] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketUrgency, setTicketUrgency] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [txHistory, setTxHistory] = useState<HostingBillingData["history"]>([]);

  const fetchWebsiteData = async () => {
    const token = localStorage.getItem("beams_auth_token");
    if (!token) return;

    const res = await fetch(`${API_BASE_URL}/dashboard/website`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || "Failed to load website status.");
    setWebsiteData({
      ...emptyOverviewData.website,
      ...data,
      hostingAmount: Number(data.hostingAmount || 0),
      uptime: Number(data.uptime || 0),
    });
  };

  const fetchHostingBilling = async () => {
    const token = localStorage.getItem("beams_auth_token");
    if (!token) return;

    const res = await fetch(`${API_BASE_URL}/dashboard/payments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || "Failed to load hosting billing.");
    setHostingBilling({
      lastPaymentAmount: data.lastPaymentAmount || "₦0",
      lastPaymentDate: data.lastPaymentDate || "N/A",
      nextPaymentDate: data.nextPaymentDate || "N/A",
      dueAmount: Number(data.dueAmount || data.website?.hostingAmount || 0),
      hasPaidFirstTime: data.hasPaidFirstTime !== undefined ? data.hasPaidFirstTime : true,
      setupAmount: Number(data.setupAmount || 0),
      domainAmount: Number(data.domainAmount || 0),
      hostingAmount: Number(data.hostingAmount || 0),
      domainSuffix: data.domainSuffix || ".xyz",
      history: data.history || [],
    });
    setTxHistory(data.history || []);
    if (data.website) {
      setWebsiteData((current) => ({
        ...current,
        ...data.website,
        hostingAmount: Number(
          data.website.hostingAmount || current.hostingAmount || 0
        ),
        uptime: Number(data.website.uptime || current.uptime || 0),
      }));
    }
  };

  useEffect(() => {
    const loadHostingLifecycle = async () => {
      try {
        await Promise.all([fetchWebsiteData(), fetchHostingBilling()]);
      } catch (err) {
        console.warn("Website hosting lifecycle fetch failed.", err);
      }
    };

    loadHostingLifecycle();
  }, [activeDashboardSection]);

  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    setHostingPaymentError("");
    setCopiedHostingAccount(false);
    try {
      const token = localStorage.getItem("beams_auth_token");
      const res = await fetch(`${API_BASE_URL}/dashboard/payments/charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Payment account generation failed.");
      setHostingPaymentAccount({
        paymentId: data.paymentId,
        amount: Number(
          data.amount ||
            hostingBilling.dueAmount ||
            websiteData.hostingAmount ||
            0
        ),
        expiresAt: data.expiresAt,
        bankName: data.bankDetails?.bankName || "Safehaven Microfinance Bank",
        accountNumber: data.bankDetails?.accountNumber || "",
        accountName: data.bankDetails?.accountName || "",
      });
    } catch (err) {
      console.warn("Hosting payment failed.", err);
      setHostingPaymentError(
        err instanceof Error
          ? err.message
          : "Unable to generate payment account."
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const openHostingPaymentModal = () => {
    setHostingPaymentAccount(null);
    setHostingPaymentError("");
    setCopiedHostingAccount(false);
    setShowPaymentModal(true);
  };

  const handleCopyHostingAccount = async () => {
    if (!hostingPaymentAccount?.accountNumber) return;
    await navigator.clipboard.writeText(hostingPaymentAccount.accountNumber);
    setCopiedHostingAccount(true);
  };

  const handleSettingsPasscodeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsPasscodeError("");
    setSettingsPasscodeSuccess("");

    if (
      dashboardSettings.transactionPinStatus === "set" &&
      !/^\d{4}$/.test(settingsCurrentPasscode)
    ) {
      setSettingsPasscodeError("Enter your current 4-digit passcode.");
      return;
    }

    if (!/^\d{4}$/.test(settingsNewPasscode)) {
      setSettingsPasscodeError("New passcode must be exactly 4 digits.");
      return;
    }

    if (settingsNewPasscode !== settingsConfirmPasscode) {
      setSettingsPasscodeError("New passcode and confirmation do not match.");
      return;
    }

    setIsUpdatingPasscode(true);
    try {
      const token = localStorage.getItem("beams_auth_token");
      const res = await fetch(`${API_BASE_URL}/user/set-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPin: settingsCurrentPasscode,
          pin: settingsNewPasscode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update passcode.");
      }

      setDashboardSettings((current) => ({
        ...current,
        transactionPinStatus: "set",
      }));
      setSettingsCurrentPasscode("");
      setSettingsNewPasscode("");
      setSettingsConfirmPasscode("");
      setSettingsPasscodeSuccess("Passcode updated successfully.");
      setShowSettingsPasscodeForm(false);
      localStorage.setItem("beams_sandbox_pin_configured", "true");
    } catch (err) {
      setSettingsPasscodeError(
        err instanceof Error
          ? err.message
          : "Unable to update passcode right now."
      );
    } finally {
      setIsUpdatingPasscode(false);
    }
  };

  const filteredPayments = overviewData.recentPayments.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const mainMenuItems = [
    "Wallet",
    "Payments",
    "My Website",
    "Hosting & Maintenance",
    "Settings",
    "Support",
  ];
  const websiteRawStatus = (
    overviewData.website.rawStatus ||
    overviewData.websiteStatus ||
    "offline"
  ).toLowerCase();
  const hasConfirmedHostingPayment = Boolean(overviewData.website.lastPayment);
  const isWebsiteOnline =
    websiteRawStatus === "live" && hasConfirmedHostingPayment;
  const statusUptime = isWebsiteOnline
    ? Number(overviewData.website.uptime || overviewData.uptime || 0)
    : 0;
  const websiteStatusTone = isWebsiteOnline
    ? "text-emerald-600 border-emerald-600"
    : websiteRawStatus === "expired"
    ? "text-amber-600 border-amber-500"
    : "text-red-600 border-red-600";
  const websiteStatusLabel = isWebsiteOnline
    ? "Online"
    : websiteRawStatus === "expired"
    ? "Expired"
    : "Offline";

  const normalizeForSearch = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const searchTarget = normalizeForSearch(bankSearchTerm);
  const filteredBanks = bankSearchTerm.trim() === "" ? banksList : banksList.map(bank => {
    const normName = normalizeForSearch(bank.name);
    const normAliases = (bank.aliases || []).map((a: string) => normalizeForSearch(a));
    
    let score = 0;
    if (normName === searchTarget) score = 100;
    else if (normAliases.includes(searchTarget)) score = 90;
    else if (normName.startsWith(searchTarget)) score = 80;
    else if (normAliases.some((a: string) => a.startsWith(searchTarget))) score = 70;
    else if (normName.includes(searchTarget)) score = 60;
    else if (normAliases.some((a: string) => a.includes(searchTarget))) score = 50;
    
    return { ...bank, score };
  }).filter(b => b.score > 0).sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] text-[#0C0C0C] font-sans antialiased">
      {/* Security PIN Settings setup Prompt Modal Overlay */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-[#0C0C0C]/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 md:p-8 max-w-sm w-full text-center relative animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-2xl mb-4">
              🔒
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0C0C0C]">
              Choose Security PIN
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Please configure a secure 4-digit numerical PIN to authorize
              payments and billing operations.
            </p>

            <form onSubmit={handleSetPin} className="mt-6 space-y-4">
              <div className="flex justify-center">
                <input
                  type="password"
                  required
                  maxLength={4}
                  placeholder="••••"
                  value={pinCode}
                  onChange={(e) =>
                    setPinCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-black tracking-widest text-[#0C0C0C] focus:bg-white focus:border-slate-800 focus:outline-none transition"
                />
              </div>

              {pinError && (
                <p className="text-xs font-bold text-rose-500 mt-1">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                disabled={settingPin}
                className="w-full mt-4 py-3.5 rounded-full bg-[#0C0C0C] text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition duration-200"
              >
                {settingPin ? "Saving Security PIN..." : "Save PIN"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-45 bg-[#0C0C0C]/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between bg-[#131315] text-[#D7E2EA] p-6 transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "md:w-20" : "md:w-64"} w-64 shrink-0`}
      >
        <div>
          {/* Logo & Close/Collapse Trigger Header */}
          <div className="flex items-center justify-between mb-8 gap-2">
            <div className="flex items-center gap-3">
              <img
                src="/beamswhite.png"
                alt="Beams logo"
                className="h-9 w-9 object-contain rounded-xl shrink-0"
              />
              {!sidebarCollapsed && (
                <span className="text-lg font-black uppercase tracking-wider text-white transition-opacity duration-300">
                  Beams
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Collapse/Expand Toggle (Desktop only) */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-slate-400 hover:text-white transition"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path stroke="currentColor" strokeWidth="2" d="M9 3v18" />
                  {sidebarCollapsed ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 10l2 2-2 2"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 14l-2-2 2-2"
                    />
                  )}
                </svg>
              </button>

              {/* Close Button (Mobile only) */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="md:hidden h-7 w-7 flex items-center justify-center rounded-lg bg-zinc-800 text-slate-400 hover:text-white transition"
                title="Close Menu"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Sidebar Menu sections */}
          <nav className="space-y-6">
            <div>
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
                  Main
                </span>
              )}
              <ul className="space-y-1.5 text-xs font-semibold uppercase tracking-wider">
                <li>
                  <a
                    onClick={() => {
                      setActiveDashboardSection("Overview");
                      setMobileSidebarOpen(false);
                    }}
                    className={`flex items-center rounded-xl cursor-pointer transition py-2.5 ${
                      sidebarCollapsed ? "justify-center px-0" : "px-3 gap-3"
                    } ${
                      activeDashboardSection === "Overview"
                        ? "bg-[#27272A] text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                    title="Overview"
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                    {!sidebarCollapsed && <span>Overview</span>}
                  </a>
                </li>
                {mainMenuItems.map((item) => (
                  <li key={item}>
                    <a
                      onClick={() => {
                        setActiveDashboardSection(item);
                        setMobileSidebarOpen(false);
                      }}
                      className={`flex items-center rounded-xl cursor-pointer transition py-2.5 ${
                        sidebarCollapsed ? "justify-center px-0" : "px-3 gap-3"
                      } ${
                        activeDashboardSection === item
                          ? "bg-[#27272A] text-white"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                      title={item}
                    >
                      {item === "My Website" && (
                        <svg
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.657-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.657-9 3-9m-9 9a9 9 0 019-9"
                          />
                        </svg>
                      )}
                      {item === "Payments" && (
                        <svg
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      )}
                      {item === "Hosting & Maintenance" && (
                        <svg
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                          />
                        </svg>
                      )}
                      {item === "Wallet" && (
                        <svg
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      )}
                      {item === "Settings" && (
                        <svg
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                      {item === "Support" && (
                        <svg
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      )}
                      {!sidebarCollapsed && <span>{item}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <a
          onClick={() => setShowLogoutConfirm(true)}
          className={`flex items-center rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 cursor-pointer ${
            sidebarCollapsed ? "justify-center px-0" : "px-3 gap-3"
          }`}
          title="Logout"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!sidebarCollapsed && <span>Logout</span>}
        </a>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar Header */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Trigger (Mobile only) */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#0C0C0C] hover:bg-slate-50 transition"
              title="Open Menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#0C0C0C]">
              {activeDashboardSection}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* User Profile Info */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <img
                src={dashboardSettings?.company?.logoUrl || "/heroimageb.png"}
                alt="Company logo"
                className="h-9 w-9 rounded-full object-cover border border-slate-200"
              />
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-[#0C0C0C] block leading-tight">
                  {dashboardOwnerName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Business Owner
                </span>
              </div>
              <svg
                className="h-4 w-4 text-slate-400 transition group-hover:text-slate-600 hidden sm:block"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
          </div>
        </header>

        {/* Dashboard Panels Grid */}
        <div className="flex-1 p-8 space-y-6">
          {activeDashboardSection === "My Website" && (
            <>
              {/* Traffic & Web Performance KPIs */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Weekly Unique Visits",
                    value: websiteData.analytics ? websiteData.analytics.weeklyVisits.toLocaleString() : "2,540",
                    change: "↑ 15.3%",
                    detail: "vs last week",
                    trend: "M 10 25 Q 30 10 50 20 T 90 5",
                  },
                  {
                    label: "Page Speed Index",
                    value: websiteData.analytics ? `${websiteData.analytics.pageSpeedDesktop}/100` : "99/100",
                    change: "Excellent",
                    detail: websiteData.analytics ? `Mobile: ${websiteData.analytics.pageSpeedMobile}/100` : "Mobile & Desktop",
                    trend: "M 10 25 L 30 20 L 50 10 L 90 5",
                  },
                  {
                    label: "Uptime Reliability",
                    value: websiteData.rawStatus === "live" ? "99.99%" : websiteData.rawStatus === "offline" ? "0%" : "99.98%",
                    change: websiteData.rawStatus === "live" ? "Stable" : "Offline",
                    detail: "Last 30 Days",
                    trend: "M 10 15 L 30 15 L 50 15 L 90 15",
                  },
                  {
                    label: "SEO Visibility Health",
                    value: "95%",
                    change: "Optimized",
                    detail: "Search console",
                    trend: "M 10 28 Q 30 20 50 10 T 90 3",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out flex flex-col justify-between h-36"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {item.label}
                        </span>
                        <span className="text-xl font-black text-[#0C0C0C] mt-1 block">
                          {item.value}
                        </span>
                      </div>
                      <div className="w-12 h-8">
                        {/* Mini Sparkline SVG */}
                        <svg
                          className="w-full h-full overflow-visible"
                          viewBox="0 0 100 30"
                        >
                          <path
                            d={item.trend}
                            fill="none"
                            stroke="#0C0C0C"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-2">
                      {item.change}{" "}
                      <span className="text-slate-400 font-light lowercase">
                        {item.detail}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Domain Details Table */}
              <div className="rounded-[32px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C] mb-4">
                  Domain Configuration
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3">Domain Name</th>
                        <th className="pb-3">Hosting Provider</th>
                        <th className="pb-3">Auto-Renew</th>
                        <th className="pb-3">Next Renewal</th>
                        <th className="pb-3">SSL Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="text-[#0C0C0C] font-semibold">
                        <td className="py-4">
                          {websiteData.domain || "Not configured"}
                        </td>
                        <td className="py-4">Beams CDN Cloud</td>
                        <td className="py-4 text-emerald-600">Enabled</td>
                        <td className="py-4">
                          {formatDisplayDate(websiteData.nextPayment)}
                        </td>
                        <td
                          className={`py-4 ${
                            websiteData.sslActive
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {websiteData.sslActive ? "Active" : "Pending"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeDashboardSection === "Payments" && (
            <>
              {/* Top Payment Info Cards Row */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Last Payment */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Last Payment
                  </span>
                  <span className="text-xl font-black text-[#0C0C0C] block mt-2">
                    {hostingBilling.lastPaymentAmount}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1.5">
                    Paid on {hostingBilling.lastPaymentDate}
                  </span>
                </div>
                {/* Next Payment Date */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Next Payment Date
                  </span>
                  <span className="text-xl font-black text-[#0C0C0C] block mt-2">
                    {hostingBilling.nextPaymentDate}
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold block mt-1.5">
                    Monthly billing cycle
                  </span>
                </div>
                {/* Amount to Pay (Hosting) */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Amount to Pay
                  </span>
                  <span className="text-xl font-black text-[#0C0C0C] block mt-2">
                    {formatNaira(
                      hostingBilling.dueAmount || websiteData.hostingAmount
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1.5">
                    Monthly Hosting Subscription
                  </span>
                </div>
                {/* Total Billing Plan */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Billing Plan
                  </span>
                  <span className="text-xl font-black text-[#0C0C0C] block mt-2">
                    Growth Tier
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1.5">
                    Fast CDN & maintenance
                  </span>
                </div>
              </div>

              {/* Main payments action panel */}
              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                {/* Payment History card */}
                <div className="rounded-[32px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C] mb-6">
                    Payment History
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3">Transaction ID</th>
                          <th className="pb-3">Description</th>
                          <th className="pb-3">Method</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {txHistory.map((tx) => (
                          <tr key={tx.id} className="text-slate-700">
                            <td className="py-4 font-bold text-[#0C0C0C]">
                              {tx.id}
                            </td>
                            <td className="py-4">{tx.service}</td>
                            <td className="py-4 text-slate-400">{tx.method}</td>
                            <td className="py-4">{tx.date}</td>
                            <td className="py-4 font-bold text-[#0C0C0C]">
                              {tx.amount}
                            </td>
                            <td className="py-4">
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Make payment card */}
                <div className="rounded-[32px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out flex flex-col justify-between h-fit min-h-[300px]">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C] mb-2">
                      {hostingBilling.hasPaidFirstTime ? "Hosting Subscription" : "Onboarding Activation"}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold uppercase tracking-wider">
                      {hostingBilling.hasPaidFirstTime ? "Your hosting renewal details:" : "Setup & Service Activation Invoice:"}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-left">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Next Payment Date</span>
                        <span className="mt-0.5 block text-xs font-bold text-[#0C0C0C]">
                          {hostingBilling.hasPaidFirstTime ? (hostingBilling.nextPaymentDate || 'N/A') : "Pending Activation"}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-left">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Next Payment Amount</span>
                        <span className="mt-0.5 block text-xs font-bold text-[#0C0C0C]">
                          {formatNaira(hostingBilling.dueAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-4 space-y-3">
                      {hostingBilling.hasPaidFirstTime ? (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">
                              Fast CDN Hosting
                            </span>
                            <span className="font-bold text-[#0C0C0C]">
                              {formatNaira(hostingBilling.dueAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">
                              Custom Domain ({hostingBilling.domainSuffix || '.xyz'} renewal)
                            </span>
                            <span className="font-bold text-slate-400">
                              Included
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">
                              One-time Website Setup Fee
                            </span>
                            <span className="font-bold text-[#0C0C0C]">
                              {formatNaira(hostingBilling.setupAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">
                              Fast CDN Hosting (1st Month)
                            </span>
                            <span className="font-bold text-[#0C0C0C]">
                              {formatNaira(hostingBilling.hostingAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">
                              Custom Domain ({hostingBilling.domainSuffix || '.xyz'} registration)
                            </span>
                            <span className="font-bold text-[#0C0C0C]">
                              {formatNaira(hostingBilling.domainAmount || 0)}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="border-t border-slate-200 pt-3 flex justify-between text-xs font-bold text-[#0C0C0C]">
                        <span>Total Due Amount</span>
                        <span>
                          {formatNaira(hostingBilling.dueAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={openHostingPaymentModal}
                    className="w-full mt-6 py-3.5 rounded-xl bg-[#0C0C0C] text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition duration-200 hover:-translate-y-0.5"
                  >
                    Pay Now
                  </button>
                </div>
              </div>

              {/* Hosting payment virtual account modal */}
              {showPaymentModal && (
                <div className="fixed inset-0 z-50 bg-[#0C0C0C]/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 md:p-8 max-w-md w-full relative">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      disabled={isProcessingPayment}
                      className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>

                    <h3 className="text-base font-black uppercase tracking-wider text-[#0C0C0C] mb-4">
                      Hosting Payment
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">
                      Generate a dedicated virtual account and transfer the
                      exact amount below. Your website cycle updates after
                      webhook confirmation.
                    </p>

                    {hostingPaymentError && (
                      <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                        {hostingPaymentError}
                      </div>
                    )}

                    {hostingPaymentAccount ? (
                      <div className="space-y-4">
                        <div className="rounded-3xl bg-slate-50 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Amount to Transfer
                          </span>
                          <span className="mt-2 block text-3xl font-black text-[#0C0C0C]">
                            {formatNaira(hostingPaymentAccount.amount)}
                          </span>
                        </div>

                        <div className="grid gap-3">
                          <div className="rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Bank Name
                            </span>
                            <span className="mt-1 block text-sm font-black text-[#0C0C0C]">
                              {hostingPaymentAccount.bankName}
                            </span>
                          </div>
                          <div className="rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  Account Number
                                </span>
                                <span className="mt-1 block text-xl font-black text-[#0C0C0C] tracking-wider">
                                  {hostingPaymentAccount.accountNumber}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={handleCopyHostingAccount}
                                className="rounded-full bg-[#0C0C0C] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white"
                              >
                                {copiedHostingAccount ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Account Name
                            </span>
                            <span className="mt-1 block text-sm font-black text-[#0C0C0C]">
                              {hostingPaymentAccount.accountName}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] leading-relaxed text-slate-500">
                          This account is for this hosting invoice only. Pay the
                          exact amount; status updates automatically after the
                          bank webhook is received.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-3xl bg-slate-50 p-5">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500">
                              Fast CDN Hosting
                            </span>
                            <span className="font-black text-[#0C0C0C]">
                              {formatNaira(
                                hostingBilling.dueAmount ||
                                  websiteData.hostingAmount
                              )}
                            </span>
                          </div>
                          <div className="mt-3 border-t border-slate-200 pt-3 flex justify-between text-xs font-black text-[#0C0C0C]">
                            <span>Total Due Amount</span>
                            <span>
                              {formatNaira(
                                hostingBilling.dueAmount ||
                                  websiteData.hostingAmount
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleProcessPayment}
                          disabled={isProcessingPayment}
                          className="w-full mt-6 py-3.5 rounded-full bg-[#0C0C0C] text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          {isProcessingPayment ? (
                            <>
                              <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-[#D7E2EA]"></span>
                              Generating...
                            </>
                          ) : (
                            "Generate Virtual Account"
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}



          {activeDashboardSection === "Hosting & Maintenance" && (
            <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
              {/* Website Status Card */}
              <div className="rounded-[32px] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out flex flex-col justify-between min-h-[180px]">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hosted Item</span>
                      <h3 className="text-lg font-black text-[#0C0C0C] mt-1">Website Hosting</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      websiteData.rawStatus === "live" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}>
                      {websiteData.status || "Offline"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                    <div>
                      Business web hosting: <span className="text-[#0C0C0C] font-bold">Beams CDN Node</span>
                    </div>
                    <div>
                      Website status: <span className={`font-bold uppercase ${
                        websiteData.rawStatus === "live" ? "text-emerald-600" : "text-rose-600"
                      }`}>{websiteData.status || "Offline"}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Uptime Reliability: <span className="text-emerald-600 font-black">{websiteData.rawStatus === "live" ? "99.99%" : "0.00%"}</span>
                </div>
              </div>

              {/* Domain Status Card */}
              <div className="rounded-[32px] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out flex flex-col justify-between min-h-[180px]">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hosted Item</span>
                      <h3 className="text-lg font-black text-[#0C0C0C] mt-1">Custom Domain</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      websiteData.domainStatus === "connected" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}>
                      {websiteData.domainStatus === "connected" ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                    <div>
                      Custom domain: <span className="text-[#0C0C0C] font-bold">{websiteData.domain || "not-configured.xyz"}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Next Renewal: <span className="text-[#0C0C0C] font-black">{formatDisplayDate(websiteData.nextPayment)}</span>
                </div>
              </div>
            </div>
          )}

          {activeDashboardSection === "Support" && (
            <>
              {/* Top Support KPI Stats Cards Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Active Tickets */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Tickets
                  </span>
                  <span className="text-xl font-black text-[#0C0C0C] block mt-2">
                    0
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1.5">
                    No pending issues ✓
                  </span>
                </div>
                {/* Avg Reply Latency */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Avg Reply Latency
                  </span>
                  <span className="text-xl font-black text-[#0C0C0C] block mt-2">
                    &lt; 15 mins
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1.5">
                    Super responsive
                  </span>
                </div>
                {/* Availability */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Availability Status
                  </span>
                  <span className="text-xl font-black text-emerald-600 block mt-2">
                    24/7 Live
                  </span>
                  <span className="text-[10px] text-slate-400 font-light block mt-1.5">
                    Available holidays & weekends
                  </span>
                </div>
                {/* Assigned Representative */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Success Team
                  </span>
                  <span className="text-xl font-black text-[#0C0C0C] block mt-2">
                    Safer Tech
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1.5">
                    Safer Intelligence Technology
                  </span>
                </div>
              </div>

              {/* Main Content Layout Split */}
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                {/* Ticket Creation Card */}
                <div className="rounded-[32px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out flex flex-col justify-between min-h-[360px]">
                  {ticketSuccess ? (
                    <div className="text-center py-12 max-w-sm mx-auto flex-1 flex flex-col justify-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                        ✓
                      </div>
                      <h4 className="mt-6 text-base font-black uppercase tracking-wider text-[#0C0C0C]">
                        Ticket Submitted
                      </h4>
                      <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                        We have logged your query. A Safer Tech support engineer
                        will review it and reply within 15 minutes.
                      </p>
                      <button
                        onClick={() => {
                          setTicketSubject("");
                          setTicketMessage("");
                          setTicketUrgency("");
                          setTicketSuccess(false);
                        }}
                        className="mt-6 py-2 px-5 rounded-full bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-[#0C0C0C] hover:bg-slate-100 transition animate-pulse"
                      >
                        Write Another Ticket
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setIsSubmittingTicket(true);
                        setTimeout(() => {
                          setIsSubmittingTicket(false);
                          setTicketSuccess(true);
                        }, 1500);
                      }}
                      className="space-y-4 text-left"
                    >
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C] mb-2">
                        Create Support Ticket
                      </h3>

                      <div>
                        <label
                          htmlFor="ticket-subject"
                          className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          Subject
                        </label>
                        <input
                          id="ticket-subject"
                          type="text"
                          required
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="e.g. Request DNS verification"
                          className="mt-1.5 w-full rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-[#0C0C0C] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/60 transition"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="ticket-urgency"
                          className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          Urgency Level
                        </label>
                        <select
                          id="ticket-urgency"
                          required
                          value={ticketUrgency}
                          onChange={(e) => setTicketUrgency(e.target.value)}
                          className="mt-1.5 w-full rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-[#0C0C0C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/60 transition appearance-none cursor-pointer"
                        >
                          <option value="">Select urgency</option>
                          <option value="low">Low (Standard Question)</option>
                          <option value="medium">
                            Medium (Layout Adjustment)
                          </option>
                          <option value="high">
                            High (Service Disruption)
                          </option>
                          <option value="critical">
                            Critical (Payment Issue)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="ticket-message"
                          className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          Describe your query
                        </label>
                        <textarea
                          id="ticket-message"
                          required
                          rows={4}
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="Detail your request here..."
                          className="mt-1.5 w-full rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-[#0C0C0C] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/60 transition resize-none"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingTicket}
                        className="w-full mt-4 py-3 rounded-xl bg-[#0C0C0C] text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition duration-200 flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {isSubmittingTicket
                          ? "Submitting..."
                          : "Submit Support Ticket"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Direct Channels Cards */}
                <div className="rounded-[32px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out flex flex-col justify-between min-h-[360px]">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C] mb-2">
                      Direct Contact Channels
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                      For rapid assistance, connect with our support agents
                      directly via social messaging, email, or telephone.
                    </p>

                    <div className="space-y-4">
                      {/* WhatsApp Channel */}
                      <a
                        href="https://wa.me/2347062466015"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-emerald-50/30 hover:bg-emerald-50/60 transition p-4 rounded-2xl cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💬</span>
                          <div className="text-left">
                            <span className="text-xs font-bold text-emerald-700 block">
                              WhatsApp Chat
                            </span>
                            <span className="text-[9px] text-emerald-600/80 font-medium block mt-0.5">
                              Average reply: Instant
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                          Chat Now →
                        </span>
                      </a>

                      {/* Email & Phone Details list */}
                      <div className="space-y-3.5 text-xs text-left">
                        <div className="bg-slate-50 p-3.5 rounded-2xl flex justify-between items-center">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                              Email Channel
                            </span>
                            <code className="text-[11px] font-bold block mt-0.5 text-[#0C0C0C]">
                              beams@saference.com
                            </code>
                          </div>
                          <a
                            href="mailto:beams@saference.com"
                            className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-800"
                          >
                            Email
                          </a>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl flex justify-between items-center">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase">
                              Telephone Line
                            </span>
                            <code className="text-[11px] font-bold block mt-0.5 text-[#0C0C0C]">
                              +2347062466015
                            </code>
                          </div>
                          <a
                            href="tel:+2347062466015"
                            className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-800"
                          >
                            Call
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-1 text-[10px] font-medium text-slate-400 text-left">
                    <span>
                      Beams is owned by Safer Intelligence Technology.
                    </span>
                    <span>All services are maintained in Lagos, Nigeria.</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeDashboardSection === "Wallet" && (
            <div className="max-w-2xl flex flex-col gap-8">
                <div className="rounded-[32px] bg-[#27272A] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                    <div>
                      <p className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">Available Balance</p>
                      <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                        ₦ {Number(walletBalance).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h2>
                    </div>
                    <div className="mt-8 flex gap-4">
                      <button 
                        onClick={() => {
                          if (!dashboardSettings?.company?.withdrawalAccountNumber) {
                            alert("Please configure your withdrawal bank account in Settings first.");
                            setActiveDashboardSection("Settings");
                            return;
                          }
                          setWithdrawModalOpen(true);
                        }}
                        className="rounded-xl bg-white text-[#27272A] px-6 py-3 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col h-full min-h-[300px]">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C] mb-6">
                    Recent Transactions
                  </h3>
                  {isWalletLoading ? (
                    <div className="flex items-center justify-center flex-1">
                      <svg className="h-8 w-8 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : walletTransactions.length === 0 ? (
                    <div className="flex items-center justify-center flex-1 flex-col opacity-50">
                      <svg className="w-12 h-12 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-slate-500">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {walletTransactions.map((tx: any, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tx.type === "credit" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                              {tx.type === "credit" ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#0C0C0C]">{tx.description || (tx.type === "credit" ? "Deposit" : "Withdrawal")}</p>
                              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                              {tx.type === "credit" ? "+" : "-"} ₦{Number(tx.amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1 inline-block">
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              
              <div className="flex flex-col gap-6">
                <div className="rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C] mb-6">
                    Withdrawal Settings
                  </h3>
                  <div className="rounded-2xl border-2 border-slate-100 p-5 bg-slate-50">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Saved Account</p>
                    {dashboardSettings?.company?.withdrawalAccountNumber ? (
                      <div>
                        <p className="text-base font-bold text-[#0C0C0C] tracking-wide mb-0.5">
                          {dashboardSettings.company.withdrawalAccountNumber}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          {dashboardSettings.company.withdrawalBankName || "Bank Account"}
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#27272A] mt-2 bg-[#27272A]/10 inline-block px-2 py-1 rounded-md">
                          {dashboardSettings.company.withdrawalAccountName}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-slate-500">No account configured</p>
                        <button 
                          onClick={() => setActiveDashboardSection("Settings")}
                          className="mt-3 text-xs font-bold text-[#27272A] hover:underline"
                        >
                          Configure in Settings
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-1 text-[10px] font-medium text-slate-400">
                    <span>
                      Withdrawals are processed instantly via Safehaven Microfinance Bank.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Withdrawal Modal */}
          {withdrawModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#27272A] text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0C0C0C]">Withdraw Funds</h3>
                      <p className="text-xs text-slate-500">
                        {withdrawOtpModalOpen ? "Authenticate to confirm" : "Enter withdrawal amount"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setWithdrawModalOpen(false);
                      setWithdrawOtpModalOpen(false);
                      setWithdrawError("");
                    }}
                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleWithdrawalSubmit} className="space-y-5">
                  {!withdrawOtpModalOpen ? (
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Amount (NGN)
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="0.01"
                        required
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-base font-bold text-[#0C0C0C] outline-none focus:border-[#27272A] focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400"
                        placeholder="e.g. 5000"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Email OTP
                        </label>
                        <input
                          type="text"
                          required
                          value={withdrawOtp}
                          onChange={(e) => setWithdrawOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-center text-xl font-bold tracking-[0.25em] text-[#0C0C0C] outline-none focus:border-[#27272A] focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400 placeholder:tracking-normal"
                          placeholder="000000"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Passcode
                        </label>
                        <input
                          type="password"
                          required
                          value={withdrawPin}
                          onChange={(e) => setWithdrawPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-center text-xl font-bold tracking-[0.5em] text-[#0C0C0C] outline-none focus:border-[#27272A] focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400 placeholder:tracking-normal"
                          placeholder="••••"
                        />
                      </div>
                    </>
                  )}

                  {withdrawError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-600 text-sm font-medium">
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {withdrawError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="w-full rounded-2xl bg-[#27272A] p-4 text-sm font-bold text-white transition-all hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {withdrawLoading ? (
                      <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      withdrawOtpModalOpen ? "Confirm Withdrawal" : "Continue"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

                    {activeDashboardSection === "Settings" && (
            <>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left Sidebar Navigation */}
                <div className="w-full md:w-64 shrink-0">
                  <div className="bg-white overflow-hidden">
                    {([
                      { key: "user_details", label: "User Details", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      )},
                      { key: "company_profile", label: "Company Profile", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" /></svg>
                      )},
                      { key: "withdrawal_details", label: "Withdrawal Details", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                      )},
                      { key: "virtual_account", label: "Virtual Account", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>
                      )},
                      { key: "passcode_update", label: "Passcode Update", icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                      )},
                    ] as const).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSettingsActiveTab(tab.key)}
                        className={`w-full flex items-center gap-3 px-5 py-4 text-left text-sm font-bold transition-all duration-200 ${
                          settingsActiveTab === tab.key
                            ? "bg-black text-white"
                            : "text-slate-400 hover:bg-slate-50/60 hover:text-slate-600"
                        }`}
                      >
                        <span className={settingsActiveTab === tab.key ? "text-white" : "text-slate-400"}>{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Content Panel */}
                <div className="flex-1 min-w-0">
                  {/* User Details Tab */}
                  {settingsActiveTab === "user_details" && (
                    <div className="rounded-[24px] bg-white p-6 md:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
                        User Details
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Profile information attached to this Beams business dashboard.
                      </p>
                      <div className="mt-6 border-t border-slate-100 pt-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Full name</span>
                            <span className="mt-1 block text-sm font-bold text-[#0C0C0C]">{dashboardSettings.fullName}</span>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email address</span>
                            <span className="mt-1 block text-sm font-bold text-[#0C0C0C]">{dashboardSettings.email || "Not available"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Company Profile Tab */}
                  {settingsActiveTab === "company_profile" && (
                    <div className="rounded-[24px] bg-white p-6 md:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
                            Company Profile
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            Business details and settings for your company.
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {dashboardSettings.company && !isEditingCompany && (
                            <button
                              onClick={startEditingCompany}
                              className="rounded-xl bg-[#0C0C0C] px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-[#1C1C1C] transition cursor-pointer"
                            >
                              Edit Company
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 border-t border-slate-100 pt-6">
                        {isEditingCompany ? (
                          <form onSubmit={handleSaveCompany} className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Company Name
                              </label>
                              <input
                                type="text"
                                required
                                value={editBusinessName}
                                onChange={(e) => setEditBusinessName(e.target.value)}
                                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-[#0C0C0C] outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-[#0C0C0C] transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Company Description
                              </label>
                              <textarea
                                rows={3}
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Describe your company services or product offerings..."
                                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-[#0C0C0C] outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-[#0C0C0C] transition resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Webhook URL
                              </label>
                              <input
                                type="url"
                                value={editWebhookUrl}
                                onChange={(e) => setEditWebhookUrl(e.target.value)}
                                placeholder="https://yourdomain.com/webhook"
                                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-[#0C0C0C] outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-[#0C0C0C] transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Whitelist IP Addresses
                              </label>
                              <textarea
                                rows={2}
                                value={editWhitelistIps}
                                onChange={(e) => setEditWhitelistIps(e.target.value)}
                                placeholder="192.168.1.1, 10.0.0.1"
                                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-[#0C0C0C] outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-[#0C0C0C] transition resize-none"
                              />
                              <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
                                Comma-separated IPs allowed for API access.
                              </p>
                            </div>
                            {companySaveError && (
                              <p className="text-xs font-bold text-rose-500">{companySaveError}</p>
                            )}
                            {companySaveSuccess && (
                              <p className="text-xs font-bold text-emerald-600">{companySaveSuccess}</p>
                            )}
                            <div className="flex gap-3 pt-2">
                              <button
                                type="submit"
                                disabled={isSavingCompany}
                                className="flex-1 py-3 rounded-xl bg-[#0C0C0C] text-[10px] font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
                              >
                                {isSavingCompany ? "Saving..." : "Save Changes"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsEditingCompany(false)}
                                disabled={isSavingCompany}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {[
                              ["Business name", dashboardSettings.company?.businessName || "Not configured"],
                              ["Business sector", dashboardSettings.company?.sector || "Not configured"],
                              ["Website domain", dashboardSettings.company?.domain || "Not configured"],
                              ["Registration", dashboardSettings.company?.isRegistered ? "CAC registered" : "Sole proprietor"],
                              ["Webhook URL", dashboardSettings.company?.webhookUrl || "Not configured"],
                              ["Whitelist IPs", dashboardSettings.company?.whitelistIps || "Not configured"],
                              ["Brand Color", dashboardSettings.company?.primaryColor || "Not configured"],
                              ["Company Logo", dashboardSettings.company?.logoUrl || "Not configured"],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3 text-left">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                                <span className="mt-1 flex items-center gap-2 text-sm font-bold text-[#0C0C0C]">
                                  {label === "Brand Color" && value !== "Not configured" && (
                                    <div className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: value as string }} />
                                  )}
                                  {label === "Company Logo" && value !== "Not configured" ? (
                                    <img src={value as string} alt="Company Logo" className="h-6 w-auto max-w-[120px] object-contain rounded" />
                                  ) : (
                                    value
                                  )}
                                </span>
                              </div>
                            ))}
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left sm:col-span-2">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Company Description</span>
                              <span className="mt-1 block text-xs font-semibold leading-relaxed text-slate-600">
                                {dashboardSettings.company?.description || "No description provided."}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Withdrawal Details Tab */}
                  {settingsActiveTab === "withdrawal_details" && (
                    <div className="rounded-[24px] bg-white p-6 md:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
                            Withdrawal Details
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            Bank account used to receive funds from Beams.
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          {dashboardSettings.company && !isEditingWithdrawal && (
                            <button
                              onClick={startEditingWithdrawal}
                              className="rounded-xl bg-[#0C0C0C] px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-[#1C1C1C] transition cursor-pointer"
                            >
                              Edit Details
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 border-t border-slate-100 pt-6">
                        {isEditingWithdrawal ? (
                          <form onSubmit={handleSaveCompany} className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Bank Name
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={bankSearchTerm}
                                  onFocus={() => setShowBankDropdown(true)}
                                  onChange={(e) => {
                                    setBankSearchTerm(e.target.value);
                                    setShowBankDropdown(true);
                                    if (e.target.value !== editWithdrawalBankName) {
                                      setEditWithdrawalBankCode("");
                                      setEditWithdrawalBankName("");
                                    }
                                  }}
                                  placeholder="Search for your bank..."
                                  className="w-full rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-[#0C0C0C] outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-[#0C0C0C] transition capitalize"
                                />
                                {showBankDropdown && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowBankDropdown(false)} />
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] max-h-48 overflow-y-auto">
                                      {filteredBanks.map((bank: any) => (
                                        <div
                                          key={bank.bankCode}
                                          className="px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#0C0C0C] cursor-pointer capitalize transition border-b border-slate-50 last:border-0"
                                          onClick={() => {
                                            setEditWithdrawalBankCode(bank.bankCode);
                                            setEditWithdrawalBankName(bank.name);
                                            setBankSearchTerm(bank.name);
                                            setShowBankDropdown(false);
                                          }}
                                        >
                                          {bank.name}
                                        </div>
                                      ))}
                                      {filteredBanks.length === 0 && (
                                        <div className="px-4 py-3 text-xs font-medium text-slate-500 text-center">
                                          No matching banks found.
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Account Number
                              </label>
                              <input
                                type="text"
                                value={editWithdrawalAccountNumber}
                                onChange={(e) => setEditWithdrawalAccountNumber(e.target.value)}
                                placeholder="10-digit account number"
                                maxLength={10}
                                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-[#0C0C0C] outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-[#0C0C0C] transition"
                              />
                            </div>
                            <div>
                              <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                <span>Account Name</span>
                                {isNameEnquiryLoading && <span className="text-emerald-500 animate-pulse">Verifying...</span>}
                                {nameEnquiryError && <span className="text-rose-500">{nameEnquiryError}</span>}
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={editWithdrawalAccountName}
                                  onChange={(e) => setEditWithdrawalAccountName(e.target.value)}
                                  placeholder={isNameEnquiryLoading ? "Fetching account name..." : "Account name will appear here"}
                                  readOnly
                                  className={`w-full rounded-xl bg-slate-50 pl-4 pr-10 py-3 text-xs font-semibold text-[#0C0C0C] outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-[#0C0C0C] transition cursor-not-allowed ${isNameEnquiryLoading ? 'opacity-50' : 'opacity-80'}`}
                                />
                                {!isNameEnquiryLoading && !nameEnquiryError && editWithdrawalAccountName && (
                                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                      <title>Account Verified</title>
                                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                            {companySaveError && (
                              <p className="text-xs font-bold text-rose-500 mt-4">{companySaveError}</p>
                            )}
                            {companySaveSuccess && (
                              <p className="text-xs font-bold text-emerald-600 mt-4">{companySaveSuccess}</p>
                            )}
                            <div className="flex gap-3 pt-2">
                              <button
                                type="submit"
                                disabled={isSavingCompany}
                                className="flex-1 py-3 rounded-xl bg-[#0C0C0C] text-[10px] font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
                              >
                                {isSavingCompany ? "Saving..." : "Save Details"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsEditingWithdrawal(false)}
                                disabled={isSavingCompany}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Bank Name</span>
                              <span className="mt-1 block text-sm font-bold text-[#0C0C0C] capitalize">{dashboardSettings.company?.withdrawalBankName || "Not configured"}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Number</span>
                              <span className="mt-1 block text-sm font-bold text-[#0C0C0C]">{dashboardSettings.company?.withdrawalAccountNumber || "Not configured"}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left sm:col-span-2">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Name</span>
                              <span className="mt-1 block text-sm font-bold text-[#0C0C0C]">{dashboardSettings.company?.withdrawalAccountName || "Not configured"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Virtual Account Tab */}
                  {settingsActiveTab === "virtual_account" && (
                    <div className="rounded-[24px] bg-white p-6 md:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
                            Custom Account Number
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            Customers pay into this account from your website. Beams records each payment and deducts 1.5%.
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                          dashboardSettings.virtualAccount
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-50 text-slate-500"
                        }`}>
                          {dashboardSettings.virtualAccount ? dashboardSettings.virtualAccount.status : "Inactive"}
                        </span>
                      </div>

                      <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
                        {dashboardSettings.virtualAccount ? (
                          <>
                            <div className="rounded-3xl bg-[#0C0C0C] p-5 text-left text-[#D7E2EA] shadow-[0_20px_60px_rgba(6,17,60,0.16)]">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#D7E2EA]/55">
                                Account number
                              </span>
                              <span className="mt-2 block text-3xl font-black tracking-tight select-all">
                                {dashboardSettings.virtualAccount.accountNumber}
                              </span>
                              <div className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
                                <div>
                                  <span className="block text-[9px] font-bold uppercase tracking-wider text-[#D7E2EA]/45">Bank</span>
                                  <span className="mt-1 block font-bold">{dashboardSettings.virtualAccount.bankName}</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] font-bold uppercase tracking-wider text-[#D7E2EA]/45">Account name</span>
                                  <span className="mt-1 block font-bold">{dashboardSettings.virtualAccount.accountName}</span>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium leading-relaxed text-slate-500">
                              This is your permanent virtual account. Customers pay into this account and funds are processed automatically.
                            </div>
                          </>
                        ) : (
                          <div className="rounded-3xl bg-slate-50 p-6 text-left border border-dashed border-slate-200">
                            {accountStep === "form" && (
                              <>
                                <div className="text-center mb-5">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl mb-3">🏦</div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0C0C0C]">Generate Virtual Account</h4>
                                  <p className="mt-1 text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                                    Verify your identity with your BVN to create a permanent virtual account for receiving business payments.
                                  </p>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                      BVN (Bank Verification Number)
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      maxLength={11}
                                      value={bvnInput}
                                      onChange={(e) => {
                                        setBvnInput(e.target.value.replace(/D/g, ""));
                                        setAccountError("");
                                      }}
                                      placeholder="Enter 11-digit BVN"
                                      className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#0C0C0C] placeholder-slate-300 outline-none ring-1 ring-slate-200 focus:ring-[#0C0C0C] transition"
                                    />
                                  </div>
                                  {dashboardSettings?.company?.isRegistered && (
                                    <div>
                                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Company Registration Number (RC/BN)
                                      </label>
                                      <input
                                        type="text"
                                        value={rcNumberInput}
                                        onChange={(e) => setRcNumberInput(e.target.value)}
                                        className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#0C0C0C] placeholder:text-xs placeholder:text-slate-300 outline-none ring-1 ring-slate-200 focus:ring-[#0C0C0C] transition"
                                        placeholder="Enter RC or BN Number"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                      Phone Number
                                    </label>
                                    <input
                                      type="tel"
                                      value={phoneInput}
                                      onChange={(e) => {
                                        setPhoneInput(e.target.value);
                                        setAccountError("");
                                      }}
                                      placeholder="08012345678"
                                      className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#0C0C0C] placeholder-slate-300 outline-none ring-1 ring-slate-200 focus:ring-[#0C0C0C] transition"
                                    />
                                  </div>
                                </div>
                                {accountError && (
                                  <p className="mt-3 text-xs font-bold text-rose-500">{accountError}</p>
                                )}
                                <button
                                  type="button"
                                  onClick={handleVerifyBvn}
                                  disabled={accountLoading}
                                  className="mt-5 w-full py-3.5 rounded-xl bg-[#0C0C0C] text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition duration-200 disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                  {accountLoading ? "Verifying BVN..." : "Verify BVN"}
                                </button>
                              </>
                            )}
                            {accountStep === "otp" && (
                              <>
                                <div className="text-center mb-5">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl mb-3">✅</div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0C0C0C]">BVN Verified</h4>
                                  <p className="mt-1 text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                                    An OTP has been sent to your registered phone number. Enter it below to create your virtual account.
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">OTP Code</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={accountOtp}
                                    onChange={(e) => {
                                      setAccountOtp(e.target.value.replace(/D/g, ""));
                                      setAccountError("");
                                    }}
                                    placeholder="Enter OTP"
                                    className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#0C0C0C] placeholder-slate-300 outline-none ring-1 ring-slate-200 focus:ring-[#0C0C0C] transition text-center tracking-[0.4em]"
                                  />
                                </div>
                                {accountError && (
                                  <p className="mt-3 text-xs font-bold text-rose-500">{accountError}</p>
                                )}
                                <button
                                  type="button"
                                  onClick={handleCreateSubaccount}
                                  disabled={accountLoading}
                                  className="mt-5 w-full py-3.5 rounded-xl bg-[#0C0C0C] text-xs font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition duration-200 disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                  {accountLoading ? "Creating Account..." : "Create Virtual Account"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAccountStep("form");
                                    setAccountError("");
                                    setAccountOtp("");
                                  }}
                                  className="mt-2 w-full text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#0C0C0C] transition"
                                >
                                  Back
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Passcode Update Tab */}
                  {settingsActiveTab === "passcode_update" && (
                    <div className="rounded-[24px] bg-white p-6 md:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0C0C0C]">
                        Passcode Update
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Update the 4-digit passcode used to access and authorize sensitive dashboard actions.
                      </p>
                      <div className="mt-6 border-t border-slate-100 pt-6 max-w-lg">
                        {settingsPasscodeSuccess && !showSettingsPasscodeForm && (
                          <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600">
                            {settingsPasscodeSuccess}
                          </p>
                        )}
                        {!showSettingsPasscodeForm ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowSettingsPasscodeForm(true);
                              setSettingsPasscodeSuccess("");
                              setSettingsPasscodeError("");
                            }}
                            className="inline-flex items-center justify-center rounded-full bg-[#0C0C0C] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-[#D7E2EA] transition hover:bg-[#1C1C1C]"
                          >
                            Change Passcode
                          </button>
                        ) : (
                          <form onSubmit={handleSettingsPasscodeUpdate} className="grid gap-4 sm:grid-cols-3">
                            {dashboardSettings.transactionPinStatus === "set" && (
                              <div>
                                <label htmlFor="current-passcode" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Current passcode
                                </label>
                                <input
                                  id="current-passcode"
                                  type="password"
                                  inputMode="numeric"
                                  maxLength={4}
                                  value={settingsCurrentPasscode}
                                  onChange={(e) => setSettingsCurrentPasscode(e.target.value.replace(/D/g, ""))}
                                  className="mt-2 w-full rounded-2xl bg-slate-50 px-4 py-3 text-center text-xl font-black tracking-widest text-[#0C0C0C] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/60"
                                  placeholder="••••"
                                />
                              </div>
                            )}
                            <div>
                              <label htmlFor="new-passcode" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                New passcode
                              </label>
                              <input
                                id="new-passcode"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={settingsNewPasscode}
                                onChange={(e) => setSettingsNewPasscode(e.target.value.replace(/D/g, ""))}
                                className="mt-2 w-full rounded-2xl bg-slate-50 px-4 py-3 text-center text-xl font-black tracking-widest text-[#0C0C0C] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/60"
                                placeholder="••••"
                              />
                            </div>
                            <div>
                              <label htmlFor="confirm-passcode" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Confirm passcode
                              </label>
                              <input
                                id="confirm-passcode"
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={settingsConfirmPasscode}
                                onChange={(e) => setSettingsConfirmPasscode(e.target.value.replace(/D/g, ""))}
                                className="mt-2 w-full rounded-2xl bg-slate-50 px-4 py-3 text-center text-xl font-black tracking-widest text-[#0C0C0C] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/60"
                                placeholder="••••"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              {settingsPasscodeError && (
                                <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">{settingsPasscodeError}</p>
                              )}
                              {settingsPasscodeSuccess && (
                                <p className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600">{settingsPasscodeSuccess}</p>
                              )}
                              <div className="flex flex-wrap gap-3">
                                <button
                                  type="submit"
                                  disabled={isUpdatingPasscode}
                                  className="inline-flex w-full items-center justify-center rounded-full bg-[#0C0C0C] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-[#D7E2EA] transition hover:bg-[#1C1C1C] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto"
                                >
                                  {isUpdatingPasscode ? "Updating..." : "Update passcode"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowSettingsPasscodeForm(false);
                                    setSettingsCurrentPasscode("");
                                    setSettingsNewPasscode("");
                                    setSettingsConfirmPasscode("");
                                    setSettingsPasscodeError("");
                                  }}
                                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:bg-slate-50 sm:w-auto"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Passcode Modal for Settings Save */}
              {showCompanySavePinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl relative overflow-hidden">
                    <button
                      onClick={() => setShowCompanySavePinModal(false)}
                      className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <h3 className="text-xl font-black text-[#0C0C0C] mb-2">Verify Changes</h3>
                    <p className="text-sm text-slate-500 mb-6">Enter your 4-digit transaction PIN to save these details.</p>
                    {companySaveError && (
                      <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100">
                        {companySaveError}
                      </div>
                    )}
                    <form onSubmit={confirmSaveCompany} className="space-y-6">
                      <div>
                        <input
                          type="password"
                          value={companySavePin}
                          onChange={(e) => setCompanySavePin(e.target.value.replace(/D/g, ''))}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:border-slate-300 focus:bg-white transition-all outline-none font-black tracking-[0.3em] text-center text-lg placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400"
                          placeholder="••••"
                          maxLength={4}
                          required
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingCompany || companySavePin.length !== 4}
                        className="w-full py-4 rounded-full bg-[#0C0C0C] text-sm font-black uppercase tracking-widest text-[#D7E2EA] hover:bg-[#1C1C1C] transition flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        {isSavingCompany ? "Verifying..." : "Confirm Save"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

          {![
            "Overview",
            "My Website",
            "Payments",
            "Hosting & Maintenance",
            "Wallet",
            "Support",
            "Settings",
          ].includes(activeDashboardSection) && (
            <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm max-w-lg mx-auto mt-12 animate-fade-in">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-2xl mb-6">
                ⚙️
              </div>
              <h3 className="text-base font-black uppercase tracking-wider text-[#0C0C0C]">
                Section Coming Soon
              </h3>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                The {activeDashboardSection} control hub is currently being
                configured. Point DNS settings or request site customization
                revision from your active tabs.
              </p>
            </div>
          )}

          {activeDashboardSection === "Overview" && (
            <>
              {overviewError && (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
                  {overviewError}
                </div>
              )}
              {/* Top 4 Stats Cards Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1 */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shrink-0">
                    💼
                  </div>
                  <div className="mt-5">
                    <span className="text-[10px] font-black text-black uppercase tracking-wider block">
                      Total Revenue
                    </span>
                    <span className="text-xl font-black text-black block mt-1">
                      {formatNaira(overviewData.totalRevenue)}
                    </span>
                    <span className="text-[10px] font-bold text-black flex items-center gap-1 mt-1">
                      gross{" "}
                      <span className="text-black font-semibold lowercase">
                        website payments
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shrink-0">
                    💳
                  </div>
                  <div className="mt-5">
                    <span className="text-[10px] font-black text-black uppercase tracking-wider block">
                      Pending Payouts
                    </span>
                    <span className="text-xl font-black text-black block mt-1">
                      {formatNaira(overviewData.pendingPayouts)}
                    </span>
                    <span className="text-[10px] text-black font-bold block mt-1">
                      after 1.5% commission
                    </span>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shrink-0">
                    👥
                  </div>
                  <div className="mt-5">
                    <span className="text-[10px] font-black text-black uppercase tracking-wider block">
                      Total Customers
                    </span>
                    <span className="text-xl font-black text-black block mt-1">
                      {overviewData.totalCustomers.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-black flex items-center gap-1 mt-1">
                      unique{" "}
                      <span className="text-black font-semibold lowercase">
                        paying customers
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out">
                  <div className="flex items-start justify-between gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shrink-0">
                      🌐
                    </div>
                    <div
                      className={`h-11 w-11 rounded-full border-4 flex items-center justify-center text-[10px] font-black ${websiteStatusTone}`}
                    >
                      {isWebsiteOnline ? `${statusUptime}%` : "OFF"}
                    </div>
                  </div>
                  <div className="mt-5">
                    <span className="text-[10px] font-black text-black uppercase tracking-wider block">
                      Website Status
                    </span>
                    <span
                      className={`text-xl font-black block mt-1 ${websiteStatusTone}`}
                    >
                      {isWebsiteOnline
                        ? `${statusUptime}% ${websiteStatusLabel}`
                        : websiteStatusLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Row: Revenue Graph + Payments List */}
              <div className="grid gap-6 lg:grid-cols-[1.7fr_1.3fr]">
                {/* Revenue Graph Card */}
                <div className="rounded-[32px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-black">
                      Revenue Overview
                    </h3>
                    <select className="rounded-xl bg-slate-50 px-3 py-1.5 text-[10px] font-black text-black focus:outline-none cursor-pointer">
                      <option>Last 6 Months</option>
                    </select>
                  </div>

                  <div className="mt-6 flex h-44 items-end gap-3">
                    {overviewData.revenueTimeline.map((item) => {
                      const maxAmount = Math.max(
                        ...overviewData.revenueTimeline.map(
                          (point) => point.amount
                        ),
                        1
                      );
                      const height = Math.max(
                        8,
                        Math.round((item.amount / maxAmount) * 160)
                      );
                      return (
                        <div
                          key={item.month}
                          className="flex flex-1 flex-col items-center gap-2"
                        >
                          <div
                            className="w-full rounded-t-2xl bg-black"
                            style={{ height }}
                            title={`${item.month}: ${formatNaira(item.amount)}`}
                          ></div>
                          <span className="text-[10px] font-black text-black uppercase">
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                    {overviewData.revenueTimeline.length === 0 && (
                      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-50 text-xs font-bold text-slate-400">
                        No payment data yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Payments List Card */}
                <div className="rounded-[32px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(0,0,0,0.06)] transition duration-300 ease-in-out flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-wider text-black">
                      Payments
                    </h3>
                    <a
                      onClick={() => setActiveDashboardSection("Payments")}
                      className="text-[10px] font-black text-black uppercase hover:underline transition cursor-pointer"
                    >
                      See all
                    </a>
                  </div>

                  <div className="space-y-4 flex-1">
                    {filteredPayments.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm ${
                              p.status === "successful"
                                ? "bg-zinc-100 text-black font-bold"
                                : "bg-zinc-100 text-black font-bold"
                            }`}
                          >
                            ✓
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-black text-black block">
                              {p.name}
                            </span>
                            <span className="text-[9px] text-black font-semibold block mt-0.5">
                              {p.time}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-black block">
                            {formatNaira(p.amount)}
                          </span>
                          <span className="text-[9px] font-black text-black block mt-0.5">
                            {p.payoutStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredPayments.length === 0 && (
                      <div className="text-center py-12 text-xs font-medium text-slate-400">
                        No website payments have been recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-[#0C0C0C]/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 md:p-8 max-w-sm w-full relative">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 text-xl mb-4">
              🚪
            </div>
            <h3 className="text-base font-black uppercase tracking-wider text-[#0C0C0C] text-center">
              Confirm Logout
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed text-center">
              Are you sure you want to log out of your session? You will need to
              sign back in to access the control panel.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("beams_auth_token");
                  localStorage.removeItem("beams_sandbox_pin_configured");
                  setShowLogoutConfirm(false);
                  onNavigate("login");
                }}
                className="flex-1 py-3 rounded-full bg-red-600 text-xs font-black uppercase tracking-widest text-white hover:bg-red-750 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black py-28 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="mb-4 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p className="mb-4 text-gray-700 leading-relaxed">
          Welcome to Beams Intelligence. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Data We Collect</h2>
        <p className="mb-4 text-gray-700 leading-relaxed">
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2 text-gray-700 leading-relaxed">
          <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
          <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
          <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
          <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Data</h2>
        <p className="mb-4 text-gray-700 leading-relaxed">
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2 text-gray-700 leading-relaxed">
          <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
          <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
          <li>Where we need to comply with a legal obligation.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
        <p className="mb-4 text-gray-700 leading-relaxed">
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Legal Rights</h2>
        <p className="mb-4 text-gray-700 leading-relaxed">
          Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contact Us</h2>
        <p className="mb-4 text-gray-700 leading-relaxed">
          If you have any questions about this privacy policy or our privacy practices, please contact us at{" "}
          <a href="mailto:beams@saference.com" className="text-blue-600 hover:underline">
            beams@saference.com
          </a>.
        </p>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Calculate current page from URL
  const path = location.pathname.replace(/^\//, "").split("/")[0] || (localStorage.getItem("beams_auth_token") ? "dashboard" : "home");
  
  const validPages = ["home", "pricing", "about", "contact", "guide", "started", "business", "login", "dashboard", "privacy"];
  const currentPage = validPages.includes(path) ? (path as AppPage) : "home";

  const setCurrentPage = (page: AppPage) => {
    navigate(`/${page}`);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const showMarketingBottom = [
    "home",
    "pricing",
    "about",
    "contact",
    "guide",
    "privacy",
  ].includes(currentPage);

  if (currentPage === "dashboard") {
    return <DashboardPage onNavigate={setCurrentPage} />;
  }

  return (
    <main
      className={`min-h-screen overflow-x-clip ${
        currentPage === "home" ? "bg-[#0C0C0C]" : "bg-white"
      }`}
    >
      <HeaderSection currentPage={currentPage} onNavigate={setCurrentPage} />
      {currentPage === "home" ? (
        <>
          <HeroSection onNavigate={setCurrentPage} />
          <ServicesSection />
          <ProjectsSection />
        </>
      ) : currentPage === "pricing" ? (
        <PricingPage />
      ) : currentPage === "about" ? (
        <AboutUsPage />
      ) : currentPage === "contact" ? (
        <ContactPage />
      ) : currentPage === "guide" ? (
        <BusinessGuidePage />
      ) : currentPage === "started" ? (
        <GetStartedPage
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          onNavigate={setCurrentPage}
        />
      ) : currentPage === "business" ? (
        <BusinessInfoPage
          selectedDomain={selectedDomain}
          onNavigate={setCurrentPage}
        />
      ) : currentPage === "privacy" ? (
        <PrivacyPolicyPage />
      ) : (
        <LoginPage onNavigate={setCurrentPage} />
      )}
      {showMarketingBottom && (
        <>
          <CtaSection onNavigate={setCurrentPage} />
          <FooterSection onNavigate={setCurrentPage} />
        </>
      )}
    </main>
  );
}

export default App;
