import type { CapacitorConfig } from "@capacitor/cli";

// Configuration Capacitor — enrobe l'app Next.js déployée dans une app
// native iOS/Android. On charge le site hébergé (server.url) plutôt qu'un
// export statique, car LexFlow est rendu côté serveur.
//
// Domaine de production chargé par l'app native. Surchargeable via
// CAPACITOR_SERVER_URL (ex. pour pointer vers un environnement de test).
const config: CapacitorConfig = {
  appId: "app.ozance",
  appName: "Ozance",
  // Requis par Capacitor même en mode server.url (assets de secours).
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://ozance.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
