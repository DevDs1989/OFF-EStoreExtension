function logoImg(): string {
  return `<img class="off-bar-logo-img"
    src="${browser.runtime.getURL("score/off-logo.svg" as any)}"
    alt="Open Food Facts" />`;
}

export function renderLoading(_ean?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "off-bar-loading";
  el.innerHTML = `
    <div class="off-bar-logo">${logoImg()}</div>
    <span class="off-spinner"></span>
    <span style="font-size:13px;color:#555;">Checking Open Food Facts…</span>`;
  return el;
}

export function renderNotFound(ean: string): HTMLElement {
  const bar = document.createElement("div");
  bar.className = "off-bar";

  const panel = document.createElement("div");
  panel.className = "off-bar-panel";
  panel.innerHTML = `
    <div class="off-notfound">
      Product not in Open Food Facts yet.<br/>
      <a href="https://world.openfoodfacts.org/cgi/search.pl?search_terms=${ean}"
         target="_blank" rel="noopener noreferrer" class="off-link">
        Search on Open Food Facts →
      </a>
    </div>`;

  const collapsed = document.createElement("div");
  collapsed.className = "off-bar-collapsed";
  collapsed.innerHTML = `
    <div class="off-bar-logo">${logoImg()}</div>
    <span class="off-bar-flag off-bar-flag--allergen">Product not found</span>
    <span class="off-bar-chevron">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>`;

  collapsed.addEventListener("click", () => {
    bar.classList.toggle("off-bar--open");
  });

  document.addEventListener("click", (e) => {
    if (!bar.contains(e.target as Node)) bar.classList.remove("off-bar--open");
  });

  bar.appendChild(panel);
  bar.appendChild(collapsed);
  return bar;
}
