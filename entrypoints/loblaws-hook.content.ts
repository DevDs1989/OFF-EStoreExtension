export default defineContentScript({
  matches: ["*://*.loblaws.ca/*"],
  runAt: "document_start",
  world: "MAIN",
  main() {
    // SPA navigation detection
    const ogPushState = history.pushState.bind(history);
    const ogReplaceState = history.replaceState.bind(history);

    function onNavigate() {
      done = false; // reset so next product page can intercept
      window.dispatchEvent(new CustomEvent("off:locationchange"));
    }

    history.pushState = (...args) => {
      ogPushState(...args);
      onNavigate();
    };
    history.replaceState = (...args) => {
      ogReplaceState(...args);
      onNavigate();
    };
    window.addEventListener("popstate", onNavigate);

    // GTIN interception
    let done = false;

    const handleResponse = (data: any) => {
      if (done) return;
      if (!data || typeof data !== "object") return;

      const gtin = data.gtin ?? data?.variants?.[0]?.gtin;
      if (!gtin) return;

      // Dynamically read the current SKU at intercept time, not at script start
      const sku = window.location.pathname.match(/\/p\/([^/?]+)/)?.[1];
      if (!sku) return;

      const code = data.code ?? data.productCode;
      if (code !== sku) return;

      done = true;
      window.postMessage({ type: "GTIN_FOUND", payload: { sku, gtin } });
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (done) return res;
      const clone = res.clone();
      clone.text().then((body) => {
        try {
          handleResponse(JSON.parse(body));
        } catch {}
      });
      return res;
    };

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string,
      async: boolean = true,
      username?: string | null,
      password?: string | null,
    ) {
      (this as any)._url = url;
      origOpen.call(this, method, url, async, username, password);
    };

    XMLHttpRequest.prototype.send = function (
      this: XMLHttpRequest,
      body?: Document | XMLHttpRequestBodyInit | null,
    ) {
      if (!done) {
        this.addEventListener("load", function () {
          try {
            handleResponse(JSON.parse(this.responseText));
          } catch {}
        });
      }
      return origSend.call(this, body);
    };
  },
});
