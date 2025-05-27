import antfu from '@antfu/eslint-config'

export default antfu({
  astro: true,
  formatters: true,
  typescript: true,
  rules: {
    'no-irregular-whitespace': 'off',
    'style/brace-style': 'off',
    'style/no-trailing-spaces': 'off',
    'antfu/if-newline': 'off',
  },
  markdown: false,
})
