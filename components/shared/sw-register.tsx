"use client";

import { useEffect } from "react";

// Registra il service worker minimale (solo asset statici, vedi
// public/sw.js) per rendere l'app installabile da mobile. Non intercetta
// pagine autenticate o dati.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non bloccante: se la registrazione fallisce (es. in sviluppo su
        // http), l'app funziona comunque normalmente, solo non installabile.
      });
    }
  }, []);

  return null;
}
