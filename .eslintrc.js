module.exports = {
  // 使用本地插件
  plugins: ['vue-custom-rules'],
  // 指定解析器
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  // 启用规则
  rules: {
    'vue-custom-rules/script-setup-order': 'error'
  }
};
