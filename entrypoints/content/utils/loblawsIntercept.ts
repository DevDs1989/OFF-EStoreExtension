export default defineUnlistedScript(() => {
  // Extract SKU from path: /en/product-name/p/20039581001_EA
  const sku = window.location.pathname.match(/\/p\/([^/?]+)/)?.[1];

  if (!sku) return;

  let done = false;

  const handleResponse = (url: string, data: any) => {
    if (done) return;
    if (!data || typeof data !== "object") return;

    if ("code" in data && data.code === sku) {
      const gtin = data.gtin ?? data?.variants?.[0]?.gtin;

      if (gtin) {
        done = true;

        window.postMessage({
          type: "GTIN_FOUND",
          payload: { sku, gtin, url },
        });
      }
    }
  };

  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const res = await originalFetch(...args);

    if (done) return res;

    const clone = res.clone();

    clone.text().then((body) => {
      try {
        const json = JSON.parse(body);
        handleResponse(
          typeof args[0] === "string" ? args[0] : (args[0] as Request).url,
          json,
        );
      } catch {}
    });

    return res;
  };

  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string,
    ...rest: any[]
  ) {
    (this as any)._url = url;
    return open.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function () {
    if (done) return send.apply(this, arguments as any);

    this.addEventListener("load", function () {
      try {
        const json = JSON.parse(this.responseText);
        handleResponse((this as any)._url, json);
      } catch {}
    });

    return send.apply(this, arguments as any);
  };
});
