export interface BadgeProduct {
  code: string;
  product_name: string;
  brands: string;
  nutriscore_grade?: string | null;
  nova_group?: number | null;
  ecoscore_grade?: string | null;
  nutriments: {
    sodium_100g?: number | null;
    sugars_100g?: number | null;
    fat_100g?: number | null;
    saturated_fat_100g?: number | null;
  };
  allergens_tags?: string[];
  additives_tags?: string[];
}

export interface UserSettings {
  showNutrients: boolean;
  showScores: boolean;
  showAllergens: boolean;
  showAdditives: boolean;
  language: "auto" | "en" | "fr";
}

export type AllergenFlags = string[];

const HC_DV = { sodium: 2400, sugars: 100, fat: 65 } as const;
type Level = "low" | "medium" | "high";

function nutriLevel(value: number, dv: number): Level {
  const pct = (value / dv) * 100;
  if (pct >= 15) return "high";
  if (pct >= 5) return "medium";
  return "low";
}

export class BadgeBuilder {
  private nutrientSections: HTMLElement[] = [];
  private scoreSections: HTMLElement[] = [];
  private allergenSection: HTMLElement | null = null;
  private additiveSection: HTMLElement | null = null;
  private footerSection: HTMLElement | null = null;
  private highFlags: string[] = []; // "High in X" for collapsed bar
  private allergenFlags: string[] = []; // allergen names for collapsed bar

  private readonly product: BadgeProduct;
  private readonly allergens: AllergenFlags;
  private readonly lang: "en" | "fr";

  constructor(product: BadgeProduct, allergens: AllergenFlags = []) {
    this.product = product;
    this.allergens = allergens;
    this.lang = navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
  }

  private t(en: string, fr: string): string {
    return this.lang === "fr" ? fr : en;
  }

  withNutrients(): this {
    const { sodium_100g, sugars_100g, fat_100g } = this.product.nutriments;
    const rows: string[] = [];

    const push = (
      label: string,
      labelFr: string,
      value: number,
      dv: number,
    ) => {
      const lvl = nutriLevel(value, dv);
      if (lvl === "high")
        this.highFlags.push(this.t(`High ${label}`, `${labelFr} élevé`));
      rows.push(this.nutriRow(this.t(label, labelFr), value, dv, lvl));
    };

    if (sodium_100g != null)
      push("Sodium", "Sodium", sodium_100g, HC_DV.sodium);
    if (sugars_100g != null)
      push("Sugars", "Sucres", sugars_100g, HC_DV.sugars);
    if (fat_100g != null) push("Fat", "Gras", fat_100g, HC_DV.fat);

    if (rows.length === 0) return this;

    const el = document.createElement("div");
    el.className = "off-nutrients";
    el.innerHTML = rows.join("");
    this.nutrientSections.push(el);
    return this;
  }

  private nutriRow(
    label: string,
    value: number,
    dv: number,
    lvl: Level,
  ): string {
    const pct = Math.min(Math.round((value / dv) * 100), 100);
    const colors: Record<Level, string> = {
      low: "#2ecc71",
      medium: "#f39c12",
      high: "#e74c3c",
    };
    return `
      <div class="off-row">
        <span class="off-row-label">${label}</span>
        <div class="off-track">
          <div class="off-fill" style="width:${pct}%;background:${colors[lvl]};"></div>
        </div>
        <span class="off-level off-level-${lvl}">
          ${lvl.charAt(0).toUpperCase() + lvl.slice(1)}
        </span>
      </div>`;
  }

  withAllergens(): this {
    const tags = this.product.allergens_tags ?? [];
    if (tags.length === 0) return this;

    const flagged = this.allergens.filter((flag) =>
      tags.some((t) => t.includes(flag)),
    );
    if (flagged.length === 0) return this;

    // Store for collapsed bar display
    this.allergenFlags = flagged.map((f) =>
      f.replace("en:", "").replace(/-/g, " "),
    );

    const el = document.createElement("div");
    el.className = "off-allergens";
    el.innerHTML = `
      <span class="off-allergen-label">${this.t("Contains", "Contient")}:</span>
      ${this.allergenFlags.map((f) => `<span class="off-allergen-tag">${f} ⚠️</span>`).join("")}`;
    this.allergenSection = el;
    return this;
  }

  withScores(): this {
    const pills: string[] = [];

    if (this.product.nutriscore_grade)
      pills.push(`<img class="off-score-img"
        src="${browser.runtime.getURL(`score/nutriscore-${this.product.nutriscore_grade.toLowerCase()}-new-en.svg` as any)}"
        alt="Nutri-Score ${this.product.nutriscore_grade.toUpperCase()}" />`);

    if (this.product.nova_group)
      pills.push(`<img class="off-nova-img"
        src="${browser.runtime.getURL(`score/nova-group-${this.product.nova_group}.svg` as any)}"
        alt="Nova ${this.product.nova_group}" />`);

    if (this.product.ecoscore_grade)
      pills.push(`<img class="off-score-img"
        src="${browser.runtime.getURL(`score/green-score-${this.product.ecoscore_grade.toLowerCase()}.svg` as any)}"
        alt="Eco-Score ${this.product.ecoscore_grade.toUpperCase()}" />`);

    if (pills.length === 0) return this;

    const el = document.createElement("div");
    el.className = "off-scores";
    el.innerHTML = pills.join("");
    this.scoreSections.push(el);
    return this;
  }

  withAdditives(): this {
    const count = this.product.additives_tags?.length ?? 0;
    if (count === 0) return this;
    const el = document.createElement("div");
    el.className = "off-additives";
    el.textContent = `${count} ${this.t("additives", "additifs")}`;
    this.additiveSection = el;
    return this;
  }

  withFooter(): this {
    const el = document.createElement("a");
    el.className = "off-footer-link";
    el.href = `https://world.openfoodfacts.org/product/${this.product.code}`;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.textContent = this.t(
      "View on Open Food Facts →",
      "Voir sur Open Food Facts →",
    );
    this.footerSection = el;
    return this;
  }

  build(): HTMLElement {
    // ── Outer bar (fixed bottom-right) ──
    const bar = document.createElement("div");
    bar.className = "off-bar";

    // ── Collapsed strip ──
    const collapsed = document.createElement("div");
    collapsed.className = "off-bar-collapsed";

    // Logo pill
    collapsed.innerHTML = `
      <div class="off-bar-logo">
        <img class="off-bar-logo-img"
             src="${browser.runtime.getURL("score/off-logo.svg" as any)}"
             alt="Open Food Facts" />
      </div>`;

    // High flags
    if (this.highFlags.length > 0) {
      this.highFlags.forEach((flag) => {
        const chip = document.createElement("span");
        chip.className = "off-bar-flag off-bar-flag--high";
        chip.textContent = flag;
        collapsed.appendChild(chip);
      });
    }

    // Allergen flags
    if (this.allergenFlags.length > 0) {
      this.allergenFlags.forEach((a) => {
        const chip = document.createElement("span");
        chip.className = "off-bar-flag off-bar-flag--allergen";
        chip.textContent = `⚠ ${a}`;
        collapsed.appendChild(chip);
      });
    }

    // If nothing flagged — show all good
    if (this.highFlags.length === 0 && this.allergenFlags.length === 0) {
      const good = document.createElement("span");
      good.className = "off-bar-flag off-bar-flag--good";
      good.textContent = this.t("✓ No concerns", "✓ Aucun problème");
      collapsed.appendChild(good);
    }

    // Chevron
    const chevron = document.createElement("span");
    chevron.className = "off-bar-chevron";
    chevron.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    collapsed.appendChild(chevron);

    // ── Expanded panel (opens upward) ──
    const panel = document.createElement("div");
    panel.className = "off-bar-panel";

    // Append all content sections into panel
    [...this.nutrientSections, ...this.scoreSections].forEach((s) =>
      panel.appendChild(s),
    );
    if (this.allergenSection) panel.appendChild(this.allergenSection);
    if (this.additiveSection) panel.appendChild(this.additiveSection);
    if (this.footerSection) panel.appendChild(this.footerSection);

    // Toggle expand on collapsed click
    collapsed.addEventListener("click", () => {
      const isOpen = bar.classList.toggle("off-bar--open");
      chevron.style.transform = isOpen ? "rotate(180deg)" : "";
    });

    // Collapse on outside click
    document.addEventListener("click", (e) => {
      if (!bar.contains(e.target as Node)) {
        bar.classList.remove("off-bar--open");
        chevron.style.transform = "";
      }
    });

    bar.appendChild(panel);
    bar.appendChild(collapsed);
    return bar;
  }
}
