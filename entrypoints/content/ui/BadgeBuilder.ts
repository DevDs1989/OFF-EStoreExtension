// Types — trimmed to only what the badge needs
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
    fat_100g?: number | null; // <-- ADD THIS
    saturated_fat_100g?: number | null;
  };
  allergens_tags?: string[];
  additives_tags?: string[];
}

export interface UserSettings {
  showNutriscore: boolean;
  showNova: boolean;
  showEcoscore: boolean;
  showAllergens: boolean;
  showAdditives: boolean;
  allergenFlags: string[]; // e.g. ['gluten', 'milk']
  language: "auto" | "en" | "fr";
}

// Health Canada %DV thresholds (per 100g)
const HC_DV = {
  sodium: 2400,
  sugars: 100,
  fat: 65,
} as const;
type Level = "low" | "medium" | "high";

function nutriLevel(value: number, dv: number): Level {
  const pct = (value / dv) * 100;
  if (pct >= 15) return "high";
  if (pct >= 5) return "medium";
  return "low";
}

export class BadgeBuilder {
  private sections: HTMLElement[] = [];
  private readonly product: BadgeProduct;
  private readonly settings: UserSettings;
  private readonly lang: "en" | "fr";

  constructor(product: BadgeProduct, settings: UserSettings) {
    this.product = product;
    this.settings = settings;
    this.lang = this.resolveLanguage();
  }

  private resolveLanguage(): "en" | "fr" {
    if (this.settings.language === "en") return "en";
    if (this.settings.language === "fr") return "fr";
    // 'auto' — check browser language
    return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
  }

  private t(en: string, fr: string): string {
    return this.lang === "fr" ? fr : en;
  }

  static buildLoadingFrame(): HTMLElement {
    const badge = document.createElement("div");
    badge.className = "off-badge off-loading-badge";

    // header
    const header = document.createElement("div");
    header.className = "off-header";
    header.innerHTML = `
      <img class="off-logo-img"
           src="${browser.runtime.getURL("score/off-logo.svg" as any)}"
           alt="Open Food Facts" />`;

    // body
    const body = document.createElement("div");
    body.className = "off-loading";
    body.innerHTML = `<span class="off-spinner"></span> Checking Open Food Facts…`;

    // footer
    const footer = document.createElement("a");
    footer.className = "off-footer-link";
    footer.href = "https://world.openfoodfacts.org/";
    footer.target = "_blank";
    footer.rel = "noopener noreferrer";
    footer.textContent = "View on Open Food Facts →";

    badge.append(header, body, footer);
    return badge;
  }

  withHeader(): this {
    const el = document.createElement("div");
    el.className = "off-header";
    el.innerHTML = `
      <img class="off-logo-img"
           src="${browser.runtime.getURL("score/off-logo.svg" as any)}"
           alt="Open Food Facts" />`;
    this.sections.push(el);
    return this;
  }

  withNutrients(): this {
    const { sodium_100g, sugars_100g, fat_100g } = this.product.nutriments;

    const rows: string[] = [];

    if (sodium_100g != null) {
      const lvl = nutriLevel(sodium_100g, HC_DV.sodium);
      rows.push(
        this.nutriRow(
          this.t("Sodium", "Sodium"),
          sodium_100g,
          HC_DV.sodium,
          lvl,
        ),
      );
    }
    if (sugars_100g != null) {
      const lvl = nutriLevel(sugars_100g, HC_DV.sugars);
      rows.push(
        this.nutriRow(
          this.t("Sugars", "Sucres"),
          sugars_100g,
          HC_DV.sugars,
          lvl,
        ),
      );
    }
    if (fat_100g != null) {
      const lvl = nutriLevel(fat_100g, HC_DV.fat);
      rows.push(
        this.nutriRow(this.t("Fats", "Gras"), fat_100g, HC_DV.fat, lvl),
      );
    }
    if (rows.length === 0) return this;

    const el = document.createElement("div");
    el.className = "off-nutrients";
    el.innerHTML = rows.join("");
    this.sections.push(el);
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
    if (!this.settings.showAllergens) return this; // respects future toggle
    const tags = this.product.allergens_tags ?? [];
    if (tags.length === 0) return this;

    const flagged = this.settings.allergenFlags.filter((flag) =>
      tags.some((t) => t.includes(flag)),
    );
    if (flagged.length === 0) return this;

    const el = document.createElement("div");
    el.className = "off-allergens";
    el.innerHTML = `
      <span class="off-allergen-label">${this.t("Contains", "Contient")}:</span>
      ${flagged.map((f) => `<span class="off-allergen-tag">${f} ⚠️</span>`).join("")}`;
    this.sections.push(el);
    return this;
  }

  withScores(): this {
    const pills: string[] = [];

    if (this.settings.showNutriscore && this.product.nutriscore_grade) {
      pills.push(`<img class="off-score-img"
        src="${browser.runtime.getURL(`score/nutriscore-${this.product.nutriscore_grade.toLowerCase()}-new-en.svg` as any)}"
        alt="Nutri-Score ${this.product.nutriscore_grade.toUpperCase()}" />`);
    }
    if (this.settings.showNova && this.product.nova_group) {
      pills.push(`<img class="off-nova-img"
        src="${browser.runtime.getURL(`score/nova-group-${this.product.nova_group}.svg` as any)}"
        alt="Nova ${this.product.nova_group}" />`);
    }
    if (this.settings.showEcoscore && this.product.ecoscore_grade) {
      pills.push(`<img class="off-score-img"
        src="${browser.runtime.getURL(`score/green-score-${this.product.ecoscore_grade.toLowerCase()}.svg` as any)}"
        alt="Eco-Score ${this.product.ecoscore_grade.toUpperCase()}" />`);
    }

    if (pills.length === 0) return this;

    const el = document.createElement("div");
    el.className = "off-scores";
    el.innerHTML = pills.join("");
    this.sections.push(el);
    return this;
  }

  withAdditives(): this {
    if (!this.settings.showAdditives) return this;
    const count = this.product.additives_tags?.length ?? 0;
    if (count === 0) return this;

    const el = document.createElement("div");
    el.className = "off-additives";
    el.textContent = `${count} ${this.t("additives", "additifs")}`;
    this.sections.push(el);
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
    this.sections.push(el);
    return this;
  }

  build(): HTMLElement {
    const badge = document.createElement("div");
    badge.className = "off-badge";
    for (const section of this.sections) {
      badge.appendChild(section);
    }
    return badge;
  }
}
