export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "OFF_FETCH") return;

    const ean = message.ean as string;
    const url = `https://ca.openfoodfacts.org/api/v0/product/${ean}.json?countries_tags=en:canada`;

    fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.status === 1 && data.product) {
          const p = data.product;
          sendResponse({
            ok: true,
            code: p.code || ean,
            product_name:
              p.product_name || p.product_name_en || p.product_name_fr || "",
            brands: p.brands || "",
            nutriscore_grade: p.nutriscore_grade || p.nutrition_grades || null,
            nova_group: p.nova_group || null,
            ecoscore_grade: p.ecoscore_grade || null,
            nutriments: {
              sugars_100g: p.nutriments?.sugars_100g ?? null,
              fat_100g: p.nutriments?.fat_100g ?? null,
              sodium_100g: p.nutriments?.sodium_100g ?? null,
              saturated_fat_100g: p.nutriments?.saturated_fat_100g ?? null,
            },
            allergens_tags: p.allergens_tags ?? [],
            additives_tags: p.additives_tags ?? [],
          });
        } else {
          sendResponse({ ok: false });
        }
      })
      .catch((err) => {
        console.error("OFF fetch error:", err);
        sendResponse({ ok: false, error: String(err) });
      });

    return true;
  });
});
