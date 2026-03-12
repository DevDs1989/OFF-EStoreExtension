import "./ui/badge.css";
import { getAdapter } from "./adapters/registry";
import {
  BadgeBuilder,
  type UserSettings,
  type AllergenFlags,
} from "./ui/BadgeBuilder";
import { fetchFromBackground } from "./api/api";
import { renderLoading, renderNotFound } from "./ui/states";

const DEFAULT_SETTINGS: UserSettings = {
  showNutrients: true,
  showScores: true,
  showAdditives: false,
  showAllergens: false,
  language: "auto",
};

const ALLERGEN_FLAGS: AllergenFlags = [
  "en:gluten",
  "en:crustaceans",
  "en:eggs",
  "en:fish",
  "en:peanuts",
  "en:soybeans",
  "en:milk",
  "en:nuts",
  "en:cereals-containing-gluten",
  "en:sesame-seeds",
  "en:lupin",
  "en:molluscs",
];

let injectedBarcode: string | null = null;
let isInjecting = false;
let controller: AbortController | null = null;

async function inject(): Promise<void> {
  if (isInjecting) return;
  const adapter = getAdapter();
  if (!adapter?.isProductPage()) return;
  isInjecting = true;
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  try {
    const base = document.querySelector<HTMLElement>(
      adapter.productDetailSelector,
    );
    if (!base || signal.aborted) return;

    const barcode =
      adapter.extractBarcode(base) ?? (await adapter.interceptBarcode(signal));
    if (!barcode || barcode === injectedBarcode || signal.aborted) return;

    injectedBarcode = barcode;

    // Mount loading bar into body
    const loading = renderLoading(barcode);
    document.body.appendChild(loading);

    const product = await fetchFromBackground(barcode);
    loading.remove();
    if (signal.aborted) return;

    const bar = product
      ? (() => {
          const builder = new BadgeBuilder(product, ALLERGEN_FLAGS);
          if (DEFAULT_SETTINGS.showNutrients) builder.withNutrients();
          if (DEFAULT_SETTINGS.showAllergens) builder.withAllergens();
          if (DEFAULT_SETTINGS.showScores) builder.withScores();
          if (DEFAULT_SETTINGS.showAdditives) builder.withAdditives();
          builder.withFooter();
          return builder.build();
        })()
      : renderNotFound(barcode);

    document.body.appendChild(bar);
  } finally {
    isInjecting = false;
  }
}

function cleanup(): void {
  document
    .querySelectorAll(".off-bar, .off-bar-loading")
    .forEach((el) => el.remove());
  injectedBarcode = null;
  isInjecting = false;
  controller?.abort();
  controller = null;
}

export default defineContentScript({
  matches: ["*://*.metro.ca/*", "*://*.superc.ca/*", "*://*.loblaws.ca/*"],
  runAt: "document_idle",
  cssInjectionMode: "manifest",
  main(ctx) {
    if (!getAdapter()) return;
    ctx.addEventListener(window, "off:locationchange", () => {
      cleanup();
      inject();
    });
    ctx.addEventListener(window, "wxt:locationchange", () => {
      cleanup();
      inject();
    });
    const observer = new MutationObserver(() => {
      if (!isInjecting) inject();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    ctx.onInvalidated(() => {
      observer.disconnect();
      cleanup();
    });
    inject();
  },
});
