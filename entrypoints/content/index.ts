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

async function fetchAndRender(
  ean: string,
  insertionPoint: HTMLElement, // reference element we insert BEFORE
  settings: UserSettings,
): Promise<void> {
  // Loading State
  const loading = renderLoading(ean);
  insertionPoint.insertAdjacentElement("beforebegin", loading);

  // Fetching State
  const product = await fetchFromBackground(ean);

  // Removes loading when fetched
  loading.remove();

  // BuilderPattern to build the badge
  // TODO: add user config functionality
  const badge = product
    ? new BadgeBuilder(product, settings)
        .withHeader()
        .withNutrients()
        .withAllergens()
        .withScores()
        .withAdditives()
        .withFooter()
        .build()
    : renderNotFound(ean);

  insertionPoint.insertAdjacentElement("beforebegin", badge);
}

function detectAndInject(settings: UserSettings): void {
  const adapter = getAdapter();
  if (!adapter) return;

  if (!adapter.isProductPage()) return;

  const base = document.querySelector<HTMLElement>(
    adapter.productDetailSelector,
  );
  if (!base) return;

  // Avoid duplicate injection
  if (base.querySelector(".off-badge")) return;

  const barcode = adapter.extractBarcode(base);
  if (!barcode) return;

  const insertionPoint = adapter.getInsertionPoint(base);
  if (!insertionPoint) return;

  fetchAndRender(barcode, insertionPoint, settings);
}

export default defineContentScript({
  matches: ["*://*.metro.ca/*", "*://*.superc.ca/*"],
  runAt: "document_idle",
  cssInjectionMode: "manifest",

  main() {
    setTimeout(() => detectAndInject(DEFAULT_SETTINGS), 1500);
  },
});
