"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsNative } from "@/lib/native";

// Verrouillage biométrique de l'app native (Face ID / Touch ID).
// Au lancement, si l'appareil dispose de la biométrie, on masque le contenu
// derrière un écran de déverrouillage jusqu'à authentification réussie.
// Sur le web (ou sans biométrie), ce composant ne rend rien.
export function NativeGuard() {
  const native = useIsNative();
  const [locked, setLocked] = useState(false);

  const verify = useCallback(async () => {
    const { NativeBiometric } = await import(
      "@capgo/capacitor-native-biometric"
    );
    try {
      await NativeBiometric.verifyIdentity({
        reason: "Accédez à Ozance en toute sécurité",
        title: "Ozance",
        subtitle: "Déverrouillage",
        description: "Confirmez votre identité",
        useFallback: true,
        negativeButtonText: "Annuler",
      });
      setLocked(false);
    } catch {
      setLocked(true);
    }
  }, []);

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    (async () => {
      // Masque le splash natif dès que le webview est prêt.
      const { SplashScreen } = await import("@capacitor/splash-screen");
      await SplashScreen.hide().catch(() => {});

      const { NativeBiometric } = await import(
        "@capgo/capacitor-native-biometric"
      );
      let available = false;
      try {
        const res = await NativeBiometric.isAvailable({ useFallback: true });
        available = res.isAvailable;
      } catch {
        available = false;
      }
      if (cancelled || !available) return;
      setLocked(true);
      await verify();
    })();
    return () => {
      cancelled = true;
    };
  }, [native, verify]);

  if (!native || !locked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-surface px-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ozance-mark-navy.png"
        alt="Ozance"
        width={56}
        className="h-14 w-auto dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ozance-mark-gold.png"
        alt="Ozance"
        width={56}
        className="hidden h-14 w-auto dark:block"
      />
      <div>
        <p className="text-lg font-semibold tracking-tight">
          Ozance est verrouillé
        </p>
        <p className="mt-1 max-w-xs text-sm text-muted">
          Déverrouillez avec Face ID ou Touch ID pour accéder à vos données.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void verify()}
        className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Déverrouiller
      </button>
    </div>
  );
}
