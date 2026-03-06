import "./badge.css";
import { SELECTORS, getEanFromUrl } from "./extract";
import { fetchFromBackground } from "./api";
import {
  renderLoading,
  renderNotFound,
  renderFull,
  insertBadge,
} from "./badge";

async function fetchAndRender(
  ean: string,
  container: HTMLElement,
): Promise<void> {
  const loading = renderLoading();
  insertBadge(loading, container);

  const resp = await fetchFromBackground(ean);
  loading.remove();

  insertBadge(resp ? renderFull(resp, ean) : renderNotFound(), container);
}

function processProduct(
  base: HTMLElement,
  structure: {
    mainDescription: "&" | string;
    ean: (b: HTMLElement) => string | null;
  },
): void {
  if (base.classList.contains("driveoff_product")) return;
  base.classList.add("driveoff_product");

  const ean = getEanFromUrl() ?? structure.ean(base);
  if (!ean || !/^\d{6,14}$/.test(ean)) return;

  const container =
    structure.mainDescription === "&"
      ? base
      : base.querySelector<HTMLElement>(structure.mainDescription);
  if (!container) return;
  if (container.querySelector(".off-badge")) return;

  fetchAndRender(ean, container);
}

function findProductContainer(): HTMLElement | null {
  for (const sel of [
    "div.pdpDetailsContainer",
    "[data-product-code]",
    ".product-details",
    "main",
  ]) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  return null;
}

function detectElements(): void {
  const { productView, listView } = SELECTORS;
  let found = false;

  document.querySelectorAll<HTMLElement>(productView.base).forEach((base) => {
    found = true;
    processProduct(base, productView);
  });

  document.querySelectorAll<HTMLElement>(listView.base).forEach((list) => {
    list.classList.add("driveoff_list");
    list
      .querySelectorAll<HTMLElement>(listView.product.base)
      .forEach((base) => {
        found = true;
        processProduct(base, listView.product);
      });
  });

  if (!found) {
    const ean = getEanFromUrl();
    if (ean && !document.querySelector(".off-badge")) {
      const container =
        findProductContainer() ??
        document.querySelector<HTMLElement>("h1")?.parentElement ??
        null;
      if (container) fetchAndRender(ean, container);
    }
  }
}

export default defineContentScript({
  matches: ["*://*.metro.ca/*"],
  runAt: "document_idle",
  cssInjectionMode: "manifest",

  main() {
    setTimeout(() => detectElements(), 1500);
    const observer = new MutationObserver(() => detectElements());
    observer.observe(document.body, { childList: true, subtree: true });
  },
});
