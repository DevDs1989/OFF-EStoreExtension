export const SELECTORS = {
  productView: {
    base: "div.pdpDetailsContainer",
    name: "h1.pi--title",
    mainDescription: "&" as const,
    ean: (base: HTMLElement) => base.getAttribute("data-product-code"),
  },
  listView: {
    base: "div.products-search--grid",
    product: {
      base: ".default-product-tile",
      name: ".data-product-name",
      mainDescription: "&" as const,
      ean: (base: HTMLElement) => base.getAttribute("data-product-code"),
    },
  },
};

// Extract EAN from URL
// TODO: Add Fallback for EAN
export function getEanFromUrl(): string | null {
  const m = window.location.pathname.match(/\/p\/(\d{6,14})\s*$/);
  return m ? m[1] : null;
}
