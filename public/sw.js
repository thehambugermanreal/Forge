// Forge Proxy Service Worker — Scramjet-backed
// The Scramjet bundle auto-initializes when self.$scramjet config exists.

// ── Set Scramjet config BEFORE importing the bundle ─────────────────────────────
self.$scramjet = {
  codec: 'plain',
  prefix: '/proxy/',
  wal: 'wss://wisp.mercurywork.shop/wisp/',
};

// ── Import Scramjet SW runtime (auto-hooks fetch events) ────────────────────────
let scramjetLoaded = false;
try {
  importScripts('/proxy/scramjet/scramjet.all.js');
  scramjetLoaded = true;
  console.log('[Forge SW] Scramjet runtime loaded successfully');
} catch (e) {
  console.warn('[Forge SW] scramjet.all.js failed to load:', e.message);
}

// ── If Scramjet loaded, it auto-hooked fetch. Add install/activate handlers. ────
if (scramjetLoaded) {
  self.addEventListener('install', (e) => {
    console.log('[Forge SW] Scramjet install — skipping waiting');
    e.waitUntil(self.skipWaiting());
  });

  self.addEventListener('activate', (e) => {
    console.log('[Forge SW] Scramjet activate — claiming clients');
    e.waitUntil(self.clients.claim());
  });

} else {
  // ── Fallback proxy (no Scramjet) ────────────────────────────────────────────
  console.warn('[Forge SW] Running in fallback mode');

  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

  const PROXY_PREFIX = '/proxy/';

  self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    // Skip Scramjet/Epoxy static files
    if (url.pathname.startsWith('/proxy/scramjet/') || url.pathname.startsWith('/proxy/epoxy/')) {
      e.respondWith(fetch(e.request));
      return;
    }
    if (url.pathname.startsWith(PROXY_PREFIX)) {
      e.respondWith(handleProxy(e.request, url));
      return;
    }
    e.respondWith(fetch(e.request).catch(() => new Response('Network error', { status: 503 })));
  });

  async function handleProxy(request, url) {
    const encoded = url.pathname.slice(PROXY_PREFIX.length);
    if (!encoded) return new Response('No URL', { status: 400 });

    const targetUrl = decodeBase64Url(encoded) || decodeURIComponent(encoded);
    if (!targetUrl || !targetUrl.startsWith('http')) {
      return new Response('Invalid URL: ' + encoded, { status: 400 });
    }

    console.log('[Forge SW Fallback] Proxying:', targetUrl);

    try {
      const resp = await fetch(targetUrl, {
        method: request.method,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        redirect: 'follow',
      });

      const ct = resp.headers.get('content-type') || 'text/html';
      const isText = ct.includes('text/') || ct.includes('javascript') || ct.includes('json');

      if (isText) {
        const body = await resp.text();
        const rewritten = ct.includes('text/html') ? rewriteHtml(body, targetUrl) : body;
        return new Response(rewritten, {
          status: resp.status,
          headers: { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*' },
        });
      } else {
        const body = await resp.arrayBuffer();
        return new Response(body, {
          status: resp.status,
          headers: { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*' },
        });
      }
    } catch (err) {
      return new Response('Proxy error: ' + err.message, {
        status: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  function decodeBase64Url(str) {
    try {
      const padded = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = padded.length % 4;
      const padded2 = pad ? padded + '='.repeat(4 - pad) : padded;
      return decodeURIComponent(escape(atob(padded2)));
    } catch { return null; }
  }

  function encodeBase64Url(url) {
    return btoa(unescape(encodeURIComponent(url)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  function rewriteHtml(html, baseUrl) {
    let base;
    try { base = new URL(baseUrl); } catch { return html; }

    html = html.replace(/(href|src|action)=("|')([^"']+)("|')/gi, (m, attr, q1, val, q2) => {
      const abs = resolveUrl(val, base);
      if (!abs || abs === val || abs.startsWith('data:') || abs.startsWith('blob:')) return m;
      return `${attr}=${q1}${PROXY_PREFIX}${encodeBase64Url(abs)}${q2}`;
    });

    html = html.replace(/url\(("|')?([^"')]+)("|')?\)/gi, (m, q1, val, q2) => {
      const abs = resolveUrl(val, base);
      if (!abs || abs === val) return m;
      return `url(${q1 || ''}${PROXY_PREFIX}${encodeBase64Url(abs)}${q2 || ''})`;
    });

    if (!html.includes('<base ')) {
      html = html.replace(/<head>/i, `<head><base href="${baseUrl}">`);
    }

    return html;
  }

  function resolveUrl(url, base) {
    try {
      if (!url) return url;
      if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) return url;
      if (url.startsWith('//')) return `https:${url}`;
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return new URL(url, base).href;
    } catch { return url; }
  }
}
