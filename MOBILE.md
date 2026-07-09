# Ozance — Apps mobiles (iOS & Android)

L'app mobile est un conteneur **Capacitor** qui charge le site de production
`https://ozance.app` (défini dans `capacitor.config.ts` → `server.url`). On
réutilise donc 100 % de l'app web ; il n'y a pas de build web séparé à embarquer.

La compilation se fait en **cloud (Codemagic)** — pas besoin d'un Mac récent.

## Contenu du dépôt
- `capacitor.config.ts` — id `app.ozance`, nom « Ozance », URL de prod.
- `assets/` — `icon.png` (1024²), `splash.png` et `splash-dark.png` (2732²), sources
  des icônes/splash. **À remplacer par des visuels définitifs quand tu veux** (le
  splash sombre est un placeholder). Opaques, sans transparence (exigence iOS).
- `codemagic.yaml` — workflows de build iOS + Android.
- Les dossiers `ios/` et `android/` **ne sont pas versionnés** : ils sont
  régénérés à chaque build par la CI (`npx cap add …`).

## Prérequis (comptes)
1. **Apple Developer Program** — 99 $/an — https://developer.apple.com/programs/
2. **Google Play Console** — 25 $ une fois — https://play.google.com/console
3. **Codemagic** (gratuit pour commencer) — https://codemagic.io

## Mise en route Codemagic (une fois)
1. Connecte le dépôt GitHub `ozaance/law-ozance`.
2. **iOS — signature** : Teams → Integrations → ajoute une **App Store Connect API key**
   (générée dans App Store Connect → Users and Access → Integrations → App Store
   Connect API). Nomme l'intégration `Ozance ASC` (repris dans `codemagic.yaml`).
   Codemagic gère alors automatiquement certificats et profils.
3. **Android — signature** : Teams → Code signing identities → **Upload keystore**
   (génère-en un avec `keytool`), nomme-le `ozance_keystore`.
4. **Google Play** : crée un compte de service, télécharge le JSON, mets-le dans une
   variable Codemagic `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`.
5. Lance le workflow **Ozance iOS** → l'IPA part sur **TestFlight**.

## App Store Connect (fiche de l'app)
- Crée l'app avec le bundle id **`app.ozance`**.
- Renseigne : nom, sous-titre, description, mots-clés, **captures d'écran**
  (iPhone 6.7" et 6.5" au minimum), catégorie (Business / Productivité).
- **URL de politique de confidentialité** : `https://ozance.app/confidentialite`
- **Confidentialité des données** (App Privacy) : déclare les données collectées
  (compte, contenu, identifiants) et leur usage.
- **Suppression de compte** : disponible in-app (Paramètres → Supprimer mon compte).

## Points de conformité déjà en place
- Achats masqués dans l'app native (règle Apple 3.1.1) — crédits & abonnements
  s'achètent uniquement sur le web.
- Sign in with Apple : code prêt, à activer via `NEXT_PUBLIC_APPLE_SIGNIN=true`
  une fois le provider Apple configuré dans Supabase.
- Politique de confidentialité publique + suppression de compte in-app.

## À faire plus tard (améliore l'acceptation en review Apple 4.2)
- Fonctions natives : notifications push, connexion biométrique (Face ID),
  partage natif — via des plugins Capacitor. Ça renforce la valeur « native » de
  l'app et réduit le risque de rejet « ce n'est qu'un site web ».

## Développer en local (si tu récupères un Mac récent un jour)
```bash
npm ci
npx cap add ios          # ou android
npx capacitor-assets generate
npx cap sync
npx cap open ios         # ouvre Xcode
```
