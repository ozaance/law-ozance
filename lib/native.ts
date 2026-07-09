"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

// Détecte si l'app tourne dans le conteneur natif (iOS/Android) plutôt que
// dans un navigateur web. Démarre à `false` (rendu serveur) puis se met à
// jour après montage — évite tout décalage d'hydratation.
export function useIsNative(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => {
    setNative(Capacitor.isNativePlatform());
  }, []);
  return native;
}

// Plateforme courante : "ios" | "android" | "web".
export function useNativePlatform(): "ios" | "android" | "web" {
  const [platform, setPlatform] = useState<"ios" | "android" | "web">("web");
  useEffect(() => {
    setPlatform(Capacitor.getPlatform() as "ios" | "android" | "web");
  }, []);
  return platform;
}
