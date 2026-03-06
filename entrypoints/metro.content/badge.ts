// Nutrient Bars based on Daily Values
const DV = { sodium: 2400, sugars: 100, fat: 65 };

type Level = "low" | "medium" | "high";

function level(pct: number): Level {
  if (pct >= 15) return "high";
  if (pct >= 5) return "medium";
  return "low";
}

const BAR_COLOR: Record<Level, string> = {
  low: "#2ecc71",
  medium: "#f39c12",
  high: "#e74c3c",
};

function nutriBar(label: string, value: number | null, dv: number): string {
  if (value === null) return "";
  const pct = Math.min(Math.round((value / dv) * 100), 100);
  const lvl = level(pct);
  return `
    <div class="off-row">
      <span class="off-row-label">${label}</span>
      <div class="off-track">
        <div class="off-fill" style="width:${pct}%;background:${BAR_COLOR[lvl]};"></div>
      </div>
      <span class="off-level off-level-${lvl}">${lvl.charAt(0).toUpperCase() + lvl.slice(1)}</span>
    </div>`;
}

// Score to corresponding badge image mapping

function nutriscoreSrc(grade: string | null | undefined): string {
  const validNutriscores = ["a", "b", "c", "d", "e"];
  const key =
    grade && validNutriscores.includes(grade.toLowerCase())
      ? grade.toLowerCase()
      : "unknown";
  return browser.runtime.getURL(`score/nutriscore-${key}-new-en.svg`);
}

function novaSrc(group: number | string | null | undefined): string {
  const n = Number(group);
  const key = [1, 2, 3, 4].includes(n) ? n : "unknown";
  return browser.runtime.getURL(`score/nova-group-${key}.svg`);
}

function greenScoreSrc(grade: string | null | undefined): string {
  const validGreenScores = ["a-plus", "a", "b", "c", "d", "e", "f"];
  const key =
    grade && validGreenScores.includes(grade.toLowerCase())
      ? grade.toLowerCase()
      : "unknown";
  return browser.runtime.getURL(`score/green-score-${key}.svg`);
}

// Header

const HEADER = `
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
  <div class="off-header">
    <img class="off-logo-img"
         src="${browser.runtime.getURL("score/off-logo.svg")}"
         alt="Open Food Facts" />
  </div>`;

// Status Renders

export function renderLoading(): HTMLElement {
  const el = document.createElement("div");
  el.className = "off-badge off-loading-badge";
  el.innerHTML = `
    ${HEADER}
    <div class="off-loading">
      <span class="off-spinner"></span>
      Checking Open Food Facts…
    </div>`;
  return el;
}

export function renderNotFound(): HTMLElement {
  const el = document.createElement("div");
  el.className = "off-badge";
  el.innerHTML = `
    ${HEADER}
    <div class="off-notfound">
      Product not in Open Food Facts database yet.<br/>
      <a class="off-link"
         href="https://world.openfoodfacts.org/cgi/product.pl"
         target="_blank"
         rel="noopener">Help add it →</a>
    </div>`;
  return el;
}

export function renderFull(resp: any, ean: string): HTMLElement {
  const sodium_mg =
    resp.nutriments?.sodium_100g != null
      ? resp.nutriments.sodium_100g * 1000
      : null;
  const sugars_g = resp.nutriments?.sugars_100g ?? null;
  const fat_g = resp.nutriments?.fat_100g ?? null;

  const el = document.createElement("div");
  el.className = "off-badge";
  el.innerHTML = `
    ${HEADER}
    <div class="off-nutrients">
      ${nutriBar("Sugars", sugars_g, DV.sugars)}
      ${nutriBar("Fats", fat_g, DV.fat)}
      ${nutriBar("Sodium", sodium_mg, DV.sodium)}
    </div>
    <div class="off-divider"></div>
    <div class="off-scores">
      <img class="off-score-img"
           src="${nutriscoreSrc(resp.nutriscore_grade)}"
           alt="Nutri-Score ${resp.nutriscore_grade ?? "?"}" />
      <img class="off-score-img off-nova-img"
           src="${novaSrc(resp.nova_group)}"
           alt="NOVA ${resp.nova_group ?? "?"}" />
      <img class="off-score-img"
           src="${greenScoreSrc(resp.ecoscore_grade)}"
           alt="Eco-Score ${resp.ecoscore_grade ?? "?"}" />
    </div>
    <a class="off-footer-link"
       href="https://ca.openfoodfacts.org/product/${ean}"
       target="_blank"
       rel="noopener">View full product on Open Food Facts →</a>`;
  return el;
}

// Mounting

export function insertBadge(badge: HTMLElement, container: HTMLElement): void {
  const addToCart =
    container.querySelector<HTMLElement>(".pi-item-actions") ??
    container.querySelector<HTMLElement>('[class*="add-to-cart"]') ??
    container.querySelector<HTMLElement>('[class*="addToCart"]');

  addToCart
    ? addToCart.insertAdjacentElement("beforebegin", badge)
    : container.appendChild(badge);
}
