import { SiteAdapter } from "./types";

export class LoblawsAdapter extends SiteAdapter {
  isProductPage(): boolean {
    return /\/p\/[^/?]+/.test(window.location.pathname);
  }

  extractBarcode(_base: HTMLElement): string | null {
    return null;
  }

  getInsertionPoint(_base: HTMLElement): HTMLElement | null {
    return (
      document.querySelector<HTMLElement>("[class*=comparison-price-list]") ??
      document.querySelector<HTMLElement>("h1")
    );
  }

  interceptBarcode(signal?: AbortSignal): Promise<string | null> {
    return new Promise((resolve) => {
      if (signal?.aborted) {
        resolve(null);
        return;
      }

      const timeout = setTimeout(() => {
        window.removeEventListener("message", handler);
        resolve(null);
      }, 15_000);

      const self = this;

      function handler(event: MessageEvent) {
        if (event.source !== window) return;
        if (event.data?.type !== "GTIN_FOUND") return;
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        const ean = self.normaliseBarcode(event.data.payload.gtin);
        console.log("LoblawsAdapter: Intercepted GTIN", ean);
        resolve(ean);
      }

      window.addEventListener("message", handler);

      // On page change: cancel timeout, remove listener, resolve null
      signal?.addEventListener("abort", () => {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        resolve(null);
      });
    });
  }

  get productDetailSelector(): string {
    return "[class*='product-details-page']";
  }
}
