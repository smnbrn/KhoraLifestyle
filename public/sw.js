const CACHE_NAME = "gestionale-shell-v1";
// Solo asset statici e innocui: MAI pagine autenticate o risposte con dati
// (fatture, clienti, importi...). Una PWA che mettesse in cache quelli
// rischierebbe di mostrare dati scaduti o, su un dispositivo condiviso,
// di un altro utente dopo un logout.
const STATIC_ASSETS = ["/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo i pochi asset statici elencati sopra passano dalla cache;
  // tutto il resto (pagine, dati, autenticazione) va sempre in rete.
  if (STATIC_ASSETS.some((path) => request.url.endsWith(path))) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }
  // Nessun intercetto per il resto: passa dritto alla rete come farebbe
  // il browser senza service worker.
});
