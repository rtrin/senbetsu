import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ['tabs', 'tabGroups', 'storage', 'bookmarks'],
    host_permissions: [
      'https://senbetsuapp.com/*',
      'https://api.lemonsqueezy.com/*',
      'https://api.openai.com/*',
      // Required narrowly because provider requests run from the service worker.
      'https://api.anthropic.com/*',
      'https://generativelanguage.googleapis.com/*',
    ],
    optional_permissions: ['scripting'],
    optional_host_permissions: ['<all_urls>'],
  },
});
