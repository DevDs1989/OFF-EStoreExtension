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
    const title =
      base.querySelector<HTMLElement>("h1.pi--title") ??
      base.querySelector<HTMLElement>("h1") ??
      null;

    if (!title?.parentElement) return base;

    title.parentElement.style.cssText =
      "display:flex; align-items:center; gap:10px;";

    return title;
  }

  get productCardSelector(): string {
    return ".default-product-tile";
  }

  get productDetailSelector(): string {
    return "div.pdpDetailsContainer";
  }
}
