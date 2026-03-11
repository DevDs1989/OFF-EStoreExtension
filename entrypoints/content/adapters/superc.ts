import { SiteAdapter } from "./types";

export class SuperCAdapter extends SiteAdapter {
  isProductPage(): boolean {
    return (
      !!document.querySelector("div.pdpDetailsContainer") ||
      !!window.location.pathname.match(/\/p\/\d{6,14}/)
    );
  }

  extractBarcode(base: HTMLElement): string | null {
    const fromAttr = base.getAttribute("data-product-code");
    if (fromAttr) return this.normaliseBarcode(fromAttr);

    const m = window.location.pathname.match(/\/p\/(\d{6,14})\s*$/);
    return m ? m[1] : null;
  }

  getInsertionPoint(base: HTMLElement): HTMLElement | null {
    // insert BEFORE add-to-cart row
    return (
      base.querySelector<HTMLElement>("div.pi--add-to-cart") ??
      base.querySelector<HTMLElement>(".pi--add-to-cart") ??
      null
    );
  }

  get productDetailSelector(): string {
    return "div.pdpDetailsContainer";
  }
}
