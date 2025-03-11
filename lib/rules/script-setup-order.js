// custom-rules/script-setup-order.js
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "强制 <script setup> 中的代码顺序",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: null,
    schema: [],
  },
  create(context) {
    // 用于跟踪不同类型节点的最后位置
    let lastImportLoc = -1
    let lastVarDeclLoc = -1
    let lastFunctionLoc = -1
    let onLoadLoc = -1

    // 检查节点顺序是否正确
    function checkOrder(node, nodeType, loc) {
      if (nodeType === "import") {
        lastImportLoc = Math.max(lastImportLoc, loc)
      } else if (nodeType === "var") {
        // 变量声明应该在 import 之后
        if (loc <= lastImportLoc) {
          context.report({
            node,
            message: "变量声明应该放在所有 import 语句之后",
          })
        }
        lastVarDeclLoc = Math.max(lastVarDeclLoc, loc)
      } else if (nodeType === "function") {
        // 函数声明应该在变量声明之后，onLoad 之前
        if (loc <= lastVarDeclLoc) {
          context.report({
            node,
            message: "函数声明应该放在所有变量声明之后",
          })
        }
        lastFunctionLoc = Math.max(lastFunctionLoc, loc)
      } else if (nodeType === "onLoad") {
        // onLoad 应该在所有函数声明之后
        if (loc <= lastFunctionLoc) {
          context.report({
            node,
            message: "onLoad 应该放在所有函数声明之后",
          })
        }
        onLoadLoc = loc
      }
    }

    return {
      ImportDeclaration(node) {
        checkOrder(node, "import", node.loc.start.line)
      },

      VariableDeclaration(node) {
        // 检查是否是在 <script setup> 的顶级作用域中的变量声明
        if (node.parent.type === "Program" || node.parent.type === "ExportNamedDeclaration") {
          checkOrder(node, "var", node.loc.start.line)
        }
      },

      FunctionDeclaration(node) {
        checkOrder(node, "function", node.loc.start.line)
      },

      // 检测 onLoad 调用
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "onLoad") {
          checkOrder(node, "onLoad", node.loc.start.line)
        }
      },
    }
  },
}
