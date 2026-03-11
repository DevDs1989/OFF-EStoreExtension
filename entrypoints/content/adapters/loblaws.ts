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
      document.querySelector<HTMLElement>(
        "[class*='product-details-deals-badge']",
      ) ?? document.querySelector<HTMLElement>("h1")
    );
  }

  interceptBarcode(): Promise<string | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener("message", handler);
        resolve(null);
      }, 5000);

      const self = this;

      function handler(event: MessageEvent) {
        if (event.source !== window) return;
        if (event.data?.type !== "GTIN_FOUND") return;

        clearTimeout(timeout);
        window.removeEventListener("message", handler);

        const ean = self.normaliseBarcode(event.data.payload.gtin);
        alert(`GTIN intercepted: ${ean}`);
        resolve(ean);
      }

      window.addEventListener("message", handler);

      const script = document.createElement("script");
      script.src = browser.runtime.getURL("utils/loblawsIntercept.js" as any);
      document.documentElement.appendChild(script);
      script.remove();
    });
  }

  get productDetailSelector(): string {
    return "[class*='product-details-page-details__visibility-sensor']";
  }
}
