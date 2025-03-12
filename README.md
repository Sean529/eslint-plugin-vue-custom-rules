# eslint-plugin-vue-custom-rules

Vue 文件的自定义 ESLint 规则集合，专注于提升代码质量和一致性。

## 安装

首先，你需要安装 [ESLint](https://eslint.org/) 和本插件：

```bash
npm install eslint eslint-plugin-vue-custom-rules --save-dev
# 或使用 yarn
yarn add eslint eslint-plugin-vue-custom-rules -D
# 或使用 pnpm
pnpm add eslint eslint-plugin-vue-custom-rules -D
```

## 使用方法

### ESLint 配置文件 (eslint.config.js)

对于 ESLint 9.x 及以上版本，在你的 `eslint.config.js` 中添加：

```js
const vueCustomRules = require('eslint-plugin-vue-custom-rules');

module.exports = [
  // 添加推荐配置
  vueCustomRules.configs.recommended,
  
  // 或者手动配置规则
  {
    files: ['**/*.vue'],
    plugins: {
      'vue-custom-rules': vueCustomRules,
    },
    rules: {
      'vue-custom-rules/script-setup-order': 'error', // 或 'warn'
    }
  }
];
```

### 传统配置文件 (.eslintrc.js)

对于 ESLint 8.x 及以下版本，在你的 `.eslintrc.js` 中添加：

```js
module.exports = {
  plugins: ['vue-custom-rules'],
  extends: [
    // 添加推荐配置
    'plugin:vue-custom-rules/recommended',
  ],
  // 或者手动配置规则
  rules: {
    'vue-custom-rules/script-setup-order': 'error', // 或 'warn'
  }
};
```

## 支持的规则

### script-setup-order

确保 Vue 单文件组件中 `<script setup>` 部分的生命周期函数位于其他代码之后。

#### 规则详情

此规则要求将所有生命周期函数（如 `onLoad`、`onShow`、`mounted` 等）放置在 `<script setup>` 代码块的最后位置，以保持代码结构的一致性和可读性。

✅ 正确示例:

```vue
<script setup>
import { ref } from 'vue';

const count = ref(0);

function increment() {
  count.value++;
}

// 生命周期函数放在最后
onMounted(() => {
  console.log('组件已挂载');
});
</script>
```

❌ 错误示例:

```vue
<script setup>
import { ref } from 'vue';

// 生命周期函数不应该在其他代码之前
onMounted(() => {
  console.log('组件已挂载');
});

const count = ref(0);

function increment() {
  count.value++;
}
</script>
```

#### 选项

此规则目前不支持任何选项。

## 开发

### 安装依赖

```bash
pnpm install
```

### 运行测试

```bash
node test/test.js
```

## 许可证

MIT
