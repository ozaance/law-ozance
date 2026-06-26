# Templates d'emails Supabase (Auth)

Les emails **de connexion / confirmation** (inscription, lien magique, réinitialisation
de mot de passe) sont envoyés par **Supabase**, pas par notre code. Par défaut ils
utilisent un template générique peu pro. Ces fichiers HTML reprennent l'identité Ozance.

## Où les coller

Dashboard Supabase → **Authentication → Emails → Templates**

| Template Supabase | Fichier à coller |
|---|---|
| **Confirm signup** | `confirm-signup.html` |
| **Magic Link** | `magic-link.html` |
| **Reset Password** | `reset-password.html` |

Pour chaque template : remplacez le **Message body (HTML)** par le contenu du fichier,
puis enregistrez. Vous pouvez aussi adapter le **Subject** (objet) :

- Confirm signup → `Confirmez votre adresse — Ozance`
- Magic Link → `Votre lien de connexion Ozance`
- Reset Password → `Réinitialisez votre mot de passe Ozance`

## Variables

Les `{{ .ConfirmationURL }}` sont remplies automatiquement par Supabase. Ne pas y toucher.

## Délivrabilité (important)

Pour que ces emails partent depuis `@ozance.fr` (et non l'expéditeur Supabase par
défaut, souvent en spam) : configurez un **SMTP personnalisé** dans
Authentication → Emails → **SMTP Settings** avec les identifiants Resend une fois
le domaine `ozance.fr` vérifié dans Resend.
