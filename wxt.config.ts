import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Open Food Facts – Metro",
    version: "0.1.0",
    web_accessible_resources: [
      {
        resources: ["score/*.svg", "icon/*.png", "utils/loblawsIntercept.js"],
        matches: ["<all_urls>"],
      },
    ],
    host_permissions: [
      "*://*.metro.ca/*",
      "*://ca.openfoodfacts.org/*",
      "*://*.superc.ca/*",
      "*://*.loblaws.ca/*",
    ],
    runAt: "document_start",
    permissions: ["storage"],
  },
});
