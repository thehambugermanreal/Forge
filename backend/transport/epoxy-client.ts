export interface EpoxyClient {
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  connect: (wispUrl: string) => Promise<void>;
  close: () => void;
}

export class EpoxyTransport implements EpoxyClient {
  private ws: WebSocket | null = null;
  private wispUrl: string;
  private connected = false;

  constructor(wispUrl: string = 'wss://wisp.mercurywork.shop/wisp/') {
    this.wispUrl = wispUrl;
  }

  async connect(url?: string): Promise<void> {
    if (url) this.wispUrl = url;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wispUrl);
        this.ws.onopen = () => {
          this.connected = true;
          resolve();
        };
        this.ws.onerror = () => reject(new Error('Failed to connect to Epoxy transport'));
      } catch (err) {
        reject(err);
      }
    });
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    return fetch(proxyUrl, options);
  }

  close(): void {
    this.ws?.close();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
