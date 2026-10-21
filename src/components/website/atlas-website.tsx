"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Boxes,
  Factory,
  Users,
  Wallet,
  Network,
  ShieldCheck,
  BookOpen,
  Menu,
  X,
  PackageCheck,
  Wrench,
  MessageSquare,
  Pause,
  Play,
  CircleDot,
  Sparkles,
  MoveUpRight,
  Search,
  Bell,
  CalendarDays,
} from "lucide-react";
import "./website.css";

const stories = [
  {
    label: "Plan",
    number: "01",
    title: "See the next move.",
    detail:
      "Bring sales expectations, stock, supply and financial assumptions into one planning conversation. Review the gaps, agree the decisions and give the next action an owner.",
    icon: Network,
    steps: ["Review demand", "Check supply cover", "Agree the plan"],
    tag: "Sales & Operations Planning",
    description: "One planning cycle. Clear reviews. A traceable release.",
  },
  {
    label: "Make",
    number: "02",
    title: "Make it happen.",
    detail:
      "Turn demand into material proposals and production work. Book the finished batch into production holding, then let Warehouse collect and book it into the yard.",
    icon: Factory,
    steps: [
      "Review materials",
      "Execute production",
      "Collect & book into yard",
    ],
    tag: "Manufacturing & Supply",
    description:
      "The plan becomes a physical batch. The handoff stays connected.",
  },
  {
    label: "Deliver",
    number: "03",
    title: "Keep the promise.",
    detail:
      "Connect the customer’s order to fulfilment, delivery and its financial documents. Keep the context close when someone needs support, a repair or a follow-up.",
    icon: PackageCheck,
    steps: ["Pick & dispatch", "Record delivery", "Follow the source invoice"],
    tag: "Connected customer work",
    description: "One customer promise, connected to the work behind it.",
  },
];
const areas = [
  {
    name: "Customers & growth",
    icon: MessageSquare,
    detail:
      "Know the relationship. Keep the opportunity, order and follow-up connected.",
    apps: ["Customers", "Sales", "CRM", "Customer Service", "Marketing"],
    caption: "From first conversation to the next order.",
  },
  {
    name: "Manufacturing & supply",
    icon: Factory,
    detail:
      "Plan materials, make the product and follow the batch all the way into the yard.",
    apps: ["Manufacturing", "Inventory", "Procurement", "Logistics"],
    caption: "Real work, with a traceable handoff.",
  },
  {
    name: "People & daily work",
    icon: Users,
    detail:
      "Bring responsibilities, availability and the next action into view.",
    apps: ["HR", "Scheduling", "Team planner", "Goals", "Payroll"],
    caption: "People know what needs them.",
  },
  {
    name: "Finance & decisions",
    icon: Wallet,
    detail:
      "Follow the money from draft and approval through posting and settlement.",
    apps: ["Finance", "S&OP", "Plan", "Reports", "Dashboards"],
    caption: "A clearer picture behind every decision.",
  },
  {
    name: "Care for the operation",
    icon: Wrench,
    detail:
      "Keep equipment, designs and quality issues close to the evidence and the action.",
    apps: ["Maintenance", "Quality", "Engineering", "Fleet", "Field Service"],
    caption: "Fix the issue. Follow the result.",
  },
  {
    name: "One place to work",
    icon: BookOpen,
    detail:
      "Shared tasks, meetings, documents and practical guides make the work easier to follow.",
    apps: ["Projects", "Meetings", "Templates", "My tasks", "Guides"],
    caption: "The detail is there when you need it.",
  },
];
const ticker = [
  "Customers",
  "S&OP",
  "Manufacturing",
  "Inventory",
  "Procurement",
  "Quality",
  "People",
  "Finance",
  "Projects",
  "Maintenance",
];

function ProductScene({
  scene,
  large = false,
}: {
  scene: number;
  large?: boolean;
}) {
  const story = stories[scene];
  return (
    <div className={`website-product ${large ? "is-large" : ""}`}>
      <div className="website-product-top">
        <span>
          <img src="/brand/atlas-icon.png" alt="" width={26} height={26} />
          Atlas
        </span>
        <span className="website-product-search">
          <Search size={12} /> Find your next action
        </span>
        <Bell size={15} />
      </div>
      <div className="website-product-body" key={story.label}>
        <div className="website-product-head">
          <div>
            <p>
              <story.icon size={13} />
              {story.tag}
            </p>
            <h3>
              {
                ["A clearer plan.", "From line to yard.", "Ready to move."][
                  scene
                ]
              }
            </h3>
          </div>
          <span className="website-product-status">
            <i />{" "}
            {["Working forecast", "Production handoff", "Fulfilment"][scene]}
          </span>
        </div>
        {scene === 0 ? (
          <>
            <div
              className="website-product-chart"
              aria-label="Illustration of demand and supply across six months"
            >
              <div className="website-chart-label">
                <span>Demand & supply cover</span>
                <span>
                  <i /> Demand <i /> Supply
                </span>
              </div>
              <div className="website-bars">
                {[58, 73, 65, 88, 80, 95].map((value, i) => (
                  <div key={i}>
                    <span style={{ height: `${value}%` }} />
                    <span
                      style={{ height: `${value - [6, 2, 15, 4, 10, 3][i]}%` }}
                    />
                    <small>
                      {["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i]}
                    </small>
                  </div>
                ))}
              </div>
            </div>
            <div className="website-product-row">
              <span className="website-scene-icon">
                <CircleDot size={18} />
              </span>
              <div>
                <strong>Review the supply gap</strong>
                <small>Operations · Review & agree an action</small>
              </div>
              <ArrowUpRight size={17} />
            </div>
            <div className="website-review-dots">
              <span>Prepare</span>
              <Check size={12} />
              <span>Review</span>
              <i />
              <span>Decide</span>
              <i />
              <span>Release</span>
            </div>
          </>
        ) : scene === 1 ? (
          <>
            <div className="website-batch">
              <div>
                <span className="website-scene-icon">
                  <Boxes size={28} />
                </span>
                <div>
                  <strong>Finished production batch</strong>
                  <small>Finished goods · Production holding</small>
                </div>
                <span className="website-held">Part collected</span>
              </div>
              <dl className="website-batch-quantities">
                <div>
                  <dt>Produced</dt>
                  <dd>
                    240 <small>units</small>
                  </dd>
                </div>
                <div>
                  <dt>Collected</dt>
                  <dd>
                    80 <small>units</small>
                  </dd>
                </div>
                <div>
                  <dt>To collect</dt>
                  <dd>
                    160 <small>units</small>
                  </dd>
                </div>
              </dl>
              <div className="website-batch-path">
                <span>
                  <Factory size={20} />
                  Production holding
                </span>
                <div>
                  <i />
                  <i />
                  <i />
                  <ArrowRight size={17} />
                </div>
                <span>
                  <PackageCheck size={20} />
                  Destination yard
                </span>
              </div>
            </div>
            <div className="website-product-row">
              <span className="website-scene-icon">
                <PackageCheck size={18} />
              </span>
              <div>
                <strong>Collect the remaining batch</strong>
                <small>Warehouse · Choose quantity & yard location</small>
              </div>
              <ArrowUpRight size={17} />
            </div>
            <div className="website-review-dots">
              <ShieldCheck size={13} />
              <span>Held until collected. Traceable when booked.</span>
            </div>
          </>
        ) : (
          <>
            <div
              className="website-delivery-map"
              aria-label="Illustration of order, warehouse and customer connected"
            >
              <div className="website-map-grid" />
              <svg viewBox="0 0 420 150" aria-hidden="true">
                <path
                  className="website-map-route"
                  d="M40 112H105Q125 112 125 92V55Q125 35 145 35H255Q275 35 275 55V92Q275 112 295 112H380"
                />
                <circle cx="40" cy="112" r="7" />
                <circle cx="380" cy="112" r="7" />
                <circle className="website-map-moving" r="5">
                  <animateMotion
                    dur="5s"
                    repeatCount="indefinite"
                    path="M40 112H105Q125 112 125 92V55Q125 35 145 35H255Q275 35 275 55V92Q275 112 295 112H380"
                  />
                </circle>
              </svg>
              <span className="website-map-start">
                <Boxes size={19} />
                Warehouse
              </span>
              <span className="website-map-end">
                <Users size={19} />
                Customer
              </span>
            </div>
            <div className="website-product-row">
              <span className="website-scene-icon">
                <Check size={18} />
              </span>
              <div>
                <strong>Follow the customer promise</strong>
                <small>Order → Delivery → Source invoice</small>
              </div>
              <ArrowUpRight size={17} />
            </div>
            <div className="website-review-dots">
              <MessageSquare size={13} />
              <span>Context stays with the relationship.</span>
            </div>
          </>
        )}
      </div>
      <div className="website-product-bottom">
        <span>
          <ShieldCheck size={12} /> Connected records. Controlled actions.
        </span>
        <span>Illustration · No company data</span>
      </div>
    </div>
  );
}

export function AtlasWebsite({ signedIn = false }: { signedIn?: boolean }) {
  const [active, setActive] = useState(0),
    [hero, setHero] = useState(0),
    [menu, setMenu] = useState(false),
    [motion, setMotion] = useState(true),
    [auto, setAuto] = useState(true),
    root = useRef<HTMLDivElement>(null),
    sceneRef = useRef<HTMLDivElement>(null),
    story = stories[active];
  const access = signedIn ? "/home" : "/login",
    accessLabel = signedIn ? "Open your workspace" : "Existing user sign in";
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (preference.matches) {
        setMotion(false);
        setAuto(false);
      }
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!motion || !auto) return;
    const timer = setInterval(() => { if (!document.hidden) setHero((value) => (value + 1) % 3); }, 8000);
    return () => clearInterval(timer);
  }, [motion, auto]);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.12 },
    );
    node
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    node.classList.add("has-reveal");
    return () => observer.disconnect();
  }, []);
  const pickHero = (index: number) => {
    setHero(index);
    setAuto(false);
  };
  return (
    <div
      ref={root}
      className="atlas-website"
      data-motion={motion ? "running" : "paused"}
    >
      <a href="#website-main" className="website-skip">
        Skip to content
      </a>
      <header className="website-nav">
        <div className="website-container website-nav-inner">
          <Link href="/" className="website-brand" aria-label="Atlas home">
            <img
              src="/brand/atlas-wordmark.png"
              alt="Atlas"
              width={148}
              height={64}
            />
          </Link>
          <nav
            id="website-mobile-nav"
            aria-label="Website"
            className={menu ? "website-links is-open" : "website-links"}
          >
            <a href="#software" onClick={() => setMenu(false)}>
              The software
            </a>
            <a href="#workflow" onClick={() => setMenu(false)}>
              How it connects
            </a>
            <a href="#approach" onClick={() => setMenu(false)}>
              Built for people
            </a>
            <Link
              href={access}
              className="website-access"
              onClick={() => setMenu(false)}
            >
              {signedIn ? "Workspace" : "Sign in"} <ArrowUpRight size={16} />
            </Link>
          </nav>
          <button
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            aria-controls="website-mobile-nav"
            className="website-menu"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      <main id="website-main">
        <div className="website-opening">
          <div className="website-atmosphere" aria-hidden="true">
            <span />
            <span />
            <div className="website-mesh" />
          </div>

          <section className="website-hero website-container">
            <div className="website-hero-copy">
              <p className="website-eyebrow">
                <span className="website-dot" /> A connected ERP. A clearer way
                to work.
              </p>
              <h1>
                <span>Your whole</span>
                <span>business.</span>
                <em>In motion.</em>
              </h1>
              <p className="website-lead">
                Sales, purchasing, manufacturing, stock, Finance and People.
                Connected in one ERP, designed around the people doing the work.
              </p>
              <div className="website-hero-actions">
                <a href="#workflow" className="website-button">
                  Explore Atlas <ArrowRight size={20} />
                </a>
                <Link href={access} className="website-text-link">
                  {accessLabel} <ArrowUpRight size={17} />
                </Link>
              </div>
              <p className="website-private">
                <ShieldCheck size={14} /> Private access. Built for our people.
              </p>
            </div>
            <div
              className="website-hero-stage"
              ref={sceneRef}
              onPointerMove={(event) => {
                if (!motion || event.pointerType !== "mouse") return;
                const rect = event.currentTarget.getBoundingClientRect();
                sceneRef.current?.style.setProperty(
                  "--tilt-x",
                  `${((event.clientY - rect.top - rect.height / 2) / rect.height) * -3}deg`,
                );
                sceneRef.current?.style.setProperty(
                  "--tilt-y",
                  `${((event.clientX - rect.left - rect.width / 2) / rect.width) * 4}deg`,
                );
              }}
              onPointerLeave={() => {
                sceneRef.current?.style.setProperty("--tilt-x", "0deg");
                sceneRef.current?.style.setProperty("--tilt-y", "0deg");
              }}
            >
              <div className="website-stage-halo" aria-hidden="true" />
              <span className="website-stage-label">
                <Sparkles size={14} /> See the work, beautifully connected.
              </span>
              <div className="website-hero-product" id="hero-scene">
                <ProductScene scene={hero} />
              </div>
              <div className="website-floating-note" key={hero}>
                <span>
                  <Check size={16} />
                </span>
                <div>
                  <strong>
                    {
                      [
                        "A plan everyone can follow",
                        "Production → Warehouse",
                        "The promise stays connected",
                      ][hero]
                    }
                  </strong>
                  <small>
                    {
                      [
                        "Clear reviews. Owned decisions.",
                        "Hold. Collect. Book into yard.",
                        "Source records, close at hand.",
                      ][hero]
                    }
                  </small>
                </div>
                <MoveUpRight size={16} />
              </div>
              <div className="website-hero-controls">
                <div role="group" aria-label="Explore the product scenes">
                  {stories.map((item, index) => (
                    <button
                      key={item.label}
                      aria-pressed={hero === index}
                      aria-controls="hero-scene"
                      onClick={() => pickHero(index)}
                    >
                      <span>{item.number}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  className="website-motion"
                  aria-label={motion ? "Pause motion" : "Play motion"}
                  aria-pressed={!motion}
                  onClick={() => {
                    setMotion(!motion);
                    setAuto(!motion);
                  }}
                >
                  {motion ? <Pause size={14} /> : <Play size={14} />}
                </button>
              </div>
            </div>
          </section>
          <div className="website-opening-bottom website-container">
            <span>Plan. Make. Deliver.</span>
            <a href="#software">
              Discover what’s connected <ArrowRight size={15} />
            </a>
            <span className="website-scroll-mark" aria-hidden="true">
              <i />
            </span>
          </div>
          <div
            className="website-ticker"
            aria-label="Connected Atlas workspaces"
          >
            <div>
              {[0, 1].map((copy) => (
                <div key={copy} aria-hidden={copy === 1}>
                  {ticker.map((label) => (
                    <span key={label}>
                      {label}
                      <i />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="website-rest">
          <section id="software" className="website-section website-container">
            <div className="website-section-heading" data-reveal>
              <div>
                <p className="website-eyebrow">The whole business. In view.</p>
                <h2>
                  Everything connects.
                  <br />
                  <span>Work feels lighter.</span>
                </h2>
              </div>
              <p>
                Purposeful workspaces for the everyday jobs and the decisions
                that shape what happens next. Explore what belongs together.
              </p>
            </div>
            <div className="website-areas">
              {areas.map((area, index) => (
                <details
                  key={area.name}
                  className={`website-area area-${index}`}
                  data-reveal
                >
                  <summary>
                    <div className="website-area-top">
                      <span className="website-area-icon">
                        <area.icon size={26} strokeWidth={1.6} />
                      </span>
                      <span className="website-area-number">0{index + 1}</span>
                    </div>
                    <h3>{area.name}</h3>
                    <p>{area.detail}</p>
                    {index < 2 && (
                      <div
                        className="website-area-journey"
                        aria-label={
                          index === 0
                            ? "Customer work connected from opportunity to order"
                            : "Supply work connected from purchase to yard"
                        }
                      >
                        {(index === 0
                          ? ["Opportunity", "Quote", "Order"]
                          : ["Purchase", "Production", "Yard"]
                        ).map((stage, step) => (
                          <div key={stage}>
                            <span>
                              {step === 0 ? (
                                <CircleDot size={17} />
                              ) : step === 1 ? (
                                <Network size={17} />
                              ) : (
                                <PackageCheck size={17} />
                              )}
                            </span>
                            <strong>{stage}</strong>
                            {step < 2 && <i />}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="website-area-apps">
                      {area.apps.map((app) => (
                        <span key={app}>{app}</span>
                      ))}
                    </div>
                    <span className="website-area-more">
                      Explore the connection <ArrowUpRight size={18} />
                    </span>
                  </summary>
                  <div className="website-area-expanded">
                    <strong>{area.caption}</strong>
                    <p>
                      {index === 1
                        ? "Demand becomes material proposals and production orders. Finished output waits in production holding until Warehouse collects the batch and books it into storage."
                        : index === 3
                          ? "S&OP brings departments together to agree demand. Finance keeps approvals, posting and settlement controlled. Reports connect the view to its source."
                          : index === 4
                            ? "Record the fault or quality issue, contain the impact and assign the next action. Retain completion evidence and review the outcome."
                            : index === 2
                              ? "Plan availability, agree responsibilities and track the work with its owner. Sensitive People and Payroll records stay behind the authorised profile."
                              : index === 0
                                ? "Follow a shared customer record from relationship work into quotes, orders and fulfilment. The source is there when the next team needs it."
                                : "The task, its source record and a practical guide stay close. People can find what to do and understand what happens next."}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
          <section id="workflow" className="website-workflow">
            <div className="website-container">
              <div className="website-section-heading" data-reveal>
                <div>
                  <p className="website-eyebrow">
                    Watch the work come together
                  </p>
                  <h2>
                    From a plan.
                    <br />
                    To a promise kept.
                  </h2>
                </div>
                <p>
                  Explore three connected moments. Each team keeps its own
                  controls. The story keeps moving.
                </p>
              </div>
              <div className="website-story" data-reveal>
                <div className="website-story-copy">
                  <div
                    role="tablist"
                    aria-label="Explore the Atlas workflow"
                    className="website-tabs"
                  >
                    {stories.map((item, index) => (
                      <button
                        key={item.label}
                        type="button"
                        role="tab"
                        id={`story-tab-${index}`}
                        aria-selected={active === index}
                        aria-controls={`story-panel-${index}`}
                        tabIndex={active === index ? 0 : -1}
                        onClick={() => setActive(index)}
                        onKeyDown={(event) => {
                          let next = active;
                          if (event.key === "ArrowRight")
                            next = (active + 1) % 3;
                          else if (event.key === "ArrowLeft")
                            next = (active + 2) % 3;
                          else if (event.key === "Home") next = 0;
                          else if (event.key === "End") next = 2;
                          else return;
                          event.preventDefault();
                          setActive(next);
                          document.getElementById(`story-tab-${next}`)?.focus();
                        }}
                      >
                        <span>{item.number}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div
                    role="tabpanel"
                    id={`story-panel-${active}`}
                    aria-labelledby={`story-tab-${active}`}
                    tabIndex={0}
                    key={story.label}
                    className="website-story-content"
                  >
                    <span
                      className="website-story-big-number"
                      aria-hidden="true"
                    >
                      {story.number}
                    </span>
                    <h3>{story.title}</h3>
                    <p>{story.detail}</p>
                    <ul>
                      {story.steps.map((item) => (
                        <li key={item}>
                          <Check size={16} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="website-workflow-product">
                  <ProductScene scene={active} large />
                  <div className="website-product-caption">
                    <span>
                      <story.icon size={16} />
                      {story.description}
                    </span>
                    <ArrowUpRight size={17} />
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section id="approach" className="website-section website-container">
            <div className="website-section-heading" data-reveal>
              <div>
                <p className="website-eyebrow">
                  Built around the person using it
                </p>
                <h2>
                  Less figuring out.
                  <br />
                  <span>More getting done.</span>
                </h2>
              </div>
              <p>
                Complex work deserves a clear interface. The next action, the
                explanation and the source record belong within reach.
              </p>
            </div>
            <div className="website-principles">
              <article data-reveal>
                <span>01 / Clarity</span>
                <h3>
                  A clearer
                  <br />
                  next action.
                </h3>
                <p>
                  Useful work queues, visible owners and meaningful statuses
                  help people find what needs them.
                </p>
                <div className="website-mini-task">
                  <span>
                    <Check size={16} />
                  </span>
                  <div>
                    <strong>You know what comes next</strong>
                    <small>Owner · Due date · Source record</small>
                  </div>
                  <CalendarDays size={19} />
                </div>
              </article>
              <article data-reveal>
                <span>02 / Context</span>
                <h3>
                  One story.
                  <br />
                  Across teams.
                </h3>
                <p>
                  Shared customer and product records connect the work. Follow
                  the source to understand the detail.
                </p>
                <div className="website-mini-chain">
                  <Users size={25} />
                  <i />
                  <Boxes size={25} />
                  <i />
                  <Wallet size={25} />
                </div>
              </article>
              <article data-reveal>
                <span>03 / Confidence</span>
                <h3>
                  Help, right
                  <br />
                  where you work.
                </h3>
                <p>
                  Practical guides explain preparation, the real steps, what
                  happens next and common blockers.
                </p>
                <div className="website-mini-guide">
                  <BookOpen size={23} />
                  <div>
                    <strong>Show me how</strong>
                    <small>Plain language. Useful steps.</small>
                  </div>
                  <ArrowUpRight size={19} />
                </div>
              </article>
            </div>
          </section>
          <section
            className="website-access-section website-container"
            data-reveal
          >
            <div>
              <p className="website-eyebrow">Our platform. Our people.</p>
              <h2>
                Ready for
                <br />
                <em>your next move.</em>
              </h2>
              <p>
                Atlas is currently private for its owner and existing Atlas
                users. Accounts come from Atlas. There is no public signup or
                subscription.
              </p>
              <Link href={access} className="website-button">
                {accessLabel} <ArrowUpRight size={20} />
              </Link>
            </div>
            <div className="website-access-art" aria-hidden="true">
              <div className="website-access-logo">
                <img
                  src="/brand/atlas-icon.png"
                  alt=""
                  width={100}
                  height={100}
                />
              </div>
              <span />
              <span />
              <span />
              <i className="website-access-tag">
                <ShieldCheck size={16} /> Private by design
              </i>
            </div>
          </section>
          <section
            className="website-faq website-container"
            aria-label="Common questions"
            data-reveal
          >
            <div>
              <p className="website-eyebrow">A few useful answers</p>
              <h2>Before you begin.</h2>
            </div>
            <div>
              {[
                {
                  q: "What is Atlas?",
                  a: "Atlas is a modular ERP and business operating system. It connects customer work, purchasing, manufacturing, inventory, people, finance and planning with shared records and controlled actions.",
                },
                {
                  q: "Can I create an account?",
                  a: "Access is currently private. Atlas provides accounts to existing users. There is no public signup, checkout or subscription flow.",
                },
                {
                  q: "I already use Atlas. Where do I go?",
                  a: "Use Existing user sign in. If your company supplied a dedicated business sign-in address, continue to use that address. Your usual profile and company access still apply.",
                },
                {
                  q: "How do teams learn to use it?",
                  a: "Inside Atlas, open Guides or the guide icon in a workspace. Instructions explain the task, preparation, next steps and common blockers.",
                },
              ].map((item) => (
                <details key={item.q}>
                  <summary>
                    {item.q}
                    <ChevronDown size={17} />
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
      <footer className="website-footer">
        <div className="website-container">
          <Link href="/" aria-label="Atlas home">
            <img
              src="/brand/atlas-wordmark.png"
              alt="Atlas"
              width={116}
              height={50}
            />
          </Link>
          <span>Plan. Make. Deliver.</span>
          <div>
            <a href="#software">Explore the platform</a>
            <Link href={access}>
              Sign in <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
