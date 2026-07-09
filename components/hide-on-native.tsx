"use client";

import type { ReactNode } from "react";
import { useIsNative } from "@/lib/native";

// Masque son contenu lorsque l'app tourne dans le conteneur natif (iOS/
// Android) et affiche un éventuel `fallback` à la place. Sert à respecter
// la règle Apple 3.1.1 : aucun achat de biens numériques (crédits IA,
// abonnements) via un système de paiement tiers dans l'app.
export function HideOnNative({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const native = useIsNative();
  return <>{native ? fallback : children}</>;
}
