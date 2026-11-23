// Service worker: permite usar la app sin internet.
// - La página y los íconos: primero internet, si no hay usa la copia guardada.
// - Librerías (Leaflet, Supabase): copia guardada (tienen versión fija).
// - Mapa: guarda los pedacitos de mapa que ya viste, para verlos sin internet.
// - Supabase / buscador de direcciones / rutas: no se tocan (la app maneja la cola sin internet).
const APP = "monedas-app-v2", LIBS = "monedas-libs-v1", TILES = "monedas-tiles-v1";
const MAX_TILES = 1500;
const PRE_APP = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-64.png"];
const PRE_LIBS = [
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"
];

self.addEventListener("install", e => {
  e.waitUntil(Promise.all([
    caches.open(APP).then(c => Promise.all(PRE_APP.map(u => c.add(u).catch(() => {})))),
    caches.open(LIBS).then(c => Promise.all(PRE_LIBS.map(u => c.add(new Request(u, { mode: "cors" })).catch(() => {}))))
  ]).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => ![APP, LIBS, TILES].includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin) return e.respondWith(redPrimero(r, u));
  if (u.hostname.endsWith("tile.openstreetmap.org")) return e.respondWith(guardadoPrimero(r, TILES, true));
  if (u.hostname === "cdn.jsdelivr.net") return e.respondWith(guardadoPrimero(r, LIBS, false));
});

const conTiempo = (p, ms) => new Promise((ok, mal) => { const t = setTimeout(() => mal(new Error("timeout")), ms); p.then(v => { clearTimeout(t); ok(v); }, x => { clearTimeout(t); mal(x); }); });

async function redPrimero(r, u) {
  const c = await caches.open(APP);
  const clave = u.origin + u.pathname;
  try {
    const res = await conTiempo(fetch(r), 6000);
    if (res && res.ok) c.put(clave, res.clone());
    return res;
  } catch (err) {
    const m = await c.match(clave) || await c.match(r, { ignoreSearch: true }) ||
      (r.mode === "navigate" ? (await c.match("./") || await c.match("index.html")) : null);
    return m || Response.error();
  }
}

let guardados = 0;
async function guardadoPrimero(r, nombre, esMapa) {
  const c = await caches.open(nombre);
  const m = await c.match(r);
  if (m) return m;
  try {
    const res = await fetch(r);
    if (res.ok || (!esMapa && res.type === "opaque")) {
      c.put(r, res.clone());
      if (esMapa && ++guardados % 25 === 0) recortar(c);
    }
    return res;
  } catch (err) { return Response.error(); }
}
async function recortar(c) {
  const ks = await c.keys();
  for (let i = 0; i < ks.length - MAX_TILES; i++) await c.delete(ks[i]);
}
