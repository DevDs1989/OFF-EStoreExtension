import { SiteAdapter } from "./types";

export class MetroAdapter extends SiteAdapter {
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
    const addToCart =
      base.querySelector<HTMLElement>(".pi-item-actions") ??
      base.querySelector<HTMLElement>('[class*="add-to-cart"]') ??
      base.querySelector<HTMLElement>('[class*="addToCart"]');

    if (addToCart) return addToCart;

    const title =
      base.querySelector<HTMLElement>("h1.pi--title") ??
      base.querySelector<HTMLElement>("h1");

    return title?.parentElement ?? base;
  }

  get productCardSelector(): string {
    return ".default-product-tile";
  }

  get productDetailSelector(): string {
    return "div.pdpDetailsContainer";
  }
}
