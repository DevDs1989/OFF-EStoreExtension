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
      document.querySelector<HTMLElement>("[class*=comparison-price-list") ??
      document.querySelector<HTMLElement>("h1")
    );
  }

  interceptBarcode(): Promise<string | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener("message", handler);
        resolve(null);
      }, 15_000); // Loblaws SPA can take a while to render + fetch

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

      // No script injection needed!
      // loblaws-hook.content.ts (world: "MAIN") is already
      // intercepting fetch/XHR at document_start.
    });
  }

  get productDetailSelector(): string {
    // The old selector was too specific and didn't match.
    // On Loblaws' SPA, the root app container is #root —
    // but we need a product-specific element. Use a broad
    // attribute selector that survives class name hashing.
    return "[class*='product-details-page']";
  }
}
