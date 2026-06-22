# LexFlow — Architecture

> CRM / logiciel de gestion pour cabinets d'avocats (2–5 avocats), spécialité **droit des affaires**.
> Premier client : **AXLAW** (validé). Modèle : abonnement 49–99 €/mois par cabinet.

Ce document cadre l'architecture **avant** tout développement. Inspiré des standards du
marché (Clio, MyCase, PracticePanther à l'international ; Jarvis Legal, Secib/Septeo,
Kleos en France), adapté à un petit cabinet de droit des affaires.

---

## 1. Stack technique

| Couche | Choix | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) + React 19 + TypeScript | ⚠️ version avec breaking changes — lire `node_modules/next/dist/docs/` avant de coder |
| UI | **Tailwind v4** | design system à poser (tokens) |
| Base de données | **Postgres** (via Supabase) | relationnel, adapté au métier |
| Auth / Storage / RLS | **Supabase** | hébergé **UE**, isolation multi-tenant par RLS |
| Paiements | **Stripe** | abonnements 49–99 €/mois |

### Contraintes métier (non négociables pour des avocats)
- **Secret professionnel + RGPD** : hébergement UE, chiffrement, journalisation des accès.
- **Multi-tenant strict** : aucune fuite de données entre cabinets (Supabase RLS, `cabinet_id` sur chaque table).
- **Conflits d'intérêts** : vérification possible à la création d'un client/dossier.

---

## 2. Les 5 modules (alignés sur les leaders du marché)

| # | Module | Inspiré de | Contenu clé |
|---|---|---|---|
| 1 | **Clients & Prospects (CRM)** | Clio Grow, intake | Entreprises + personnes, contacts, prise de contact (intake), vérification de conflit, historique |
| 2 | **Dossiers / Affaires (Matters)** | cœur de tout PMS | Dossier lié à un client + avocat responsable, type d'affaire (M&A, contrat, contentieux…), statut, notes |
| 3 | **Agenda & Échéances** | Calendaring + deadlines | RDV, audiences, **délais** (contractuels & procéduraux), rappels automatiques |
| 4 | **Temps & Facturation** | Time tracking + billing | Saisie du temps (taux horaire), notes d'honoraires/factures, suivi des paiements |
| 5 | **Documents (GED)** | Document management | Stockage par dossier, modèles, versions, signature (phase 2) |

**Transversal (fonctionnalités, pas modules) :** tableau de bord, recherche globale,
portail client (phase 2), notifications.

---

## 3. Modèle de données (esquisse)

```
Cabinet (tenant)
 ├─ users            (avocats / collaborateurs, rôles : admin, avocat, assistant)
 ├─ clients          (type: entreprise|particulier) ─── contacts
 ├─ dossiers         (client_id, avocat_id, type, statut)
 │   ├─ echeances    (dossier_id, date, type, rappel)
 │   ├─ time_entries (dossier_id, user_id, durée, taux)
 │   └─ documents    (dossier_id, fichier, version)
 ├─ factures         (client_id, dossier_id, lignes, statut paiement)
 └─ subscription     (Stripe customer/subscription)
```

Toutes les tables portent `cabinet_id` (clé de tenant) + policies RLS Supabase.

---

## 4. Rôles & permissions

| Rôle | Droits |
|---|---|
| **Admin cabinet** | tout + gestion users + abonnement |
| **Avocat** | ses dossiers + clients + facturation |
| **Assistant** | agenda, documents, saisie (lecture facturation) |

---

## 5. Plan de build (tranches verticales)

1. **Fondations** — nettoyage starter, Supabase (auth + schéma `cabinet`/`users`), layout & navigation, design tokens, multi-tenant.
2. **Module 1 — Clients & Prospects** (tranche verticale complète).
3. **Module 2 — Dossiers** (cœur métier).
4. **Module 3 — Agenda & Échéances**.
5. **Module 4 — Temps & Facturation** + intégration Stripe (abonnement cabinet).
6. **Module 5 — Documents (GED)**.
7. **Polish** — tableau de bord, recherche, portail client.

---

## 6. À décider plus tard (phase 2)
- Signature électronique (Yousign — acteur FR).
- Portail client (accès sécurisé aux dossiers/factures).
- Comptabilité / maniement de fonds (CARPA) si besoin.
- RPVA / intégrations procédure (surtout si contentieux).
