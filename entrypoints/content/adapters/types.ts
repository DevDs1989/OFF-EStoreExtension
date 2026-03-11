export abstract class SiteAdapter {
  /** Returns true if the current page is a product page for this site */
  abstract isProductPage(): boolean;

  /** Extracts and returns the EAN-13/UPC barcode from the DOM, or null */
  abstract extractBarcode(base: HTMLElement): string | null;

  /*
   * Override in adapters that can't extract a barcode from the DOM.
   * Injects a page-context script and returns a Promise that resolves
   * when the GTIN is intercepted from the network, or null on timeout.
   */
  interceptBarcode(): Promise<string | null> {
    return Promise.resolve(null);
  }

  /** Returns the DOM element to inject the badge into */
  abstract getInsertionPoint(base: HTMLElement): HTMLElement | null;

  /** Returns the CSS selector for the product detail container */
  abstract get productDetailSelector(): string;

  /** Normalises UPC-A (12 digits) → EAN-13 by prepending '0' */
  protected normaliseBarcode(raw: string): string {
    return raw.length === 12 ? "0" + raw : raw;
  }
}
