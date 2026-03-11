function headerHtml(): string {
  return `
    <div class="off-header">
      <img class="off-logo-img"
           src="${browser.runtime.getURL("score/off-logo.svg" as any)}"
           alt="Open Food Facts" />
    </div>`;
}

function footerHtml(ean?: string): string {
  const href = ean
    ? `https://world.openfoodfacts.org/product/${ean}`
    : "https://world.openfoodfacts.org/";
  return `
    <a class="off-footer-link"
       href="${href}"
       target="_blank"
       rel="noopener noreferrer">
      View on Open Food Facts →
    </a>`;
}

export function renderLoading(ean?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "off-badge off-loading-badge";
  el.innerHTML = `
    ${headerHtml()}
    <div class="off-loading">
      <span class="off-spinner"></span>
      Checking Open Food Facts…
    </div>
    ${footerHtml(ean)}
  `;
  return el;
}

export function renderNotFound(ean: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "off-badge";
  el.innerHTML = `
    ${headerHtml()}
    <div class="off-notfound">
      Product not in Open Food Facts yet.<br/>
      <a href="https://world.openfoodfacts.org/cgi/search.pl?search_terms=${ean}"
         target="_blank"
         rel="noopener noreferrer"
         class="off-link">
        Search on Open Food Facts →
      </a>
    </div>
    ${footerHtml(ean)}
  `;
  return el;
}
