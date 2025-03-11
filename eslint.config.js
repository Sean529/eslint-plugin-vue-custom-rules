// 导入本地插件
const vueCustomRulesPlugin = require('./lib/index.js');
const vueEslintParser = require('vue-eslint-parser');

module.exports = [
  {
    // 指定 Vue 文件的解析器
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueEslintParser,
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    // 使用本地插件
    plugins: {
      'vue-custom-rules': vueCustomRulesPlugin
    },
    // 启用规则
    rules: {
      'vue-custom-rules/script-setup-order': 'error'
    }
  }
];
