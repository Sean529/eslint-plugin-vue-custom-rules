const { ESLint } = require('eslint');
const path = require('path');

// 导入我们的规则
const scriptSetupOrderRule = require('../lib/rules/script-setup-order');

async function runTest() {
  // 创建 ESLint 实例
  const eslint = new ESLint({
    // ESLint 9.x 版本的扩展配置
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.vue'],
        languageOptions: {
          parser: require('vue-eslint-parser'),
          ecmaVersion: 2020,
          sourceType: 'module'
        },
        plugins: {
          'vue-custom-rules': {
            rules: {
              'script-setup-order': scriptSetupOrderRule
            }
          }
        },
        rules: {
          'vue-custom-rules/script-setup-order': 'error'
        }
      }
    ]
  });

  // 测试文件路径
  const filePath = path.resolve(__dirname, 'fixtures/Example.vue');

  try {
    // 运行 lint
    const results = await eslint.lintFiles([filePath]);
    
    // 输出结果
    console.log('ESLint 检查结果:');
    
    if (results.length === 0) {
      console.log('没有找到文件或没有检测到错误');
      return;
    }
    
    const result = results[0];
    
    if (result.errorCount === 0 && result.warningCount === 0) {
      console.log('没有检测到任何错误或警告');
    } else {
      console.log(`文件: ${result.filePath}`);
      console.log(`错误数: ${result.errorCount}, 警告数: ${result.warningCount}`);
      
      result.messages.forEach((message, index) => {
        console.log(`\n问题 #${index + 1}:`);
        console.log(`  行: ${message.line}, 列: ${message.column}`);
        console.log(`  严重性: ${message.severity === 1 ? '警告' : '错误'}`);
        console.log(`  消息: ${message.message}`);
        console.log(`  规则: ${message.ruleId}`);
      });
    }
  } catch (error) {
    console.error('测试运行失败:', error);
  }
}

runTest();
