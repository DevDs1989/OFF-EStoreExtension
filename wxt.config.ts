import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Open Food Facts – Metro",
    version: "0.1.0",
    web_accessible_resources: [
      {
        resources: ["score/*.svg", "icon/*.png"],
        matches: ["<all_urls>"],
      },
    ],
    host_permissions: [
      "*://*.metro.ca/*",
      "*://ca.openfoodfacts.org/*",
      "*://*.superc.ca/*",
    ],
    permissions: ["storage"],
  },
});
