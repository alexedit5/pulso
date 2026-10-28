// Pulso · service worker
// Guarda só a casca do painel (HTML, JS, CSS, ícones) para o app instalado abrir rápido.
// Dados (Supabase), fontes e qualquer outro domínio passam direto: nunca ficam em cache aqui.

const CACHE = "pulso-casca-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil((async () => {
    for (const nome of await caches.keys()) if (nome !== CACHE) await caches.delete(nome);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  const url = new URL(pedido.url);
  if (pedido.method !== "GET" || url.origin !== self.location.origin) return;

  // Página: rede primeiro (sempre a versão publicada mais nova); sem internet, a última guardada.
  if (pedido.mode === "navigate") {
    evento.respondWith((async () => {
      try {
        const resposta = await fetch(pedido);
        const cache = await caches.open(CACHE);
        cache.put("./", resposta.clone());
        return resposta;
      } catch {
        return (await caches.match("./")) ?? Response.error();
      }
    })());
    return;
  }

  // Arquivos com hash no nome (assets/) e ícones: do cache, e buscados uma vez só.
  evento.respondWith((async () => {
    const guardado = await caches.match(pedido);
    if (guardado) return guardado;
    const resposta = await fetch(pedido);
    if (resposta.ok) (await caches.open(CACHE)).put(pedido, resposta.clone());
    return resposta;
  })());
});
