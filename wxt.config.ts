import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ['tabs', 'tabGroups', 'storage', 'scripting', 'bookmarks'],
    host_permissions: ['<all_urls>'],
  },
});
