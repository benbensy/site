import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
// @ts-check
import { defineConfig } from 'astro/config'
import remarkToc from 'remark-toc'
import { transformerDirectives, transformerVariantGroup } from 'unocss'
import unocss from 'unocss/astro'
import presetWind3 from 'unocss/preset-wind3'
import tsConfigPaths from 'vite-tsconfig-paths'

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  integrations: [mdx(), sitemap(), unocss({
    injectReset: '@unocss/reset/tailwind-compat.css',
    presets: [presetWind3()],
    transformers: [transformerDirectives(), transformerVariantGroup()],
  }), icon()],
  vite: {
    plugins: [tsConfigPaths()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
    remarkPlugins: [
      [remarkToc, { heading: 'toc', maxDepth: 3 }],
    ],
  },
})
