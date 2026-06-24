import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://law-ozance-pbki.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Espaces authentifiés : pas d'indexation.
      disallow: [
        "/dashboard",
        "/dossiers",
        "/clients",
        "/factures",
        "/agenda",
        "/temps",
        "/equipe",
        "/abonnement",
        "/parametres",
        "/onboarding",
        "/invitation",
        "/nouveau-mot-de-passe",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
