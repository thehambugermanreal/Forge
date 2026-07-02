import { useEffect, useRef, useState }  from 'react';

interface ProxyState {
  ready: boolean;
  error: string | null;
  active: boolean;
  url: string | null;
}

const PROXY_PREFIX = '/proxy/';

// List of reliable CORS proxies
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?domain=',
];

export function useScramjetProxy() {
  const [state, setState] = useState<ProxyState>({
    ready: false,
    error: null,
    active: false,
    url: null,
  });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const proxyIndexRef = useRef(0);

  useEffect(() => {
    // Check if service worker is available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          setState((s) => ({ ...s, ready: true }));
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
          setState((s) => ({ ...s, ready: true })); // Still ready, just no SW
        });
    } else {
      setState((s) => ({ ...s, ready: true }));
    }
  }, []);

  const getProxyUrl = (targetUrl: string): string => {
    // Use service worker proxy if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return `${PROXY_PREFIX}${encodeURIComponent(targetUrl)}`;
    }
    // Fallback to CORS proxy
    const proxy = CORS_PROXIES[proxyIndexRef.current % CORS_PROXIES.length];
    return `${proxy}${encodeURIComponent(targetUrl)}`;
  };

  const loadUrl = (url: string) => {
    if (!url) return;

    const proxyUrl = getProxyUrl(url);
    setState((s) => ({ ...s, active: true, url: proxyUrl }));
  };

  const closeProxy = () => {
    setState((s) => ({ ...s, active: false, url: null }));
  };

  const rewriteUrl = (url: string): string => {
    if (!url) return url;
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) {
      return url;
    }
    return getProxyUrl(url);
  };

  const fetchViaProxy = async (url: string, opts?: RequestInit): Promise<Response> => {
    const proxyUrl = getProxyUrl(url);
    return fetch(proxyUrl, opts);
  };

  return {
    ready: state.ready,
    error: state.error,
    active: state.active,
    url: state.url,
    loadUrl,
    closeProxy,
    rewriteUrl,
    fetchViaProxy,
    iframeRef,
  };
}
