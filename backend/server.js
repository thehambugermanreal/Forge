import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import { JSDOM } from 'jsdom';

const app = express();
const PORT = process.env.PORT || 3000;

const PROXY_PREFIX = '/proxy/';
const BARE_PREFIX  = '/bare/';

const SCRAMJET_CONFIG = {
  prefix: PROXY_PREFIX,
  bare:   BARE_PREFIX,
  wisp:   'wss://wisp.mercurywork.shop/wisp/',
  codec:  'plain',
  scramjetPath: '/proxy/scramjet/',
  epoxyPath:    '/proxy/epoxy/',
};

// ── ANSI colour helpers ──────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  magenta:'\x1b[35m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
};

function ts() {
  return `${c.gray}[${new Date().toISOString().replace('T',' ').slice(0,-5)}]${c.reset}`;
}

function statusColor(code) {
  if (code < 300) return c.green;
  if (code < 400) return c.yellow;
  if (code < 500) return c.red;
  return c.magenta;
}

function log(level, ...parts) {
  const prefix = {
    INFO:  `${c.cyan}${c.bold} INFO${c.reset}`,
    PROXY: `${c.blue}${c.bold}PROXY${c.reset}`,
    BARE:  `${c.magenta}${c.bold} BARE${c.reset}`,
    OK:    `${c.green}${c.bold}   OK${c.reset}`,
    WARN:  `${c.yellow}${c.bold} WARN${c.reset}`,
    ERR:   `${c.red}${c.bold}  ERR${c.reset}`,
    BOOT:  `${c.cyan}${c.bold} BOOT${c.reset}`,
  }[level] || level;
  console.log(`${ts()} ${prefix}  ${parts.join(' ')}`);
}

// ── Sessions ─────────────────────────────────────────────────────────────────
const sessions = new Map();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'X-Bare-Host', 'X-Bare-Port', 'X-Bare-Protocol', 'X-Bare-Path', 'X-Bare-Headers', 'X-Bare-Forward-Headers'],
}));

app.use(express.json());

// Request logger for proxy/bare routes
app.use((req, _res, next) => {
  if (req.path.startsWith('/proxy/') || req.path.startsWith('/bare/') || req.path.startsWith('/api/')) {
    log('INFO', `${c.white}${req.method}${c.reset} ${c.dim}${req.path.slice(0, 80)}${c.reset}`);
  }
  next();
});

// ── URL codec ────────────────────────────────────────────────────────────────
function encodeUrl(url) {
  return Buffer.from(url).toString('base64url');
}

function decodeUrl(encoded) {
  try {
    const decoded = Buffer.from(encoded, 'base64url').toString('utf-8');
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) return decoded;
    return null;
  } catch {
    return null;
  }
}

function resolveUrl(url, base) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  try { return new URL(url, base).href; } catch { return url; }
}

// ── HTML rewriter ─────────────────────────────────────────────────────────────
function rewriteHtml(html, baseUrl) {
  const dom = new JSDOM(html, { url: baseUrl });
  const document = dom.window.document;

  const els = document.querySelectorAll('a[href],link[href],script[src],img[src],iframe[src],video[src],audio[src],source[src],embed[src],form[action]');
  els.forEach(el => {
    ['href','src','action'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val) {
        const resolved = resolveUrl(val, baseUrl);
        if (resolved && resolved !== val) el.setAttribute(attr, `${PROXY_PREFIX}${encodeUrl(resolved)}`);
      }
    });
  });

  document.querySelectorAll('style').forEach(s => {
    if (s.textContent) {
      s.textContent = s.textContent.replace(/url\((["']?)([^"')]+)\1\)/g, (m, q, u) => {
        const r = resolveUrl(u, baseUrl);
        return r !== u ? `url(${q}${PROXY_PREFIX}${encodeUrl(r)}${q})` : m;
      });
    }
  });

  document.querySelectorAll('[style]').forEach(el => {
    const s = el.getAttribute('style');
    if (s) el.setAttribute('style', s.replace(/url\((["']?)([^"')]+)\1\)/g, (m, q, u) => {
      const r = resolveUrl(u, baseUrl);
      return r !== u ? `url(${q}${PROXY_PREFIX}${encodeUrl(r)}${q})` : m;
    }));
  });

  // Inject client-side URL rewriter
  const injectionScript = document.createElement('script');
  injectionScript.textContent = `
(function(){
  const P='${PROXY_PREFIX}';
  const BASE=document.baseURI||location.href;
  function enc(u){try{return btoa(unescape(encodeURIComponent(u))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=/g,'');}catch(e){console.error('encode fail',u,e);return u;}}
  function dec(u){try{const d=atob(u.replace(/-/g,'+').replace(/_/g,'/'));return decodeURIComponent(escape(d));}catch(e){return u;}}
  function isAbs(u){return u&&(u.startsWith('http://')||u.startsWith('https://')||u.startsWith('//'));}
  function isProxy(u){return u&&u.startsWith(P);}
  function res(u,b){if(!u)return u;if(u.startsWith('data:')||u.startsWith('blob:')||u.startsWith('javascript:'))return u;if(isProxy(u))return u;if(u.startsWith('//'))return 'https:'+u;if(isAbs(u))return u;try{return new URL(u,b).href;}catch(e){return u;}}
  function rw(u){if(!u||typeof u!=='string')return u;if(isProxy(u))return u;const r=res(u,BASE);if(!r||!isAbs(r))return u;return P+enc(r);}
  window.__forgeRewrite=rw;window.__forgeDecode=dec;window.__forgePrefix=P;window.__forgeBase=BASE;
  document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.href&&!a.href.startsWith('about:')&&!a.href.startsWith('javascript:')&&!isProxy(a.href)){e.preventDefault();const h=rw(a.href);console.log('[Forge] nav:',a.href,'->',h);location.href=h;}});
  const oF=window.fetch;window.fetch=function(u,o){if(typeof u==='string'&&u.length<8192){const r=rw(u);if(r!==u){console.log('[Forge] fetch:',u,'->',r);u=r;}}return oF.call(this,u,o).catch(e=>{console.error('[Forge] fetch error',u,e);throw e;});};
  const oX=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u,...a){if(typeof u==='string'&&u.length<8192){const r=rw(u);if(r!==u){console.log('[Forge] xhr:',u,'->',r);u=r;}}return oX.call(this,m,u,...a);};
  const oWs=window.WebSocket;window.WebSocket=function(u,protocols){let r=u;if(typeof u==='string'&&u.length<8192){r=rw(u)||u;if(r!==u)console.log('[Forge] ws:',u,'->',r);}return new oWs(r,protocols);};
  const oPS=history.pushState;history.pushState=function(s,t,u){if(u){const r=rw(String(u));if(r!==u){console.log('[Forge] pushState:',u,'->',r);u=r;}}return oPS.call(this,s,t,u);};
  const oRS=history.replaceState;history.replaceState=function(s,t,u){if(u){const r=rw(String(u));if(r!==u){console.log('[Forge] replaceState:',u,'->',r);u=r;}}return oRS.call(this,s,t,u);};
  const oI=window.Image;window.Image=function(...a){const i=new oI(...a);Object.defineProperty(i,'src',{set(v){i.__src=v;const r=rw(v);if(r!==v)console.log('[Forge] img.src:',v,'->',r);oI.prototype.__lookupSetter__('src').call(i,r);},get(){return i.__src;}});return i;};
  const oCI=HTMLElement.prototype.insertAdjacentHTML;HTMLElement.prototype.insertAdjacentHTML=function(p,h){if(typeof h==='string'&&h.length<100000){const r=h.replace(/(href|src|action)=["']([^"']+)["']/gi,(m,a,u)=>{const e=rw(u);return e===u?m:a+'="'+e+'"';});if(r!==h)console.log('[Forge] insertAdjacentHTML rewritten');h=r;}return oCI.call(this,p,h);};
  console.log('[Forge] Client rewriter injected. Base:',BASE);
})();`;

  if (document.head) document.head.insertBefore(injectionScript, document.head.firstChild);
  else if (document.documentElement) document.documentElement.insertBefore(injectionScript, document.documentElement.firstChild);

  if (!document.querySelector('base')) {
    const b = document.createElement('base');
    b.href = baseUrl;
    if (document.head) document.head.insertBefore(b, document.head.firstChild);
  }

  return dom.serialize();
}

// ── /proxy route ──────────────────────────────────────────────────────────────
app.use('/proxy', async (req, res, next) => {
  // Skip static Scramjet/Epoxy runtime files — let Vite serve them from public/
  // req.url is the path AFTER stripping the /proxy mount point
  if (req.url.startsWith('/scramjet/') || req.url.startsWith('/epoxy/')) {
    return next();
  }

  const encodedUrl = req.url.substring(1);

  if (!encodedUrl) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  // Decode
  let targetUrl = decodeUrl(encodedUrl);
  if (!targetUrl) {
    try { targetUrl = decodeURIComponent(encodedUrl); } catch { targetUrl = encodedUrl; }
  }

  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    log('WARN', `Could not decode URL from: ${c.yellow}${encodedUrl.slice(0,60)}${c.reset}`);
    return res.status(400).json({ error: 'Invalid or non-HTTP URL', encoded: encodedUrl });
  }

  const sessionId = Math.random().toString(36).slice(2, 11);
  sessions.set(sessionId, { url: targetUrl, startTime: Date.now() });
  const start = Date.now();

  log('PROXY', `${c.cyan}→${c.reset} ${c.white}${targetUrl}${c.reset}`);
  log('PROXY', `${c.dim}encoded: ${encodedUrl.slice(0,60)}${encodedUrl.length>60?'…':''}${c.reset}`);

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method === 'GET' ? 'GET' : req.method,
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer':         targetUrl,
      },
      redirect: 'follow',
    });

    const ct       = upstream.headers.get('content-type') || 'application/octet-stream';
    const elapsed  = Date.now() - start;

    // Handle text content (HTML, CSS, JS) with rewriting
    const isText = ct.includes('text/') || ct.includes('javascript') || ct.includes('json') || ct.includes('xml');

    if (isText) {
      const body = await upstream.text();
      let output;

      if (ct.includes('text/html')) {
        output = rewriteHtml(body, targetUrl);
        log('OK', `${statusColor(upstream.status)}${upstream.status}${c.reset} HTML  ${c.dim}${elapsed}ms  ${(output.length/1024).toFixed(1)}KB${c.reset}  ${c.white}${targetUrl.slice(0,60)}${c.reset}`);
      } else if (ct.includes('text/css')) {
        output = body.replace(/url\((["']?)([^"')]+)\1\)/g, (m, q, u) => {
          const r = resolveUrl(u, targetUrl);
          return r !== u ? `url(${q}${PROXY_PREFIX}${encodeUrl(r)}${q})` : m;
        });
        log('OK', `${statusColor(upstream.status)}${upstream.status}${c.reset} CSS   ${c.dim}${elapsed}ms  ${(output.length/1024).toFixed(1)}KB${c.reset}  ${c.white}${targetUrl.slice(0,60)}${c.reset}`);
      } else if (ct.includes('javascript')) {
        // Rewrite JS source maps and some URL patterns
        output = body.replace(/sourceMappingURL=([^\s]+)/g, (m, u) => {
          const r = resolveUrl(u, targetUrl);
          return r !== u ? `sourceMappingURL=${PROXY_PREFIX}${encodeUrl(r)}` : m;
        });
        log('OK', `${statusColor(upstream.status)}${upstream.status}${c.reset} JS    ${c.dim}${elapsed}ms  ${(output.length/1024).toFixed(1)}KB${c.reset}  ${c.white}${targetUrl.slice(0,60)}${c.reset}`);
      } else {
        output = body;
        log('OK', `${statusColor(upstream.status)}${upstream.status}${c.reset} ${ct.split(';')[0].slice(0,8).padEnd(8)} ${c.dim}${elapsed}ms  ${(output.length/1024).toFixed(1)}KB${c.reset}  ${c.white}${targetUrl.slice(0,60)}${c.reset}`);
      }

      res.setHeader('Content-Type', ct);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('X-Proxy-Session', sessionId);
      res.status(upstream.status).send(output);
    } else {
      // Binary content (images, fonts, wasm, etc.) — pass through raw
      const body = await upstream.arrayBuffer();
      log('OK', `${statusColor(upstream.status)}${upstream.status}${c.reset} ${ct.split(';')[0].slice(0,12).padEnd(12)} ${c.dim}${elapsed}ms  ${(body.byteLength/1024).toFixed(1)}KB${c.reset}  ${c.white}${targetUrl.slice(0,60)}${c.reset}`);

      res.setHeader('Content-Type', ct);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('X-Proxy-Session', sessionId);
      // Pass through content-length for binary
      const cl = upstream.headers.get('content-length');
      if (cl) res.setHeader('Content-Length', cl);
      res.status(upstream.status).send(Buffer.from(body));
    }

    sessions.set(sessionId, { ...sessions.get(sessionId), status: upstream.status, elapsed });
  } catch (err) {
    const elapsed = Date.now() - start;
    log('ERR', `${c.red}${err.message}${c.reset}  ${c.dim}${elapsed}ms${c.reset}  ${c.white}${targetUrl}${c.reset}`);
    res.status(502).json({ error: 'Proxy fetch failed', message: err.message, url: targetUrl });
    sessions.delete(sessionId);
  }
});

// ── /bare route (for Scramjet's bare transport) ───────────────────────────────
app.use('/bare', async (req, res) => {
  const encodedUrl = req.path.substring(1);
  if (!encodedUrl) return res.status(400).json({ error: 'No URL' });

  let targetUrl = decodeUrl(encodedUrl);
  if (!targetUrl) {
    try { targetUrl = decodeURIComponent(encodedUrl); } catch { targetUrl = encodedUrl; }
  }

  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const start = Date.now();
  log('BARE', `${c.magenta}→${c.reset} ${c.white}${targetUrl}${c.reset}`);

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });

    const body    = await upstream.arrayBuffer();
    const elapsed = Date.now() - start;
    log('OK', `${statusColor(upstream.status)}${upstream.status}${c.reset} bare  ${c.dim}${elapsed}ms  ${(body.byteLength/1024).toFixed(1)}KB${c.reset}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    upstream.headers.forEach((v, k) => {
      if (!['content-encoding','transfer-encoding','connection'].includes(k)) res.setHeader(k, v);
    });
    res.status(upstream.status).send(Buffer.from(body));
  } catch (err) {
    log('ERR', `bare: ${c.red}${err.message}${c.reset}  ${targetUrl}`);
    res.status(502).json({ error: err.message });
  }
});

// ── /api/proxy — encode a URL and return the proxy path ─────────────────────
app.post('/api/proxy', (req, res) => {
  const { url: targetUrl } = req.body;
  if (!targetUrl) return res.status(400).json({ error: 'No URL provided' });

  const encoded  = encodeUrl(targetUrl);
  const proxyUrl = `${PROXY_PREFIX}${encoded}`;

  log('INFO', `${c.blue}encode${c.reset}  ${c.white}${targetUrl}${c.reset}`);
  log('INFO', `${c.dim}   → ${proxyUrl}${c.reset}`);

  res.json({ url: targetUrl, encoded, proxyUrl, iframeUrl: proxyUrl });
});

// ── /api/health ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', scramjet: SCRAMJET_CONFIG, sessions: sessions.size, uptime: process.uptime() });
});

// ── /api/stats ────────────────────────────────────────────────────────────────
app.get('/api/stats', (_req, res) => {
  const stats = Array.from(sessions.entries()).map(([id, s]) => ({
    id, url: s.url, duration: Date.now() - s.startTime, status: s.status,
  }));
  res.json({ sessions: stats, count: sessions.size });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
async function startServer() {
  log('BOOT', `${c.cyan}Starting Forge backend...${c.reset}`);

  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log('');
    console.log(`  ${c.bold}${c.cyan}⚡ Forge Proxy Server${c.reset}`);
    console.log(`  ${c.dim}${'─'.repeat(42)}${c.reset}`);
    console.log(`  ${c.bold}Server${c.reset}   ${c.green}http://localhost:${PORT}${c.reset}`);
    console.log(`  ${c.bold}Proxy${c.reset}    ${c.blue}/proxy/<base64url-encoded-url>${c.reset}`);
    console.log(`  ${c.bold}Bare${c.reset}     ${c.magenta}/bare/<base64url-encoded-url>${c.reset}`);
    console.log(`  ${c.bold}Encode${c.reset}   ${c.yellow}POST /api/proxy  { url }${c.reset}`);
    console.log(`  ${c.bold}Health${c.reset}   ${c.dim}GET  /api/health${c.reset}`);
    console.log(`  ${c.dim}${'─'.repeat(42)}${c.reset}`);
    console.log(`  ${c.bold}Scramjet${c.reset} ${c.green}✓${c.reset}  ${c.dim}/proxy/scramjet/scramjet.bundle.js${c.reset}`);
    console.log(`  ${c.bold}Epoxy${c.reset}    ${c.green}✓${c.reset}  ${c.dim}/proxy/epoxy/index.mjs${c.reset}`);
    console.log(`  ${c.bold}Wisp${c.reset}     ${c.dim}${SCRAMJET_CONFIG.wisp}${c.reset}`);
    console.log(`  ${c.bold}Codec${c.reset}    ${c.dim}${SCRAMJET_CONFIG.codec} (base64url)${c.reset}`);
    console.log('');
    log('BOOT', `${c.green}Ready — listening on :${PORT}${c.reset}`);
    console.log('');
  });
}

startServer().catch(err => {
  log('ERR', `Failed to start: ${c.red}${err.message}${c.reset}`);
  console.error(err);
  process.exit(1);
});
