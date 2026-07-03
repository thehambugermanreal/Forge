import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCcw, Home, Search, Loader2,
  Shield, AlertTriangle, Maximize2, Minimize2
} from 'lucide-react';

const DEFAULT_PROXY_URL = 'https://duckduckgo.com';
// Backend URL for production - in dev, Vite proxy handles routing
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

function isSearchQuery(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;
  if (trimmed.includes('http://') || trimmed.includes('https://')) return false;
  if (trimmed.includes(' ') || trimmed.includes('?')) return true;
  if (trimmed.includes('.') && !trimmed.startsWith('.')) {
    const parts = trimmed.split('.');
    if (parts.length >= 2 && parts[parts.length - 1].length >= 2) return false;
  }
  return true;
}

function normalizeUrl(url: string): string {
  let u = url.trim();
  if (u.startsWith('//')) return `https:${u}`;
  if (!u.startsWith('http://') && !u.startsWith('https://')) return `https://${u}`;
  return u;
}

// Base64url encoding matching backend's Buffer.from(url).toString('base64url')
function encodeUrl(url: string): string {
  return btoa(unescape(encodeURIComponent(url)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function ProxyPage() {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [initPhase, setInitPhase] = useState<'loading' | 'ready'>('loading');
  const [initStep, setInitStep] = useState(0);
  const [initLog, setInitLog] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const pushLog = (msg: string) => setInitLog(prev => [...prev.slice(-6), msg]);

  // Deploy Scramjet proxy — non-blocking
  useEffect(() => {
    let cancelled = false;

    async function deploy() {
      pushLog('Contacting backend...');
      setInitStep(1);

      // Step 1 — verify backend health
      try {
        const health = await fetch(`${BACKEND_URL}/api/health`);
        if (health.ok) {
          const data = await health.json();
          pushLog(`Backend OK  uptime ${Math.round(data.uptime)}s`);
        }
      } catch {
        pushLog('Backend unreachable — running client-only mode');
      }
      setInitStep(2);

      // Step 2 — try service worker (optional, will fail on StackBlitz/WebContainer)
      pushLog('Checking service worker support...');
      const swSupported = 'serviceWorker' in navigator;
      if (swSupported) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          pushLog(`SW registered (scope: ${reg.scope})`);
          setInitStep(3);

          try { await reg.update(); pushLog('SW updated to latest'); } catch { /* non-fatal */ }

          if (!navigator.serviceWorker.controller) {
            pushLog('Waiting for SW to activate...');
            await new Promise<void>(resolve => {
              const h = () => { navigator.serviceWorker.removeEventListener('controllerchange', h); resolve(); };
              navigator.serviceWorker.addEventListener('controllerchange', h);
              setTimeout(resolve, 2000);
            });
          }
          pushLog('SW active — Scramjet online');
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          console.warn('SW registration failed (non-fatal):', e);
          pushLog(`SW unavailable — using backend proxy`);
        }
      } else {
        pushLog('SW not supported — backend proxy mode');
      }
      setInitStep(4);

      // Step 3 — backend proxy is always available
      pushLog('Backend proxy ready');
      setInitStep(5);

      pushLog('Ready to browse — enter a URL above');
      if (!cancelled) setInitPhase('ready');
    }

    deploy();
    return () => { cancelled = true; };
  }, []);

  // Listen for messages from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'forge-navigate' && e.data?.url) {
        navigate(e.data.url);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const navigate = useCallback(async (targetUrl: string) => {
    let finalUrl = targetUrl.trim();
    if (!finalUrl) return;

    if (isSearchQuery(finalUrl)) {
      finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
    } else {
      finalUrl = normalizeUrl(finalUrl);
    }

    setLoading(true);
    setError(null);
    setCurrentUrl(finalUrl);
    setUrl(finalUrl);

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(finalUrl);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);

    try {
      // Ask backend to encode the URL — backend returns the proxy path
      const res = await fetch(`${BACKEND_URL}/api/proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl }),
      });

      if (!res.ok) throw new Error(`Backend error: ${res.status}`);

      const { proxyUrl } = await res.json();

      const iframe = iframeRef.current;
      if (!iframe) throw new Error('Browser frame not ready');

      // Point the iframe src at the proxy path
      iframe.src = BACKEND_URL ? `${BACKEND_URL}${proxyUrl}` : proxyUrl;
      setLoading(false);
    } catch (err) {
      // Fallback: encode client-side and navigate directly
      try {
        const encoded = encodeUrl(finalUrl);
        const proxyPath = `/proxy/${encoded}`;
        const iframe = iframeRef.current;
        if (iframe) {
          iframe.src = BACKEND_URL ? `${BACKEND_URL}${proxyPath}` : proxyPath;
          setLoading(false);
          return;
        }
      } catch { /* fall through */ }
      console.error('Proxy error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load page');
      setLoading(false);
    }
  }, [historyIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(url);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevUrl = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentUrl(prevUrl);
      setUrl(prevUrl);
      navigate(prevUrl);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextUrl = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentUrl(nextUrl);
      setUrl(nextUrl);
      navigate(nextUrl);
    }
  };

  const refresh = () => {
    if (currentUrl) {
      navigate(currentUrl);
    }
  };

  const goHome = () => {
    navigate(DEFAULT_PROXY_URL);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  // Loading / deploy screen
  if (initPhase === 'loading') {
    const steps = [
      { label: 'Contacting backend',        step: 1 },
      { label: 'Registering service worker', step: 2 },
      { label: 'Activating Scramjet SW',     step: 4 },
      { label: 'Loading Scramjet runtime',   step: 5 },
      { label: 'Loading Epoxy transport',    step: 6 },
    ];
    const pct = Math.round((initStep / 6) * 100);

    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-5 w-full max-w-sm">

            {/* Icon */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              {initStep < 6 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0a0a0f] flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-[#3b82f6] animate-spin" />
                </div>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-[#f0f0f5]">Deploying Proxy</h2>
              <p className="text-xs text-[#6b6b7a] mt-1">Scramjet + Epoxy transport</p>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-[#6b6b7a] mb-1.5">
                <span>Progress</span>
                <span className="font-mono text-[#3b82f6]">{pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1f1f2e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Step checklist */}
            <div className="w-full bg-[#0e0e18] border border-[#1f1f2e] rounded-xl p-3 space-y-2">
              {steps.map(({ label, step }) => {
                const done    = initStep >= step + 1;
                const active  = initStep === step;
                return (
                  <div key={step} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                      done   ? 'bg-[#3b82f6] text-white' :
                      active ? 'border-2 border-[#3b82f6] bg-transparent' :
                               'bg-[#1f1f2e] text-transparent'
                    }`}>
                      {done && '✓'}
                    </div>
                    <span className={`text-xs transition-colors duration-300 ${
                      done   ? 'text-[#a0a0b0]' :
                      active ? 'text-[#f0f0f5]' :
                               'text-[#4a4a5a]'
                    }`}>
                      {label}
                    </span>
                    {active && <Loader2 className="w-3 h-3 text-[#3b82f6] animate-spin ml-auto flex-shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Live log */}
            <div className="w-full bg-[#050508] border border-[#1a1a22] rounded-xl p-3 font-mono text-[10px] text-[#4a9f7a] space-y-0.5 min-h-[80px]">
              <div className="text-[#6b6b7a] mb-1">▸ proxy deploy log</div>
              {initLog.map((line, i) => (
                <div key={i} className={i === initLog.length - 1 ? 'text-[#60c090]' : 'text-[#3a7a5a]'}>
                  {line}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`${isFullScreen ? 'fixed inset-0 z-[200]' : 'fixed inset-0 z-[100]'} bg-[#0a0a0f] flex flex-col transition-all duration-300`}>
      {/* Browser Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-[#2a2a3a] bg-[#12121a]">
        <div className="flex items-center gap-1">
          <button onClick={goBack} disabled={historyIndex <= 0} className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#a0a0b0] hover:text-[#f0f0f5] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={goForward} disabled={historyIndex >= history.length - 1} className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#a0a0b0] hover:text-[#f0f0f5] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#a0a0b0] hover:text-[#f0f0f5] transition-all">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={goHome} className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#a0a0b0] hover:text-[#f0f0f5] transition-all">
            <Home className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b7a]" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Search or enter a URL..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#16161f] border border-[#2a2a3a] text-[#f0f0f5] placeholder-[#6b6b7a] focus:outline-none focus:border-[#3b82f6] transition-all text-sm"
            />
            {currentUrl && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" title="Proxy active" />
                <span className="text-[10px] text-[#6b6b7a] hidden sm:inline">Scramjet</span>
              </div>
            )}
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white font-medium hover:bg-[#60a5fa] transition-all text-sm">
            Go
          </button>
        </form>

        <button onClick={toggleFullScreen} className="p-2 rounded-lg hover:bg-[#1f1f2e] text-[#a0a0b0] hover:text-[#f0f0f5] transition-all">
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Status Bar */}
      {loading && (
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1a1a26] border-b border-[#2a2a3a]">
          <Loader2 className="w-3 h-3 text-[#3b82f6] animate-spin" />
          <span className="text-xs text-[#a0a0b0]">Loading...</span>
          <span className="text-xs text-[#6b6b7a] truncate flex-1">{currentUrl}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#ef4444]/10 border-b border-[#ef4444]/20">
          <AlertTriangle className="w-3 h-3 text-[#ef4444]" />
          <span className="text-xs text-[#ef4444]">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs text-[#ef4444] hover:text-[#f87171] underline">Dismiss</button>
        </div>
      )}

      {/* Browser Content */}
      <iframe
        ref={iframeRef}
        src="about:blank"
        className="flex-1 w-full border-0"
        title="Forge Browser"
        onLoad={() => setLoading(false)}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
      />
    </div>
  );
}
