import type { StorybookConfig } from '@storybook/html-vite';

// Environment-driven toggles to trim static bundle size
const DEV = process.env.STORYBOOK_DEV === '1' || process.env.NODE_ENV !== 'production';
const ENABLE_INTERACTIONS = process.env.SB_ENABLE_INTERACTIONS !== '0' && DEV;
const HEAVY_ADDONS = process.env.SB_HEAVY_ADDONS === '1' || DEV; // a11y/measure/outline/viewport

const addons: string[] = [
  '@storybook/addon-essentials',
  '@storybook/addon-links',
  '@storybook/addon-themes',
];

if (HEAVY_ADDONS) {
  addons.push(
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-outline',
    '@storybook/addon-measure',
  );
}
if (ENABLE_INTERACTIONS) {
  addons.push('@storybook/addon-interactions');
}

const baseConfig: StorybookConfig = {
  framework: {
    name: '@storybook/html-vite',
    options: {}
  },
  stories: [
    '../stories/**/*.stories.@(ts|js)'
  ],
  addons,
  staticDirs: [
    { from: '../dist-web', to: '/assets' },
    { from: '../dist-publish', to: '/publish' }
  ],
  core: {},
  docs: { autodocs: 'tag' },
};

// Export with viteFinal to ensure sourcemaps are emitted for static builds
const finalConfig: any = {
  ...baseConfig,
  viteFinal: async (viteConfig: any) => {
    viteConfig.build = viteConfig.build || {};
    // Emit source maps to map manager-bundle.js back to sources
    viteConfig.build.sourcemap = true;
    return viteConfig;
  },
};

export default finalConfig;
