"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/* Parse une chaîne CSS "a:b;c:d" en objet style React (fidélité au prototype). */
function st(css: string): CSSProperties {
  const o: Record<string, string> = {};
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const k = decl.slice(0, i).trim();
    if (!k) continue;
    const v = decl.slice(i + 1).trim();
    const key = k.startsWith("--")
      ? k
      : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    o[key] = v;
  }
  return o as CSSProperties;
}

const ACCENT = "#D9B27A";
const rgba = (a: number) => `rgba(217,178,122,${a})`;

const ICONS: Record<string, string[]> = {
  folder: ["M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  invoice: ["M6 3h9l3 3v15l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5L6 3z", "M9 8h6M9 12h6M9 16h3"],
  clock: ["M12 8v4l3 2"],
  calendar: ["M3 10h18M8 3v4M16 3v4"],
  doc: ["M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M14 3v5h5M9 13h6M9 17h6"],
  chart: ["M4 20V10M10 20V4M16 20v-7M22 20H2"],
  bolt: ["M13 3 4 14h7l-1 7 9-11h-7l1-7z"],
  layers: ["M12 3 3 8l9 5 9-5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5"],
  eye: ["M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"],
  target: [],
};

function Icon({ name }: { name: string }) {
  const common = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "clock")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    );
  if (name === "calendar")
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    );
  if (name === "eye")
    return (
      <svg {...common}>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  if (name === "target")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      </svg>
    );
  return (
    <svg {...common}>
      {(ICONS[name] ?? []).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

type Theme = "dark" | "light";

function palette(theme: Theme) {
  const dark = theme === "dark";
  return dark
    ? {
        bg: "#0B1220", surface: "#111827", surface2: "#161f30",
        text: "#F5F5F4", text2: "#9aa6b8", text3: "#646f84",
        border: "rgba(255,255,255,.10)", hairline: "rgba(255,255,255,.07)",
        navBg: "rgba(11,18,32,.72)", dot: "rgba(255,255,255,.18)",
        shadowXl: "0 40px 100px -30px rgba(0,0,0,.7)", shadowMd: "0 20px 50px -20px rgba(0,0,0,.6)",
        barPrev: "rgba(255,255,255,.12)", pos: "#5fd0a0", accentInk: "#1a1206",
        bandBg: "#111827", bandFg: "#F5F5F4", bandMut: "#9aa6b8",
        ctaBg: "linear-gradient(180deg,#131c2e,#0d1424)", ctaBorder: "rgba(255,255,255,.10)",
        ctaBorder2: "rgba(255,255,255,.18)", ctaFg: "#F5F5F4", ctaMut: "#9aa6b8",
        mark: "/ozance-mark-gold.png",
      }
    : {
        bg: "#F8F7F4", surface: "#FFFFFF", surface2: "#F4F2ED",
        text: "#111827", text2: "#566072", text3: "#9099a8",
        border: "rgba(17,24,39,.10)", hairline: "rgba(17,24,39,.07)",
        navBg: "rgba(248,247,244,.74)", dot: "rgba(17,24,39,.14)",
        shadowXl: "0 40px 100px -40px rgba(44,55,71,.32)", shadowMd: "0 20px 50px -24px rgba(44,55,71,.28)",
        barPrev: "rgba(17,24,39,.10)", pos: "#1f9d6b", accentInk: "#21180a",
        bandBg: "#2C3747", bandFg: "#FFFFFF", bandMut: "rgba(255,255,255,.72)",
        ctaBg: "#2C3747", ctaBorder: "rgba(255,255,255,.08)",
        ctaBorder2: "rgba(255,255,255,.22)", ctaFg: "#FFFFFF", ctaMut: "rgba(255,255,255,.74)",
        mark: "/ozance-mark-navy.png",
      };
}

function HeroChart() {
  const pts = [22, 30, 26, 40, 36, 52, 48, 60, 72];
  const w = 260, h = 74, max = 72;
  const coords = pts.map((p, i) => [(i / (pts.length - 1)) * w, h - 6 - (p / max) * (h - 14)]);
  const line = coords.map((c, i) => (i ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1)).join(" ");
  const area = line + ` L ${w} ${h} L 0 ${h} Z`;
  const last = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="oza" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.35" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#oza)" />
      <path d={line} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.4" fill={ACCENT} />
    </svg>
  );
}

export function OzanceLanding() {
  const [theme, setTheme] = useState<Theme>("dark");
  const rootRef = useRef<HTMLDivElement>(null);
  const t = palette(theme);

  // Thème automatique selon l'heure locale : jour (7h–19h) clair, sinon sombre.
  // (Réglé après le montage pour éviter tout décalage d'hydratation.)
  useEffect(() => {
    const h = new Date().getHours();
    setTheme(h >= 7 && h < 19 ? "light" : "dark");
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".oz-reveal"));
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -7% 0px" },
    );
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 800) * 0.96) el.classList.add("is-visible");
      else io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const rootStyle = {
    "--ui": "var(--font-geist-sans), system-ui, sans-serif",
    "--display": "var(--font-geist-sans), system-ui, sans-serif",
    "--mono": "var(--font-geist-mono), ui-monospace, monospace",
    "--bg": t.bg, "--surface": t.surface, "--surface-2": t.surface2,
    "--text": t.text, "--text-2": t.text2, "--text-3": t.text3,
    "--border": t.border, "--hairline": t.hairline, "--nav-bg": t.navBg, "--dot": t.dot,
    "--accent": ACCENT, "--accent-2b": rgba(0.55), "--accent-soft": rgba(0.14),
    "--accent-ink": t.accentInk, "--accent-hi": "rgba(255,255,255,.25)", "--accent-shadow": rgba(0.35),
    "--glow": rgba(0.126), "--shadow-xl": t.shadowXl, "--shadow-md": t.shadowMd,
    "--bar-prev": t.barPrev, "--pos": t.pos,
    "--band-bg": t.bandBg, "--band-fg": t.bandFg, "--band-mut": t.bandMut,
    "--cta-bg": t.ctaBg, "--cta-border": t.ctaBorder, "--cta-border-2": t.ctaBorder2,
    "--cta-fg": t.ctaFg, "--cta-mut": t.ctaMut,
    "--hero-tilt": "perspective(1600px) rotateY(-6deg) rotateX(3deg)",
    colorScheme: theme,
  } as CSSProperties;

  const logos = ["Lefebvre Dalloz", "FIDAL", "AJ Associés", "Cornet Vincent", "LexVox"];
  const nav = ["Tableau de bord", "Dossiers", "Agenda", "Temps & honoraires", "Facturation", "Documents", "Contacts", "Rapports"];
  const kpis = [
    { label: "Dossiers actifs", value: "128", delta: "▲ 12 ce mois", dc: t.pos },
    { label: "Chiffre d'affaires", value: "128 400 €", delta: "▲ 18,2%", dc: t.pos },
    { label: "Temps facturable", value: "164 h", delta: "▲ 8,4%", dc: t.pos },
    { label: "En attente", value: "24 550 €", delta: "7 factures", dc: t.text3 },
  ];
  const bars = [
    { m: "Déc", prev: 42, cur: 55 }, { m: "Jan", prev: 50, cur: 48 }, { m: "Fév", prev: 46, cur: 62 },
    { m: "Mar", prev: 58, cur: 70 }, { m: "Avr", prev: 54, cur: 78 }, { m: "Mai", prev: 62, cur: 95 },
  ];
  const agenda = [
    { day: "14", mon: "mai", title: "Audience TGI Paris", sub: "Société Beta", col: ACCENT },
    { day: "16", mon: "mai", title: "Remise de conclusions", sub: "Jean Dupont", col: t.text3 },
    { day: "17", mon: "mai", title: "Rendez-vous client", sub: "Société Alpha", col: t.text3 },
    { day: "21", mon: "mai", title: "Clôture facturation", sub: "Mensuelle", col: ACCENT },
  ];
  const dossiers = [
    { ini: "SA", name: "Société Alpha", type: "Constitution de société", status: "En cours", tagbg: rgba(0.15), tagc: ACCENT, amount: "8 400 €", av: "#C0894E" },
    { ini: "JD", name: "Jean Dupont", type: "Divorce — garde d'enfants", status: "Audience", tagbg: "rgba(91,124,184,.18)", tagc: "#7c9bd0", amount: "3 200 €", av: "#5B7CB8" },
    { ini: "SB", name: "Société Beta", type: "Recouvrement de créances", status: "Facturé", tagbg: "rgba(62,156,119,.18)", tagc: "#46b88c", amount: "12 950 €", av: "#3E9C77" },
  ];
  const features = [
    { title: "Gestion des dossiers", body: "Centralisez pièces, parties, échéances et historique de chaque affaire en un seul endroit.", icon: "folder" },
    { title: "Facturation", body: "Générez, envoyez et suivez vos factures et honoraires en quelques clics.", icon: "invoice" },
    { title: "Temps passé", body: "Chronométrez et imputez votre temps par dossier, sans rien oublier.", icon: "clock" },
    { title: "Agenda & échéances", body: "Audiences, délais de procédure et rendez-vous, jamais manqués.", icon: "calendar" },
    { title: "Documents", body: "Modèles, signatures et coffre-fort numérique sécurisé pour chaque client.", icon: "doc" },
    { title: "Pilotage du cabinet", body: "Rentabilité, charge de travail et activité, visibles en temps réel.", icon: "chart" },
  ];
  const figures = [
    { num: "40 %", label: "de temps administratif économisé chaque semaine" },
    { num: "+30 %", label: "de facturation récupérée grâce au suivi du temps" },
    { num: "100 %", label: "de votre activité centralisée dans un seul espace" },
  ];
  const benefits = [
    { title: "Gagnez du temps", body: "Automatisez les tâches répétitives et les relances de facturation.", icon: "bolt" },
    { title: "Réduisez l'administratif", body: "Moins de saisie, moins de tableurs, moins d'erreurs.", icon: "layers" },
    { title: "Suivez votre activité", body: "Une vue claire et en temps réel sur tous vos dossiers.", icon: "eye" },
    { title: "Prenez de meilleures décisions", body: "Des indicateurs de rentabilité fiables pour piloter le cabinet.", icon: "target" },
  ];
  const quotes = [
    { text: "On a divisé par deux le temps passé sur l'administratif. L'équipe s'est enfin recentrée sur les dossiers.", name: "Maître Claire Dubois", role: "Associée — Droit des affaires", ini: "CD", av: "#C0894E" },
    { text: "La facturation et le suivi du temps sont enfin connectés. On récupère un chiffre qu'on laissait filer avant.", name: "Maître Antoine Mercier", role: "Associé — Contentieux", ini: "AM", av: "#5B7CB8" },
    { text: "Une interface sobre, rapide, pensée pour notre métier. Mes collaborateurs l'ont adoptée en une semaine.", name: "Maître Sofia Nazari", role: "Associée — Droit social", ini: "SN", av: "#3E9C77" },
  ];
  const footer = [
    { head: "Produit", items: ["Fonctionnalités", "Plateforme", "Sécurité", "Tarifs"] },
    { head: "Cabinet", items: ["Avocats", "Notaires", "Petites structures", "Grands cabinets"] },
    { head: "Ressources", items: ["Centre d'aide", "Guide de migration", "Statut", "Contact"] },
  ];

  const navActive = (i: number) => ({
    color: i === 0 ? t.text : t.text2,
    bg: i === 0 ? rgba(0.12) : "transparent",
    weight: i === 0 ? 600 : 450,
    dot: i === 0 ? ACCENT : t.text3,
  });

  return (
    <div ref={rootRef} style={rootStyle}>
      <div style={st(`font-family:var(--ui);background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden;`)}>
        {/* ambient glow */}
        <div style={st(`position:absolute;top:-220px;left:50%;transform:translateX(-50%);width:1100px;height:620px;background:radial-gradient(ellipse at center, var(--glow) 0%, transparent 68%);pointer-events:none;filter:blur(10px);z-index:0;`)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.mark} alt="" aria-hidden="true" style={st(`position:absolute;top:340px;right:-260px;width:760px;opacity:.05;pointer-events:none;z-index:0;`)} />

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* NAV */}
          <header className="oz-pad" style={st(`position:sticky;top:0;z-index:50;backdrop-filter:saturate(140%) blur(14px);background:var(--nav-bg);border-bottom:1px solid var(--hairline);`)}>
            <div style={st(`max-width:1240px;margin:0 auto;padding:15px 34px;display:flex;align-items:center;justify-content:space-between;`)}>
              <div style={st(`display:flex;align-items:center;gap:11px;`)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.mark} alt="Ozance" width={30} height={33} style={{ display: "block", width: 30, height: "auto" }} />
                <span style={st(`font-size:20px;font-weight:600;letter-spacing:-.02em;`)}>Ozance</span>
              </div>
              <nav className="oz-nav-links" style={st(`display:flex;align-items:center;gap:34px;`)}>
                <a className="oz-navlink" href="#fonctionnalites" style={st(`color:var(--text-2);text-decoration:none;font-size:14.5px;font-weight:450;`)}>Fonctionnalités</a>
                <a className="oz-navlink" href="#plateforme" style={st(`color:var(--text-2);text-decoration:none;font-size:14.5px;font-weight:450;`)}>Plateforme</a>
                <a className="oz-navlink" href="#temoignages" style={st(`color:var(--text-2);text-decoration:none;font-size:14.5px;font-weight:450;`)}>Témoignages</a>
                <a className="oz-navlink" href="#tarifs" style={st(`color:var(--text-2);text-decoration:none;font-size:14.5px;font-weight:450;`)}>Tarifs</a>
              </nav>
              <div style={st(`display:flex;align-items:center;gap:14px;`)}>
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Changer de thème" className="oz-theme" style={st(`width:38px;height:38px;border-radius:10px;border:1px solid var(--hairline);background:var(--surface);color:var(--text-2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;`)}>{theme === "dark" ? "☾" : "☀"}</button>
                <Link className="oz-navlink oz-nav-links" href="/login" style={st(`color:var(--text-2);text-decoration:none;font-size:14.5px;font-weight:500;`)}>Connexion</Link>
                <Link className="oz-cta" href="/signup" style={st(`background:var(--accent);color:var(--accent-ink);text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:10px;box-shadow:0 1px 0 var(--accent-hi) inset, 0 6px 18px var(--accent-shadow);`)}>Demander une démo</Link>
              </div>
            </div>
          </header>

          {/* HERO */}
          <section className="oz-hero oz-pad" style={st(`max-width:1240px;margin:0 auto;padding:78px 34px 40px;display:grid;grid-template-columns:1.02fr 1fr;gap:54px;align-items:center;`)}>
            <div>
              <div className="oz-reveal" style={st(`display:inline-flex;align-items:center;gap:9px;padding:7px 14px 7px 11px;border:1px solid var(--hairline);background:var(--surface);border-radius:100px;font-size:13px;color:var(--text-2);margin-bottom:30px;`)}>
                <span style={st(`width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);`)} />
                Pensé pour les cabinets d&apos;avocats
              </div>
              <h1 className="oz-h1 oz-reveal" style={st(`font-family:var(--display);font-weight:600;font-size:clamp(44px,5.4vw,68px);line-height:1.02;letter-spacing:-.035em;margin:0 0 26px;`)}>
                La plateforme qui <span style={{ color: "var(--accent)" }}>pilote</span> votre cabinet.
              </h1>
              <p className="oz-reveal" style={st(`font-size:18.5px;line-height:1.62;color:var(--text-2);max-width:498px;margin:0 0 36px;font-weight:420;`)}>
                Centralisez vos dossiers, automatisez votre facturation et gardez le contrôle de votre activité depuis un seul espace.
              </p>
              <div className="oz-reveal" style={st(`display:flex;gap:13px;flex-wrap:wrap;`)}>
                <Link className="oz-cta" href="/signup" style={st(`background:var(--accent);color:var(--accent-ink);text-decoration:none;font-size:15px;font-weight:600;padding:15px 26px;border-radius:12px;box-shadow:0 1px 0 var(--accent-hi) inset,0 10px 30px var(--accent-shadow);`)}>Demander une démo</Link>
                <a className="oz-ghost" href="#plateforme" style={st(`background:var(--surface);color:var(--text);text-decoration:none;font-size:15px;font-weight:550;padding:15px 24px;border-radius:12px;border:1px solid var(--border);display:inline-flex;align-items:center;gap:9px;`)}><span style={st(`display:inline-flex;width:18px;height:18px;border-radius:50%;background:var(--accent-soft);align-items:center;justify-content:center;color:var(--accent);font-size:9px;`)}>▶</span>Voir la plateforme</a>
              </div>
              <div className="oz-reveal" style={st(`display:flex;gap:26px;flex-wrap:wrap;margin-top:34px;`)}>
                {["Sans engagement", "Migration accompagnée", "Hébergé en France · RGPD"].map((x) => (
                  <span key={x} style={st(`display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--text-3);`)}><span style={{ color: "var(--accent)" }}>✓</span> {x}</span>
                ))}
              </div>
            </div>

            {/* hero teaser window */}
            <div className="oz-reveal" style={{ position: "relative" }}>
              <div style={st(`position:absolute;inset:-30px;background:radial-gradient(circle at 60% 40%,var(--glow),transparent 70%);filter:blur(8px);z-index:0;`)} />
              <div style={st(`position:relative;z-index:1;border-radius:18px;border:1px solid var(--border);background:var(--surface);box-shadow:var(--shadow-xl);overflow:hidden;transform:var(--hero-tilt);`)}>
                <div style={st(`display:flex;align-items:center;gap:7px;padding:12px 15px;border-bottom:1px solid var(--hairline);`)}>
                  <span style={st(`width:10px;height:10px;border-radius:50%;background:var(--dot);`)} />
                  <span style={st(`width:10px;height:10px;border-radius:50%;background:var(--dot);`)} />
                  <span style={st(`width:10px;height:10px;border-radius:50%;background:var(--dot);`)} />
                  <span style={st(`margin-left:10px;font-size:11px;color:var(--text-3);font-family:var(--mono);`)}>app.ozance.fr</span>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={st(`display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;`)}>
                    <div>
                      <div style={st(`font-size:12px;color:var(--text-3);`)}>Bonjour, Maître Lambert</div>
                      <div style={st(`font-size:16px;font-weight:600;letter-spacing:-.01em;`)}>Vue d&apos;ensemble</div>
                    </div>
                    <div style={st(`font-size:11px;color:var(--text-3);font-family:var(--mono);border:1px solid var(--hairline);padding:5px 9px;border-radius:7px;`)}>Mai 2026</div>
                  </div>
                  <div style={st(`display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;`)}>
                    <div style={st(`border:1px solid var(--hairline);border-radius:11px;padding:13px;background:var(--surface-2);`)}>
                      <div style={st(`font-size:11px;color:var(--text-3);margin-bottom:7px;`)}>Chiffre d&apos;affaires</div>
                      <div style={st(`font-size:22px;font-weight:600;font-family:var(--mono);letter-spacing:-.02em;`)}>128 400 €</div>
                      <div style={st(`font-size:10.5px;color:var(--pos);margin-top:5px;`)}>▲ 18,2% vs avril</div>
                    </div>
                    <div style={st(`border:1px solid var(--hairline);border-radius:11px;padding:13px;background:var(--surface-2);`)}>
                      <div style={st(`font-size:11px;color:var(--text-3);margin-bottom:7px;`)}>Temps facturable</div>
                      <div style={st(`font-size:22px;font-weight:600;font-family:var(--mono);letter-spacing:-.02em;`)}>164 h</div>
                      <div style={st(`font-size:10.5px;color:var(--pos);margin-top:5px;`)}>▲ 8,4% vs avril</div>
                    </div>
                  </div>
                  <div style={st(`border:1px solid var(--hairline);border-radius:11px;padding:14px;background:var(--surface-2);`)}>
                    <div style={st(`display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;`)}>
                      <div style={st(`font-size:12px;font-weight:600;`)}>Facturation · 6 mois</div>
                      <div style={st(`font-size:10.5px;color:var(--text-3);font-family:var(--mono);`)}>+30%</div>
                    </div>
                    <div style={{ position: "relative", height: 74 }}><HeroChart /></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TRUST LOGOS */}
          <section className="oz-reveal oz-pad" style={st(`max-width:1240px;margin:36px auto 0;padding:18px 34px 0;`)}>
            <div style={st(`text-align:center;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-3);margin-bottom:26px;`)}>Adopté par des cabinets exigeants</div>
            <div style={st(`display:flex;align-items:center;justify-content:center;gap:54px;flex-wrap:wrap;opacity:.62;`)}>
              {logos.map((l) => (
                <span key={l} style={st(`font-family:var(--display);font-size:18px;font-weight:600;letter-spacing:.01em;color:var(--text-2);`)}>{l}</span>
              ))}
            </div>
          </section>

          {/* PLATEFORME */}
          <section id="plateforme" className="oz-pad" style={st(`max-width:1240px;margin:118px auto 0;padding:0 34px;`)}>
            <div className="oz-reveal" style={st(`text-align:center;max-width:680px;margin:0 auto 46px;`)}>
              <div style={st(`font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;font-weight:600;`)}>La plateforme</div>
              <h2 style={st(`font-family:var(--display);font-weight:600;font-size:clamp(32px,4vw,48px);line-height:1.06;letter-spacing:-.03em;margin:0 0 18px;`)}>Un seul espace pour tout piloter</h2>
              <p style={st(`font-size:17px;line-height:1.6;color:var(--text-2);margin:0;`)}>Dossiers, échéances, temps, facturation et rentabilité — réunis dans une interface pensée pour la pratique du droit.</p>
            </div>
            <div className="oz-reveal" style={{ position: "relative" }}>
              <div style={st(`position:absolute;inset:-1px;border-radius:20px;background:linear-gradient(135deg,var(--accent-soft),transparent 55%);z-index:0;`)} />
              <div className="oz-dash-shell" style={st(`position:relative;z-index:1;border:1px solid var(--border);border-radius:20px;overflow:hidden;background:var(--surface);box-shadow:var(--shadow-xl);display:grid;grid-template-columns:218px 1fr;`)}>
                <aside className="oz-dash-side" style={st(`border-right:1px solid var(--hairline);padding:18px 14px;background:var(--surface-2);`)}>
                  <div style={st(`display:flex;align-items:center;gap:9px;padding:6px 8px 18px;`)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.mark} width={22} height={24} alt="" style={{ display: "block", width: 22, height: "auto" }} />
                    <span style={st(`font-size:15px;font-weight:600;letter-spacing:-.01em;`)}>Ozance</span>
                  </div>
                  {nav.map((label, i) => {
                    const a = navActive(i);
                    return (
                      <div key={label} style={st(`display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:9px;font-size:13px;margin-bottom:2px;color:${a.color};background:${a.bg};font-weight:${a.weight};`)}>
                        <span style={st(`width:7px;height:7px;border-radius:2px;background:${a.dot};flex:none;`)} />{label}
                      </div>
                    );
                  })}
                  <div style={st(`margin-top:18px;border:1px solid var(--hairline);border-radius:12px;padding:13px;background:var(--surface);`)}>
                    <div style={st(`font-size:11.5px;font-weight:600;margin-bottom:5px;`)}>Rentabilité</div>
                    <div style={st(`font-size:11px;color:var(--text-3);line-height:1.4;margin-bottom:10px;`)}>Marge nette du mois</div>
                    <div style={st(`display:flex;align-items:baseline;gap:6px;`)}><span style={st(`font-size:21px;font-weight:600;font-family:var(--mono);`)}>68%</span><span style={st(`font-size:10.5px;color:var(--pos);`)}>▲ 4 pts</span></div>
                  </div>
                </aside>
                <div style={st(`padding:22px 24px;min-width:0;`)}>
                  <div style={st(`display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px;`)}>
                    <div>
                      <div style={st(`font-size:13px;color:var(--text-3);`)}>Tableau de bord</div>
                      <div style={st(`font-size:20px;font-weight:600;letter-spacing:-.02em;`)}>Vue d&apos;ensemble du cabinet</div>
                    </div>
                    <div style={st(`display:flex;gap:8px;`)}>
                      <span style={st(`font-size:12px;font-family:var(--mono);color:var(--text-2);border:1px solid var(--hairline);padding:7px 12px;border-radius:9px;`)}>Ce mois ▾</span>
                      <span style={st(`font-size:12px;font-weight:600;color:var(--accent-ink);background:var(--accent);padding:7px 13px;border-radius:9px;`)}>+ Nouveau dossier</span>
                    </div>
                  </div>
                  <div style={st(`display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;`)}>
                    {kpis.map((k) => (
                      <div key={k.label} style={st(`border:1px solid var(--hairline);border-radius:13px;padding:15px;background:var(--surface-2);`)}>
                        <div style={st(`font-size:11.5px;color:var(--text-3);margin-bottom:9px;`)}>{k.label}</div>
                        <div style={st(`font-size:23px;font-weight:600;font-family:var(--mono);letter-spacing:-.02em;`)}>{k.value}</div>
                        <div style={st(`font-size:10.5px;color:${k.dc};margin-top:6px;`)}>{k.delta}</div>
                      </div>
                    ))}
                  </div>
                  <div style={st(`display:grid;grid-template-columns:1.5fr 1fr;gap:12px;margin-bottom:14px;`)}>
                    <div style={st(`border:1px solid var(--hairline);border-radius:13px;padding:16px;background:var(--surface-2);`)}>
                      <div style={st(`display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;`)}>
                        <div style={st(`font-size:13px;font-weight:600;`)}>Facturation encaissée</div>
                        <div style={st(`display:flex;gap:14px;font-size:10.5px;color:var(--text-3);`)}><span style={st(`display:inline-flex;align-items:center;gap:5px;`)}><span style={st(`width:8px;height:8px;border-radius:2px;background:var(--accent);`)} />2026</span><span style={st(`display:inline-flex;align-items:center;gap:5px;`)}><span style={st(`width:8px;height:8px;border-radius:2px;background:var(--text-3);`)} />2025</span></div>
                      </div>
                      <div style={st(`display:flex;align-items:flex-end;gap:10px;height:118px;`)}>
                        {bars.map((b) => (
                          <div key={b.m} style={st(`flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;`)}>
                            <div style={st(`width:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px;height:100px;`)}>
                              <div style={st(`width:42%;height:${b.prev}%;background:var(--bar-prev);border-radius:4px 4px 0 0;`)} />
                              <div style={st(`width:42%;height:${b.cur}%;background:linear-gradient(180deg,var(--accent),var(--accent-2b));border-radius:4px 4px 0 0;`)} />
                            </div>
                            <div style={st(`font-size:10px;color:var(--text-3);font-family:var(--mono);`)}>{b.m}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={st(`border:1px solid var(--hairline);border-radius:13px;padding:16px;background:var(--surface-2);`)}>
                      <div style={st(`font-size:13px;font-weight:600;margin-bottom:12px;`)}>Prochaines échéances</div>
                      {agenda.map((a) => (
                        <div key={a.title} style={st(`display:flex;gap:11px;padding:8px 0;border-top:1px solid var(--hairline);`)}>
                          <div style={st(`flex:none;width:38px;text-align:center;`)}>
                            <div style={st(`font-size:15px;font-weight:600;font-family:var(--mono);line-height:1;`)}>{a.day}</div>
                            <div style={st(`font-size:9px;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;`)}>{a.mon}</div>
                          </div>
                          <div style={st(`min-width:0;border-left:2px solid ${a.col};padding-left:10px;`)}>
                            <div style={st(`font-size:12px;font-weight:550;`)}>{a.title}</div>
                            <div style={st(`font-size:10.5px;color:var(--text-3);`)}>{a.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={st(`border:1px solid var(--hairline);border-radius:13px;padding:16px;background:var(--surface-2);`)}>
                    <div style={st(`display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;`)}>
                      <div style={st(`font-size:13px;font-weight:600;`)}>Dossiers récents</div>
                      <div style={st(`font-size:11px;color:var(--accent);font-weight:600;`)}>Tout voir →</div>
                    </div>
                    {dossiers.map((d) => (
                      <div key={d.name} style={st(`display:flex;align-items:center;gap:13px;padding:10px 0;border-top:1px solid var(--hairline);`)}>
                        <span style={st(`width:30px;height:30px;border-radius:9px;background:${d.av};flex:none;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;`)}>{d.ini}</span>
                        <div style={st(`flex:1;min-width:0;`)}>
                          <div style={st(`font-size:12.5px;font-weight:550;`)}>{d.name}</div>
                          <div style={st(`font-size:10.5px;color:var(--text-3);`)}>{d.type}</div>
                        </div>
                        <span style={st(`font-size:10.5px;font-weight:600;padding:4px 9px;border-radius:100px;background:${d.tagbg};color:${d.tagc};`)}>{d.status}</span>
                        <span style={st(`font-size:11px;color:var(--text-3);font-family:var(--mono);flex:none;width:88px;text-align:right;`)}>{d.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FONCTIONNALITÉS */}
          <section id="fonctionnalites" className="oz-pad" style={st(`max-width:1240px;margin:120px auto 0;padding:0 34px;`)}>
            <div className="oz-reveal" style={st(`max-width:620px;margin-bottom:48px;`)}>
              <div style={st(`font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;font-weight:600;`)}>Fonctionnalités</div>
              <h2 style={st(`font-family:var(--display);font-weight:600;font-size:clamp(32px,4vw,46px);line-height:1.07;letter-spacing:-.03em;margin:0;`)}>Tout ce dont votre cabinet a besoin, au même endroit</h2>
            </div>
            <div className="oz-grid-feat" style={st(`display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--hairline);border:1px solid var(--hairline);border-radius:18px;overflow:hidden;`)}>
              {features.map((f) => (
                <div key={f.title} className="oz-feature oz-reveal" style={st(`background:var(--surface);padding:30px 28px;`)}>
                  <div style={st(`width:44px;height:44px;border-radius:12px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;margin-bottom:20px;color:var(--accent);`)}><Icon name={f.icon} /></div>
                  <div style={st(`font-size:17px;font-weight:600;letter-spacing:-.01em;margin-bottom:9px;`)}>{f.title}</div>
                  <div style={st(`font-size:14px;line-height:1.58;color:var(--text-2);`)}>{f.body}</div>
                </div>
              ))}
            </div>
          </section>

          {/* CHIFFRES */}
          <section className="oz-reveal oz-pad" style={st(`max-width:1240px;margin:110px auto 0;padding:0 34px;`)}>
            <div style={st(`border:1px solid var(--border);border-radius:22px;background:var(--band-bg);padding:54px 40px;position:relative;overflow:hidden;`)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ozance-mark-gold.png" alt="" aria-hidden="true" style={st(`position:absolute;right:-70px;bottom:-120px;width:420px;opacity:.10;pointer-events:none;`)} />
              <div className="oz-grid-3" style={st(`position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:30px;text-align:center;`)}>
                {figures.map((g) => (
                  <div key={g.num}>
                    <div style={st(`font-family:var(--display);font-size:clamp(44px,6vw,60px);font-weight:600;letter-spacing:-.03em;color:var(--band-fg);line-height:1;`)}>{g.num}</div>
                    <div style={st(`font-size:14.5px;color:var(--band-mut);margin-top:14px;max-width:240px;margin-left:auto;margin-right:auto;line-height:1.5;`)}>{g.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BÉNÉFICES */}
          <section className="oz-pad" style={st(`max-width:1240px;margin:118px auto 0;padding:0 34px;`)}>
            <div className="oz-grid-2" style={st(`display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;`)}>
              <div className="oz-reveal">
                <div style={st(`font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;font-weight:600;`)}>Bénéfices</div>
                <h2 style={st(`font-family:var(--display);font-weight:600;font-size:clamp(30px,3.6vw,42px);line-height:1.1;letter-spacing:-.03em;margin:0 0 20px;`)}>Concentrez-vous sur le droit. On gère le reste.</h2>
                <p style={st(`font-size:16.5px;line-height:1.62;color:var(--text-2);margin:0;`)}>Ozance automatise l&apos;administratif et vous redonne de la visibilité sur l&apos;activité de votre cabinet, en temps réel.</p>
              </div>
              <div className="oz-reveal" style={st(`display:flex;flex-direction:column;gap:4px;`)}>
                {benefits.map((b) => (
                  <div key={b.title} style={st(`display:flex;gap:16px;padding:18px 4px;border-top:1px solid var(--hairline);align-items:flex-start;`)}>
                    <div style={st(`flex:none;width:34px;height:34px;border-radius:9px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--accent);`)}><Icon name={b.icon} /></div>
                    <div>
                      <div style={st(`font-size:15.5px;font-weight:600;margin-bottom:4px;`)}>{b.title}</div>
                      <div style={st(`font-size:13.5px;line-height:1.55;color:var(--text-2);`)}>{b.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TÉMOIGNAGES */}
          <section id="temoignages" className="oz-pad" style={st(`max-width:1240px;margin:118px auto 0;padding:0 34px;`)}>
            <div className="oz-reveal" style={st(`text-align:center;margin-bottom:46px;`)}>
              <div style={st(`font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:14px;font-weight:600;`)}>Témoignages</div>
              <h2 style={st(`font-family:var(--display);font-weight:600;font-size:clamp(30px,3.6vw,44px);line-height:1.08;letter-spacing:-.03em;margin:0;`)}>Des associés qui ont repris le contrôle</h2>
            </div>
            <div className="oz-grid-3" style={st(`display:grid;grid-template-columns:repeat(3,1fr);gap:18px;`)}>
              {quotes.map((q) => (
                <div key={q.name} className="oz-quote oz-reveal" style={st(`border:1px solid var(--border);border-radius:18px;padding:28px;background:var(--surface);display:flex;flex-direction:column;`)}>
                  <div style={st(`font-family:var(--display);font-size:34px;line-height:1;color:var(--accent);margin-bottom:6px;`)}>&ldquo;</div>
                  <p style={st(`font-size:15.5px;line-height:1.55;color:var(--text);margin:0 0 22px;flex:1;font-weight:450;`)}>{q.text}</p>
                  <div style={st(`display:flex;align-items:center;gap:12px;`)}>
                    <span style={st(`width:40px;height:40px;border-radius:50%;background:${q.av};flex:none;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff;`)}>{q.ini}</span>
                    <div>
                      <div style={st(`font-size:13.5px;font-weight:600;`)}>{q.name}</div>
                      <div style={st(`font-size:12px;color:var(--text-3);`)}>{q.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA FINAL */}
          <section id="tarifs" className="oz-reveal oz-pad" style={st(`max-width:1240px;margin:120px auto 0;padding:0 34px;`)}>
            <div style={st(`position:relative;border-radius:26px;overflow:hidden;background:var(--cta-bg);border:1px solid var(--cta-border);padding:64px 40px;text-align:center;`)}>
              <div style={st(`position:absolute;top:-160px;left:50%;transform:translateX(-50%);width:760px;height:420px;background:radial-gradient(ellipse at center,var(--accent-soft),transparent 70%);pointer-events:none;`)} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ozance-mark-gold.png" alt="" aria-hidden="true" style={st(`position:absolute;left:-90px;top:-60px;width:300px;opacity:.12;pointer-events:none;`)} />
              <div style={{ position: "relative" }}>
                <h2 style={st(`font-family:var(--display);font-weight:600;font-size:clamp(32px,4.4vw,52px);line-height:1.05;letter-spacing:-.03em;margin:0 0 18px;color:var(--cta-fg);`)}>Reprenez le contrôle de votre cabinet</h2>
                <p style={st(`font-size:17.5px;line-height:1.55;color:var(--cta-mut);max-width:520px;margin:0 auto 32px;`)}>Découvrez Ozance en démo et voyez ce que vous pourriez gagner dès le premier mois.</p>
                <div style={st(`display:flex;gap:13px;justify-content:center;flex-wrap:wrap;`)}>
                  <Link className="oz-cta" href="/signup" style={st(`background:var(--accent);color:var(--accent-ink);text-decoration:none;font-size:15.5px;font-weight:600;padding:16px 30px;border-radius:12px;box-shadow:0 1px 0 var(--accent-hi) inset,0 10px 30px var(--accent-shadow);`)}>Demander une démo</Link>
                  <a className="oz-ghost" href="mailto:contact@ozance.fr" style={st(`background:transparent;color:var(--cta-fg);text-decoration:none;font-size:15.5px;font-weight:550;padding:16px 26px;border-radius:12px;border:1px solid var(--cta-border-2);`)}>Parler à un conseiller</a>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="oz-pad" style={st(`max-width:1240px;margin:80px auto 0;padding:0 34px 56px;`)}>
            <div style={st(`border-top:1px solid var(--hairline);padding-top:34px;display:flex;align-items:flex-start;justify-content:space-between;gap:30px;flex-wrap:wrap;`)}>
              <div style={{ maxWidth: 300 }}>
                <div style={st(`display:flex;align-items:center;gap:10px;margin-bottom:14px;`)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.mark} width={26} height={28} alt="" style={{ display: "block", width: 26, height: "auto" }} />
                  <span style={st(`font-size:18px;font-weight:600;letter-spacing:-.02em;`)}>Ozance</span>
                </div>
                <p style={st(`font-size:13.5px;line-height:1.55;color:var(--text-3);margin:0;`)}>La plateforme qui pilote votre cabinet. Conçue en France pour les avocats.</p>
              </div>
              <div style={st(`display:flex;gap:60px;flex-wrap:wrap;`)}>
                {footer.map((col) => (
                  <div key={col.head}>
                    <div style={st(`font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);margin-bottom:14px;`)}>{col.head}</div>
                    {col.items.map((it) => (
                      <a key={it} className="oz-footlink" href="#" style={st(`display:block;font-size:13.5px;color:var(--text-2);text-decoration:none;margin-bottom:10px;`)}>{it}</a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={st(`border-top:1px solid var(--hairline);margin-top:30px;padding-top:22px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:12.5px;color:var(--text-3);`)}>
              <span>© 2026 Ozance — Tous droits réservés</span>
              <span style={st(`display:inline-flex;gap:20px;flex-wrap:wrap;`)}><span>Hébergé en France</span><span>Conforme RGPD</span><span>ISO 27001</span></span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
