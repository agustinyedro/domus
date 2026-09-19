import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import cloudflare from '@astrojs/cloudflare';

// El adaptador de Cloudflare (miniflare) corrompe la caché del
// optimizador SSR de Vite en `astro dev` (errores "file does not exist
// in deps_ssr"). En dev se usa SSR plano de Node; el adaptador solo
// se aplica en build/preview, que es donde realmente importa.
const isBuild = process.env.NODE_ENV === 'production';

export default defineConfig({
  site: 'https://domus.com.ar',
  output: 'static',
  ...(isBuild ? { adapter: cloudflare() } : {}),
  integrations: [vue()],
  vite: {
    css: {
      preprocessorOptions: {}
    },
    ssr: {
      external: ['@supabase/supabase-js']
    }
  }
});
