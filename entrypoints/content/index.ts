import "./ui/badge.css";
import { getAdapter } from "./adapters/registry";
import { BadgeBuilder, type UserSettings } from "./ui/BadgeBuilder";
import { fetchFromBackground } from "./api/api";
import { renderLoading, renderNotFound } from "./ui/states";

const DEFAULT_SETTINGS: UserSettings = {
  showNutriscore: true,
  showNova: true,
  showEcoscore: true,
  showAdditives: false,
  showAllergens: false,
  allergenFlags: [],
  language: "auto",
};

let injectedBarcode: string | null = null;
let observer: MutationObserver | null = null;

function cleanup(): void {
  document
    .querySelectorAll(".off-badge, .off-badge-loading")
    .forEach((el) => el.remove());
  injectedBarcode = null;
}

async function tryInject(): Promise<void> {
  const adapter = getAdapter();
  if (!adapter?.isProductPage()) return;

  const productDetail = document.querySelector<HTMLElement>(
    adapter.productDetailSelector,
  );
  if (!productDetail) return;

  const barcode =
    adapter.extractBarcode(productDetail) ?? (await adapter.interceptBarcode());

  if (!barcode || injectedBarcode === barcode) return;

  const insertionPoint = adapter.getInsertionPoint(productDetail);
  if (!insertionPoint) return;

  injectedBarcode = barcode;

  const loading = renderLoading(barcode);
  insertionPoint.insertAdjacentElement("beforebegin", loading);

  const product = await fetchFromBackground(barcode);
  loading.remove();

  const badge = product
    ? new BadgeBuilder(product, DEFAULT_SETTINGS)
        .withHeader()
        .withNutrients()
        .withAllergens()
        .withScores()
        .withAdditives()
        .withFooter()
        .build()
    : renderNotFound(barcode);

  insertionPoint.insertAdjacentElement("beforebegin", badge);
}

export default defineContentScript({
  matches: ["*://*.metro.ca/*", "*://*.superc.ca/*", "*://*.loblaws.ca/*"],
  runAt: "document_idle",
  cssInjectionMode: "manifest",

  main(ctx) {
    const adapter = getAdapter();
    if (!adapter) return;

    ctx.addEventListener(window, "wxt:locationchange", () => {
      cleanup();
      tryInject();
    });

    observer = new MutationObserver(() => tryInject());
    observer.observe(document.body, { childList: true, subtree: true });

    ctx.onInvalidated(() => {
      observer?.disconnect();
      observer = null;
      cleanup();
    });

    tryInject();
  },
});
