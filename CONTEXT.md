# LexFlow — Contexte Projet

## Stack technique
- **Framework** : Next.js 16.2.9 (App Router, Turbopack)
- **Base de données** : Supabase (PostgreSQL) — projet ID `tcqyrxpgfeyzyxtgmbmh`, région `eu-west-3` (Paris)
- **Auth** : Supabase Auth
- **Paiement** : Stripe (webhook configuré sur `/stripe/webhook`)
- **Déploiement** : Vercel (cible)
- **Language** : TypeScript
- **Style** : Tailwind CSS

## Structure du projet
- App Router Next.js, pas de dossier `src/`
- Code dans `/app`

## Modules implémentés
| Module | Routes | Statut |
|--------|--------|--------|
| Auth | `/login`, `/signup`, `/auth/confirm` | ✅ |
| Dashboard | `/dashboard` | ✅ |
| Clients | `/clients`, `/clients/new`, `/clients/[id]` | ✅ |
| Dossiers | `/dossiers`, `/dossiers/new`, `/dossiers/[id]` | ✅ |
| Agenda | `/agenda`, `/agenda/new`, `/agenda/[id]` | ✅ |
| Factures | `/factures`, `/factures/new`, `/factures/[id]` | ✅ |
| Documents | `/documents` (upload + actions) | ✅ |
| Temps | `/temps` (suivi du temps) | ✅ |
| Abonnement | `/abonnement` | ✅ |
| Onboarding | `/onboarding` | ✅ |
| Paramètres | `/parametres` | ✅ |

## Pattern de code
Chaque module suit le même pattern :
- `page.tsx` — affichage
- `actions.ts` — Server Actions Supabase
- `[module]-form.tsx` — formulaire
- `constants.ts` — constantes/types
- `data.ts` — helpers de fetch (certains modules)

## Contexte business
- SaaS CRM pour cabinets d'avocats
- Co-fondateurs : Osée (Powamekka) + associé
- Modèle : abonnement mensuel par cabinet (~49–99€/mois)
- Cible : petits cabinets francophones

## État actuel
- Build production : ✅ clean (20 pages, 0 erreur)
- Supabase connecté : à confirmer (connection string en cours de configuration)
- Déployé Vercel : ❌ pas encore

## Prochaines étapes
1. Confirmer connexion Supabase (DATABASE_URL + DIRECT_URL dans `.env.local`)
2. Déployer sur Vercel (`npx vercel --prod`)
3. Configurer les variables d'env sur Vercel dashboard
4. Tester le flow complet login → dashboard
