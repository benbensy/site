import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  astro: true,
  rules: {
    'no-irregular-whitespace': 'off',
    'style/brace-style': 'off',
  },
})
