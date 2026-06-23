import { type CSSProperties } from "react";

/* Parse une chaîne CSS "a:b;c:d" en objet style React (même convention que la landing). */
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
const GOLD_LINE = "rgba(217,178,122,.30)";

function Ic({ name, size = 18 }: { name: string; size?: number }) {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "folder":
      return <svg {...c}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
    case "doc":
      return <svg {...c}><path d="M7 3h7l4 4v14H7z" /><path d="M9 11h6M9 15h4" /></svg>;
    case "upload":
      return <svg {...c}><path d="M12 16V6M8 10l4-4 4 4" /><path d="M4 20h16" /></svg>;
    case "search":
      return <svg {...c}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>;
    case "user":
      return <svg {...c}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>;
    case "people":
      return <svg {...c}><circle cx="9" cy="8" r="3.2" /><path d="M2 20c0-3.5 3-5.5 7-5.5" /><path d="M16 11a3 3 0 1 0 0-6M22 20c0-3-2-5-5-5" /></svg>;
    case "archive":
      return <svg {...c}><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" /></svg>;
    case "invoice":
      return <svg {...c}><path d="M6 3h9l3 3v15l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>;
    case "clock":
      return <svg {...c}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>;
    case "chart":
      return <svg {...c}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
    case "calendar":
      return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case "docLg":
      return <svg {...c}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>;
    case "file":
      return <svg {...c}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></svg>;
    case "statShare":
      return <svg {...c}><path d="M19 5 5 19" /><circle cx="7" cy="7" r="2.4" /><circle cx="17" cy="17" r="2.4" /></svg>;
    case "statCheck":
      return <svg {...c}><path d="M5 12l4 4 10-10" /></svg>;
    case "statShield":
      return <svg {...c}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>;
    default:
      return <svg {...c} />;
  }
}

const dossiers = [
  { name: "Société Alpha", sub: "Conseil juridique", status: "En cours", dot: ACCENT, pct: "60%", tint: true },
  { name: "Dupont c/ Martin", sub: "Contentieux commercial", status: "Audience – 3j", dot: "#5b86c4", pct: "75%", tint: false },
  { name: "Beta Conseil", sub: "Recouvrement", status: "Facturation", dot: "#4ea882", pct: "40%", tint: false },
  { name: "Société Gamma", sub: "Droit des affaires", status: "En cours", dot: ACCENT, pct: "20%", tint: false },
];

const agenda = [
  { date: "12 MAI", label: "Audience – Tribunal de commerce" },
  { date: "15 MAI", label: "Dépôt conclusions" },
  { date: "20 MAI", label: "RDV client – Société Alpha" },
];

const docs = ["Contrat de prestation.pdf", "Conclusions_Martin.pdf", "Assignation.pdf"];
const miniBars = [30, 42, 38, 55, 48, 66, 60, 90];

const stats = [
  { big: "– 8h", label: "de gestion par semaine", icon: "clock" },
  { big: "+ 30%", label: "de facturation récupérée", icon: "statShare" },
  { big: "100%", label: "de vos données centralisées et sécurisées", icon: "statCheck" },
  { big: "Conforme RGPD", label: "Hébergé en France", icon: "statShield" },
];

/* Courbe « Évolution du chiffre d'affaires » (12 mois) — calcul déterministe. */
function RevenueChart() {
  const data = [8, 11, 9, 13, 12, 16, 15, 14, 20, 28, 25, 30];
  const w = 420, h = 120, pl = 8, pr = 8, pt = 14, pb = 22;
  const max = Math.max(...data), min = Math.min(...data);
  const X = (i: number) => pl + (i / (data.length - 1)) * (w - pl - pr);
  const Y = (v: number) => pt + (1 - (v - min) / (max - min)) * (h - pt - pb);
  const pts = data.map((v, i) => [X(i), Y(v)] as const);
  const line = pts.map((c, i) => (i ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1)).join(" ");
  const area = `${line} L ${X(data.length - 1)} ${h - pb} L ${pl} ${h - pb} Z`;
  const months = ["Janv.", "Fév.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
  const tipI = 8;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id="oz-feat-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.30" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={pl} x2={w - pr} y1={pt} y2={pt} stroke="rgba(127,127,127,.10)" strokeWidth={1} />
      <line x1={pl} x2={w - pr} y1={h - pb} y2={h - pb} stroke="rgba(127,127,127,.10)" strokeWidth={1} />
      <path d={area} fill="url(#oz-feat-area)" />
      <path d={line} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((c, i) => (
        <circle key={i} cx={c[0]} cy={c[1]} r={i === tipI ? 3.4 : 2} fill={i === tipI ? ACCENT : "var(--surface-2)"} stroke={ACCENT} strokeWidth={i === tipI ? 0 : 1.4} />
      ))}
      {months.map((m, i) => (
        <text key={m} x={X(i)} y={h - 6} fill="var(--text-3)" fontSize="8" textAnchor="middle" fontFamily="var(--ui)">{m}</text>
      ))}
      <g transform={`translate(${X(tipI)},${Y(data[tipI]) - 22})`}>
        <rect x={-26} y={-13} width={52} height={18} rx={5} fill={ACCENT} />
        <text x={0} y={0} fill="var(--accent-ink)" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="var(--ui)">32 850 €</text>
      </g>
    </svg>
  );
}

export function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="oz-pad oz-feat2" style={st(`max-width:1240px;margin:120px auto 0;padding:0 34px;`)}>
      <style>{`
        @media (max-width:1080px){
          .oz-feat2 .ozc-top{grid-template-columns:1fr !important;}
          .oz-feat2 .ozc-bento{grid-template-columns:1fr !important;grid-template-areas:none !important;}
          .oz-feat2 .ozc-bento > *{grid-area:auto !important;}
          .oz-feat2 .ozc-bottom{grid-template-columns:1fr !important;}
          .oz-feat2 .ozc-split{grid-template-columns:1fr !important;}
          .oz-feat2 .ozc-h2{font-size:38px !important;}
        }
        @media (max-width:560px){
          .oz-feat2 .ozc-stats{grid-template-columns:1fr 1fr !important;}
          .oz-feat2 .ozc-dname{width:auto !important;flex:1 !important;min-width:0 !important;}
          .oz-feat2 .ozc-prog{display:none !important;}
          .oz-feat2 .ozc-h2{font-size:32px !important;}
        }
      `}</style>

      <div style={{ position: "relative" }}>
        {/* lumière dorée supérieure */}
        <div style={st(`position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:520px;height:90px;background:radial-gradient(ellipse at center,var(--accent-soft),transparent 70%);pointer-events:none;`)} />

        {/* ===== RANGÉE 1 : intro + dossiers ===== */}
        <div className="ozc-top oz-reveal" style={st(`display:grid;grid-template-columns:0.82fr 1.55fr;gap:22px;margin-bottom:22px;position:relative;`)}>
          {/* intro */}
          <div style={st(`padding:6px 8px;`)}>
            <div style={st(`display:inline-flex;align-items:center;gap:9px;padding:7px 15px;border:1px solid ${GOLD_LINE};border-radius:100px;margin-bottom:30px;`)}>
              <span style={st(`color:var(--accent);font-size:13px;`)}>◎</span>
              <span style={st(`font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:500;`)}>Fonctionnalités</span>
            </div>
            <h2 className="ozc-h2" style={st(`font-family:var(--display);font-weight:600;font-size:clamp(36px,4vw,54px);line-height:1.05;letter-spacing:-.02em;margin:0 0 26px;`)}>
              Tout ce dont votre cabinet a besoin,<br />
              <span style={st(`font-style:italic;color:var(--accent);`)}>au même endroit.</span>
            </h2>
            <p style={st(`font-size:16.5px;line-height:1.62;color:var(--text-2);max-width:380px;margin:0 0 34px;`)}>
              Ozance centralise, organise et automatise la gestion de votre cabinet pour vous faire gagner un temps précieux au quotidien.
            </p>
            <a href="#plateforme" style={st(`display:inline-flex;align-items:center;gap:13px;text-decoration:none;color:var(--text);font-size:15px;font-weight:500;`)}>
              <span style={st(`width:34px;height:34px;border-radius:50%;border:1px solid ${GOLD_LINE};display:flex;align-items:center;justify-content:center;color:var(--accent);`)}>→</span>
              Découvrir toutes les fonctionnalités
            </a>
          </div>

          {/* grande carte dossiers */}
          <div style={st(`position:relative;border-radius:18px;background:var(--surface);border:1px solid var(--border);overflow:hidden;padding:30px;`)}>
            <div className="ozc-split" style={st(`display:grid;grid-template-columns:1fr 1.55fr;gap:26px;height:100%;`)}>
              <div>
                <div style={st(`width:54px;height:54px;border-radius:14px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);margin-bottom:22px;`)}><Ic name="folder" size={24} /></div>
                <h3 style={st(`font-size:25px;font-weight:600;letter-spacing:-.01em;margin:0 0 14px;`)}>Gestion des dossiers</h3>
                <p style={st(`font-size:14.5px;line-height:1.6;color:var(--text-2);margin:0 0 28px;max-width:300px;`)}>Centralisez toutes les pièces, parties, échéances et l&apos;historique de chaque affaire en un seul endroit.</p>
                <div style={st(`display:flex;gap:40px;`)}>
                  <div>
                    <div style={st(`font-size:34px;font-weight:600;letter-spacing:-.02em;`)}>128</div>
                    <div style={st(`font-size:13px;color:var(--text-3);margin-top:4px;`)}>Dossiers actifs</div>
                  </div>
                  <div>
                    <div style={st(`font-size:34px;font-weight:600;letter-spacing:-.02em;`)}>32</div>
                    <div style={st(`font-size:13px;color:var(--text-3);margin-top:4px;`)}>Dossiers en cours</div>
                  </div>
                </div>
              </div>
              {/* panneau applicatif dossiers */}
              <div style={st(`display:flex;gap:14px;`)}>
                <div style={st(`flex:none;display:flex;flex-direction:column;gap:14px;padding-top:4px;color:var(--text-3);`)}>
                  <span style={st(`color:var(--accent);`)}><Ic name="folder" size={16} /></span>
                  <Ic name="doc" size={16} />
                  <Ic name="upload" size={16} />
                  <Ic name="search" size={16} />
                  <Ic name="user" size={16} />
                  <Ic name="people" size={16} />
                  <Ic name="archive" size={16} />
                </div>
                <div style={st(`flex:1;min-width:0;border-left:1px solid var(--hairline);padding-left:18px;`)}>
                  <div style={st(`display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;`)}>
                    <span style={st(`font-size:15px;font-weight:600;flex:1;`)}>Dossiers</span>
                    <span style={st(`display:inline-flex;align-items:center;gap:7px;font-size:11.5px;color:var(--text-3);border:1px solid var(--hairline);border-radius:8px;padding:6px 11px;`)}>⌕ Rechercher</span>
                    <span style={st(`font-size:11.5px;font-weight:600;color:var(--accent-ink);background:var(--accent);border-radius:8px;padding:6px 11px;`)}>+ Nouveau dossier</span>
                  </div>
                  {dossiers.map((d) => (
                    <div key={d.name} style={st(`display:flex;align-items:center;gap:13px;padding:12px 10px;border-radius:11px;background:${d.tint ? "var(--accent-soft)" : "transparent"};margin-bottom:6px;`)}>
                      <span style={st(`color:var(--accent);flex:none;`)}><Ic name="folder" size={15} /></span>
                      <div className="ozc-dname" style={st(`flex:none;width:130px;`)}>
                        <div style={st(`font-size:13px;font-weight:600;`)}>{d.name}</div>
                        <div style={st(`font-size:11px;color:var(--text-3);`)}>{d.sub}</div>
                      </div>
                      <div style={st(`flex:1;display:flex;align-items:center;gap:8px;`)}>
                        <span style={st(`width:6px;height:6px;border-radius:50%;background:${d.dot};flex:none;`)} />
                        <span style={st(`font-size:11.5px;color:var(--text-2);`)}>{d.status}</span>
                      </div>
                      <div className="ozc-prog" style={st(`flex:none;width:120px;display:flex;align-items:center;gap:10px;`)}>
                        <div style={st(`flex:1;height:4px;border-radius:3px;background:var(--bar-prev);overflow:hidden;`)}><div style={st(`width:${d.pct};height:100%;background:linear-gradient(90deg,var(--accent-2b),var(--accent));border-radius:3px;`)} /></div>
                        <span style={st(`font-size:11.5px;color:var(--text-2);font-family:var(--mono);flex:none;`)}>{d.pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RANGÉES 2 + 3 : bento ===== */}
        <div className="ozc-bento oz-reveal" style={st(`display:grid;grid-template-columns:1fr 1fr 1.12fr;gap:22px;grid-template-areas:'fact temps pilot' 'agenda docs pilot';margin-bottom:22px;`)}>

          {/* Facturation */}
          <div style={st(`grid-area:fact;border-radius:18px;background:var(--surface);border:1px solid var(--border);overflow:hidden;padding:26px;`)}>
            <div className="ozc-split" style={st(`display:grid;grid-template-columns:1fr 0.92fr;gap:22px;`)}>
              <div>
                <div style={st(`display:flex;align-items:center;gap:13px;margin-bottom:18px;`)}>
                  <span style={st(`width:44px;height:44px;border-radius:12px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);`)}><Ic name="invoice" size={21} /></span>
                  <span style={st(`font-size:19px;font-weight:600;letter-spacing:-.01em;`)}>Facturation</span>
                </div>
                <p style={st(`font-size:13.5px;line-height:1.55;color:var(--text-2);margin:0 0 24px;`)}>Générez, envoyez et suivez vos factures et honoraires en quelques clics seulement.</p>
                <div style={st(`font-size:30px;font-weight:600;letter-spacing:-.02em;`)}>24 550 €</div>
                <div style={st(`display:flex;align-items:center;gap:10px;margin-top:8px;`)}>
                  <span style={st(`font-size:12.5px;color:var(--text-3);`)}>Facturé ce mois</span>
                  <span style={st(`font-size:11px;font-weight:600;color:var(--accent);background:var(--accent-soft);border:1px solid ${GOLD_LINE};border-radius:6px;padding:3px 8px;`)}>+18% vs mois dernier</span>
                </div>
              </div>
              <div style={st(`border:1px solid var(--hairline);border-radius:13px;padding:14px;background:var(--surface-2);`)}>
                <div style={st(`display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;`)}>
                  <span style={st(`font-size:11.5px;color:var(--text-2);font-family:var(--mono);`)}>Facture n°2024-045</span>
                  <span style={st(`font-size:10px;font-weight:600;color:#4ea882;background:rgba(78,168,130,.14);border-radius:5px;padding:3px 8px;`)}>Payée</span>
                </div>
                <div style={st(`font-size:11.5px;display:flex;justify-content:space-between;padding:4px 0;color:var(--text-2);`)}><span>Montant HT</span><span style={st(`font-family:var(--mono);`)}>20 450,00 €</span></div>
                <div style={st(`font-size:11.5px;display:flex;justify-content:space-between;padding:4px 0;color:var(--text-2);`)}><span>TVA</span><span style={st(`font-family:var(--mono);`)}>4 100,00 €</span></div>
                <div style={st(`font-size:11.5px;display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid var(--hairline);margin-top:4px;font-weight:600;`)}><span>Total TTC</span><span style={st(`font-family:var(--mono);color:var(--accent);`)}>24 550,00 €</span></div>
                <div style={st(`font-size:10.5px;color:var(--text-3);margin:12px 0 8px;`)}>Évolution mensuelle</div>
                <div style={st(`display:flex;align-items:flex-end;gap:5px;height:50px;`)}>
                  {miniBars.map((b, i) => (
                    <div key={i} style={st(`flex:1;height:${b}%;background:linear-gradient(180deg,var(--accent),var(--accent-2b));border-radius:2px;opacity:.9;`)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Temps passé */}
          <div style={st(`grid-area:temps;border-radius:18px;background:var(--surface);border:1px solid var(--border);overflow:hidden;padding:26px;`)}>
            <div className="ozc-split" style={st(`display:grid;grid-template-columns:1fr 0.92fr;gap:22px;`)}>
              <div>
                <div style={st(`display:flex;align-items:center;gap:13px;margin-bottom:18px;`)}>
                  <span style={st(`width:44px;height:44px;border-radius:12px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);`)}><Ic name="clock" size={21} /></span>
                  <span style={st(`font-size:19px;font-weight:600;letter-spacing:-.01em;`)}>Temps passé</span>
                </div>
                <p style={st(`font-size:13.5px;line-height:1.55;color:var(--text-2);margin:0 0 24px;`)}>Chronométrez et imputez votre temps par dossier, sans rien oublier.</p>
                <div style={st(`font-size:30px;font-weight:600;letter-spacing:-.02em;`)}>164 h</div>
                <div style={st(`display:flex;align-items:center;gap:10px;margin-top:8px;`)}>
                  <span style={st(`font-size:12.5px;color:var(--text-3);`)}>Temps facturable ce mois</span>
                </div>
                <span style={st(`display:inline-block;font-size:11px;font-weight:600;color:var(--accent);background:var(--accent-soft);border:1px solid ${GOLD_LINE};border-radius:6px;padding:3px 8px;margin-top:10px;`)}>+12% vs mois dernier</span>
              </div>
              <div style={st(`border:1px solid var(--hairline);border-radius:13px;padding:14px;background:var(--surface-2);`)}>
                <div style={st(`font-size:10.5px;color:var(--text-3);margin-bottom:10px;`)}>Session en cours</div>
                <div style={st(`display:flex;align-items:center;gap:10px;margin-bottom:16px;`)}>
                  <span style={st(`width:26px;height:26px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:9px;`)}>▶</span>
                  <span style={st(`font-size:18px;font-weight:600;font-family:var(--mono);letter-spacing:-.01em;`)}>02:35:48</span>
                </div>
                <div style={st(`font-size:10.5px;color:var(--text-3);padding-top:12px;border-top:1px solid var(--hairline);`)}>Dossier</div>
                <div style={st(`display:flex;align-items:center;justify-content:space-between;`)}><span style={st(`font-size:12.5px;font-weight:550;`)}>Dupont c/ Martin</span><span style={st(`width:7px;height:7px;border-radius:50%;background:#4ea882;`)} /></div>
                <div style={st(`font-size:10.5px;color:var(--text-3);margin-top:10px;`)}>Tâche</div>
                <div style={st(`font-size:12.5px;font-weight:550;margin-bottom:14px;`)}>Rédaction conclusions</div>
                <div style={st(`text-align:center;font-size:11.5px;font-weight:600;border:1px solid var(--hairline);border-radius:9px;padding:9px;color:var(--text);`)}>Imputer le temps</div>
              </div>
            </div>
          </div>

          {/* Pilotage (haute) */}
          <div style={st(`grid-area:pilot;border-radius:18px;background:var(--surface);border:1px solid ${GOLD_LINE};overflow:hidden;padding:26px;box-shadow:0 0 0 1px ${GOLD_LINE} inset, var(--shadow-md);`)}>
            <div style={st(`display:flex;align-items:flex-start;gap:14px;margin-bottom:22px;`)}>
              <span style={st(`width:44px;height:44px;border-radius:12px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);flex:none;`)}><Ic name="chart" size={21} /></span>
              <div>
                <div style={st(`font-size:19px;font-weight:600;letter-spacing:-.01em;margin-bottom:5px;`)}>Pilotage du cabinet</div>
                <p style={st(`font-size:13px;line-height:1.5;color:var(--text-2);margin:0;`)}>Suivez votre rentabilité, votre charge de travail et votre activité en temps réel pour prendre les bonnes décisions.</p>
              </div>
            </div>
            <div style={st(`display:flex;gap:34px;margin-bottom:22px;flex-wrap:wrap;`)}>
              <div><div style={st(`font-size:27px;font-weight:600;letter-spacing:-.02em;`)}>32 850 €</div><div style={st(`font-size:12px;color:var(--text-3);margin-top:4px;`)}>Chiffre d&apos;affaires</div></div>
              <div><div style={st(`font-size:27px;font-weight:600;letter-spacing:-.02em;`)}>68%</div><div style={st(`font-size:12px;color:var(--text-3);margin-top:4px;`)}>Taux de facturation</div></div>
              <div><div style={st(`font-size:27px;font-weight:600;letter-spacing:-.02em;color:var(--accent);`)}>+18%</div><div style={st(`font-size:12px;color:var(--text-3);margin-top:4px;`)}>Rentabilité</div></div>
            </div>
            <div style={st(`border:1px solid var(--hairline);border-radius:13px;padding:16px;background:var(--surface-2);margin-bottom:14px;`)}>
              <div style={st(`display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;`)}>
                <span style={st(`font-size:13px;font-weight:600;`)}>Évolution du chiffre d&apos;affaires</span>
                <span style={st(`font-size:11px;color:var(--text-3);border:1px solid var(--hairline);border-radius:7px;padding:5px 10px;`)}>12 derniers mois ▾</span>
              </div>
              <div style={st(`position:relative;height:120px;`)}><RevenueChart /></div>
            </div>
            <div style={st(`border:1px solid var(--hairline);border-radius:13px;padding:15px 16px;background:var(--surface-2);display:flex;align-items:center;gap:16px;`)}>
              <div style={st(`flex:1;`)}>
                <div style={st(`display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;`)}><span style={st(`font-size:12.5px;font-weight:600;`)}>Charge de travail</span><span style={st(`font-size:13px;font-weight:600;font-family:var(--mono);`)}>68%</span></div>
                <div style={st(`height:5px;border-radius:3px;background:var(--bar-prev);overflow:hidden;`)}><div style={st(`width:68%;height:100%;background:linear-gradient(90deg,var(--accent-2b),var(--accent));border-radius:3px;`)} /></div>
              </div>
              <div style={st(`display:flex;align-items:center;gap:10px;flex:none;`)}>
                <div style={st(`display:flex;`)}>
                  <span style={st(`width:26px;height:26px;border-radius:50%;background:#5b86c4;border:2px solid var(--surface-2);`)} />
                  <span style={st(`width:26px;height:26px;border-radius:50%;background:#c69a5e;border:2px solid var(--surface-2);margin-left:-9px;`)} />
                  <span style={st(`width:26px;height:26px;border-radius:50%;background:#4ea882;border:2px solid var(--surface-2);margin-left:-9px;`)} />
                </div>
                <span style={st(`font-size:11.5px;color:var(--text-2);`)}>12 collaborateurs</span>
              </div>
            </div>
          </div>

          {/* Agenda */}
          <div style={st(`grid-area:agenda;border-radius:18px;background:var(--surface);border:1px solid var(--border);overflow:hidden;padding:26px;`)}>
            <div style={st(`display:flex;align-items:center;gap:13px;margin-bottom:16px;`)}>
              <span style={st(`width:44px;height:44px;border-radius:12px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);`)}><Ic name="calendar" size={21} /></span>
              <span style={st(`font-size:19px;font-weight:600;letter-spacing:-.01em;`)}>Agenda &amp; échéances</span>
            </div>
            <p style={st(`font-size:13.5px;line-height:1.55;color:var(--text-2);margin:0 0 20px;`)}>Audiences, délais de procédure et rendez-vous, jamais manqués.</p>
            <div style={st(`border:1px solid var(--hairline);border-radius:13px;padding:6px 14px;background:var(--surface-2);margin-bottom:18px;`)}>
              {agenda.map((a, i) => (
                <div key={a.label} style={st(`display:flex;gap:16px;align-items:center;padding:11px 0;${i ? "border-top:1px solid var(--hairline);" : ""}`)}>
                  <span style={st(`font-size:11px;font-family:var(--mono);color:var(--accent);flex:none;width:48px;`)}>{a.date}</span>
                  <span style={st(`font-size:13px;color:var(--text);`)}>{a.label}</span>
                </div>
              ))}
            </div>
            <a href="#plateforme" style={st(`font-size:13.5px;font-weight:600;color:var(--accent);text-decoration:none;`)}>Voir tout l&apos;agenda →</a>
          </div>

          {/* Documents */}
          <div style={st(`grid-area:docs;border-radius:18px;background:var(--surface);border:1px solid var(--border);overflow:hidden;padding:26px;`)}>
            <div style={st(`display:flex;align-items:center;gap:13px;margin-bottom:16px;`)}>
              <span style={st(`width:44px;height:44px;border-radius:12px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);`)}><Ic name="docLg" size={21} /></span>
              <span style={st(`font-size:19px;font-weight:600;letter-spacing:-.01em;`)}>Documents</span>
            </div>
            <p style={st(`font-size:13.5px;line-height:1.55;color:var(--text-2);margin:0 0 20px;`)}>Modèles, signatures et coffre-fort numérique sécurisé pour chaque client.</p>
            <div style={st(`margin-bottom:18px;`)}>
              {docs.map((f) => (
                <div key={f} style={st(`display:flex;align-items:center;gap:12px;padding:13px 14px;border:1px solid var(--hairline);border-radius:11px;background:var(--surface-2);margin-bottom:8px;`)}>
                  <span style={st(`color:#d4624f;flex:none;`)}><Ic name="file" size={16} /></span>
                  <span style={st(`flex:1;font-size:13px;color:var(--text);`)}>{f}</span>
                  <span style={st(`color:var(--text-3);font-size:13px;`)}>›</span>
                </div>
              ))}
            </div>
            <a href="#plateforme" style={st(`font-size:13.5px;font-weight:600;color:var(--accent);text-decoration:none;`)}>Voir tous les documents →</a>
          </div>
        </div>

        {/* ===== BAS : stats + témoignage ===== */}
        <div className="ozc-bottom oz-reveal" style={st(`display:grid;grid-template-columns:1.55fr 1fr;gap:22px;`)}>
          <div className="ozc-stats" style={st(`border-radius:18px;background:var(--surface);border:1px solid var(--border);overflow:hidden;padding:30px 26px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;align-items:center;`)}>
            {stats.map((s) => (
              <div key={s.label} style={st(`display:flex;align-items:center;gap:14px;`)}>
                <span style={st(`width:42px;height:42px;border-radius:50%;border:1px solid ${GOLD_LINE};display:flex;align-items:center;justify-content:center;color:var(--accent);flex:none;`)}><Ic name={s.icon} size={18} /></span>
                <div>
                  <div style={st(`font-size:18px;font-weight:600;letter-spacing:-.01em;`)}>{s.big}</div>
                  <div style={st(`font-size:11.5px;color:var(--text-3);line-height:1.35;margin-top:2px;`)}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={st(`border-radius:18px;background:var(--surface);border:1px solid var(--border);overflow:hidden;padding:26px 28px;display:flex;flex-direction:column;justify-content:center;`)}>
            <div style={st(`font-family:var(--display);font-size:30px;line-height:0;color:var(--accent);height:14px;`)}>&ldquo;</div>
            <p style={st(`font-size:13.5px;line-height:1.55;color:var(--text);margin:0 0 18px;font-style:italic;`)}>Ozance nous a permis de reprendre le contrôle sur notre activité et de nous recentrer sur l&apos;essentiel : nos clients.</p>
            <div style={st(`display:flex;align-items:center;gap:13px;`)}>
              <span style={st(`width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#3a4250,#2a313c);flex:none;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--accent);`)}>JM</span>
              <div>
                <div style={st(`font-size:13.5px;font-weight:600;`)}>Maître Julien Moreau</div>
                <div style={st(`font-size:12px;color:var(--text-3);`)}>Associé — Cabinet Moreau &amp; Associés</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
