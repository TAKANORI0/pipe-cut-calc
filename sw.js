// 配管切寸法計算 Service Worker — 完全オフライン動作
// impact-src: 2026-08-15-vault-github-backup（GitHub Pages配信・PWA化）
//
// 方針: cache-first + 裏で更新（stale-while-revalidate）。
// 現場は圏外前提なのでキャッシュ優先。電波があるときに次回分を静かに更新する。
// バージョンはデプロイスクリプトが日付で書き換える。
const CACHE = "pipe-cut-calc-20260815";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      const refresh = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      // ナビゲーションはキャッシュ即返し（圏外で白画面にしない）。無ければネット
      return cached || refresh;
    })
  );
});
