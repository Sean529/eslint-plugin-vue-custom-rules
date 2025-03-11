const { execSync } = require('child_process');
const path = require('path');

// 测试文件路径
const testFilePath = path.resolve(__dirname, 'fixtures/Example.vue');

try {
  // 运行 ESLint 命令
  console.log('正在运行 ESLint 检查...');
  const output = execSync(`npx eslint "${testFilePath}" --plugin vue-custom-rules`, { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  console.log('ESLint 检查结果:');
  console.log(output || '没有检测到任何错误或警告');
} catch (error) {
  // 如果 ESLint 发现错误，它会以非零退出码退出
  console.log('ESLint 检查发现问题:');
  console.log(error.stdout);
}
