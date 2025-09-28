import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming/create";

const brand = create({
  base: "dark",
  brandTitle: "POCKET MUNSTERS — UI Lab",
  brandUrl: "https://example.local/",
});

addons.setConfig({
  theme: brand,
  // Hide panel if interactions addon is disabled
  enableShortcuts: true,
  showToolbar: true,
});
