export default defineContentScript({
  matches: ["*://*.loblaws.ca/*"],
  runAt: "document_start",
  world: "MAIN",
  main() {
    const sku = window.location.pathname.match(/\/p\/([^/?]+)/)?.[1];
    if (!sku) return;

    let done = false;

    const handleResponse = (data: any) => {
      if (done) return;
      if (!data || typeof data !== "object") return;
      const code = data.code ?? data.productCode;
      if (code !== sku) return;
      const gtin = data.gtin ?? data?.variants?.[0]?.gtin;
      if (!gtin) return;
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
