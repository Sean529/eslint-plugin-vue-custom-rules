<template>
  <div>示例组件</div>
</template>

<script setup>
// 这个文件故意违反了顺序规则，用于测试

// 函数声明在变量声明之前（错误的顺序）


// 变量声明

// onLoad 不在最后（错误的顺序）

// import 语句不在最前面（错误的顺序）
// 这个文件故意违反了顺序规则，用于测试

// 函数声明在变量声明之前（错误的顺序）


// 变量声明

// onLoad 不在最后（错误的顺序）

// import 语句不在最前面（错误的顺序）
import { ref } from 'vue';

const testVar = 'test';

// 另一个函数声明
function anotherFunction() {
  console.log('另一个函数');
}
function testFunction() {
  console.log('这个函数应该在变量声明之后');
}

// 另一个函数声明

onLoad(() => {
  console.log('onLoad 应该在最后');
})

</script>

<style>
.example {
  color: red;
}
</style>
