module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "对 Vue <script setup> 中的代码强制排序规则",
      category: "Stylistic Issues",
      recommended: true,
    },
    fixable: "code", // 或 null 如果不提供自动修复
    schema: [], // 无选项
  },
  create(context) {
    const sourceCode = context.getSourceCode()

    // 这些变量用于跟踪节点位置
    let importNodes = [] // import 语句
    let constVarNodes = [] // 变量声明
    let functionNodes = [] // 普通函数声明和箭头函数
    let lifecycleNodes = [] // uni-app 生命周期函数（如 onLoad）

    /**
     * 检查是否是 uni-app 生命周期函数
     * @param {string} funcName - 函数名称
     * @returns {boolean} 是否是生命周期函数
     */
    function isUniAppLifecycleFunction(funcName) {
      // uni-app 生命周期函数列表
      const lifecycleFunctions = [
        // 应用生命周期
        "onLaunch",
        "onShow",
        "onHide",
        "onError",
        "onUniNViewMessage",
        "onUnhandledRejection",
        "onPageNotFound",
        "onThemeChange",
        // 页面生命周期
        "onLoad",
        "onShow",
        "onReady",
        "onHide",
        "onUnload",
        "onPullDownRefresh",
        "onReachBottom",
        "onTabItemTap",
        "onShareAppMessage",
        "onPageScroll",
        "onNavigationBarButtonTap",
        "onBackPress",
        "onNavigationBarSearchInputChanged",
        "onNavigationBarSearchInputConfirmed",
        "onNavigationBarSearchInputClicked",
        "onResize",
        // 组件生命周期
        "beforeCreate",
        "created",
        "beforeMount",
        "mounted",
        "beforeUpdate",
        "updated",
        "beforeDestroy",
        "destroyed",
      ]

      return lifecycleFunctions.includes(funcName)
    }

    /**
     * 获取节点的完整文本，包括前导和尾随注释
     * @param {Node} node - AST节点
     * @returns {string} 包含注释的完整文本
     */
    function getNodeTextWithComments(node) {
      // 获取节点前的注释
      const leadingComments = sourceCode.getCommentsBefore(node)
      // 获取节点后的注释
      const trailingComments = sourceCode.getCommentsAfter(node)

      let text = ""

      // 添加前导注释
      if (leadingComments.length > 0) {
        const firstComment = leadingComments[0]
        // 获取从第一个注释到节点开始之间的所有文本
        text += sourceCode.getText().substring(firstComment.range[0], node.range[0])
      }

      // 添加节点本身的文本
      text += sourceCode.getText(node)

      // 添加尾随注释
      if (trailingComments.length > 0) {
        const lastComment = trailingComments[trailingComments.length - 1]
        // 获取从节点结束到最后一个注释结束之间的所有文本
        text += sourceCode.getText().substring(node.range[1], lastComment.range[1])
      }

      return text
    }

    /**
     * 创建一个范围更大的移除修复，包括节点前后的注释
     * @param {Object} fixer - ESLint fixer对象
     * @param {Node} node - 要移除的AST节点
     * @returns {Object} 修复对象
     */
    function createRemoveWithCommentsFixed(fixer, node) {
      const leadingComments = sourceCode.getCommentsBefore(node)
      const trailingComments = sourceCode.getCommentsAfter(node)

      let start = node.range[0]
      let end = node.range[1]

      // 如果有前导注释，将范围扩展到第一个注释的开始
      if (leadingComments.length > 0) {
        start = leadingComments[0].range[0]
      }

      // 如果有尾随注释，将范围扩展到最后一个注释的结束
      if (trailingComments.length > 0) {
        end = trailingComments[trailingComments.length - 1].range[1]
      }

      // 创建一个范围更大的移除修复
      return fixer.removeRange([start, end])
    }

    return {
      Program(node) {
        // 检查是否是 Vue 文件的 <script setup> 部分
        const filename = context.getFilename()
        if (!filename.endsWith(".vue")) return

        // 获取所有顶级节点
        const body = node.body

        // 分类节点
        body.forEach((statement) => {
          if (statement.type === "ImportDeclaration") {
            importNodes.push(statement)
          } else if (statement.type === "FunctionDeclaration") {
            // 普通函数声明
            functionNodes.push(statement)
          } else if (
            statement.type === "ExpressionStatement" &&
            statement.expression.type === "CallExpression" &&
            isUniAppLifecycleFunction(statement.expression.callee.name)
          ) {
            // uni-app 生命周期函数应该放在最后
            lifecycleNodes.push(statement)
          } else if (statement.type === "VariableDeclaration") {
            // 检查是否是箭头函数声明
            let isArrowFunction = false

            // 检查变量声明中是否包含箭头函数
            if (statement.declarations && statement.declarations.length > 0) {
              const declaration = statement.declarations[0]
              if (declaration.init && declaration.init.type === "ArrowFunctionExpression") {
                isArrowFunction = true
              }
            }

            if (isArrowFunction) {
              // 如果是箭头函数，则归类为函数节点
              functionNodes.push(statement)
            } else {
              // 如果不是箭头函数，则归类为变量节点
              constVarNodes.push(statement)
            }
          }
        })

        // 对节点进行排序
        const allNodes = [
          ...importNodes, // 首先是 import 语句
          ...constVarNodes, // 然后是变量声明
          ...functionNodes, // 然后是普通函数声明和箭头函数
          ...lifecycleNodes, // 最后是 uni-app 生命周期函数
        ]

        // 按正确顺序排序节点
        const correctOrder = [
          ...importNodes.sort((a, b) => a.range[0] - b.range[0]), // 按出现顺序排序 import
          ...constVarNodes.sort((a, b) => a.range[0] - b.range[0]), // 按出现顺序排序变量声明
          ...functionNodes.sort((a, b) => a.range[0] - b.range[0]), // 按出现顺序排序函数声明
          ...lifecycleNodes.sort((a, b) => a.range[0] - b.range[0]), // 按出现顺序排序生命周期函数
        ]

        // 检查顺序并提供修复
        // 1. imports 应该在最前面
        constVarNodes.forEach((varNode) => {
          const varStart = varNode.range[0]
          importNodes.forEach((importNode) => {
            const importEnd = importNode.range[1]
            if (varStart < importEnd) {
              context.report({
                node: varNode,
                message: "变量声明应该放在所有 import 之后",
                fix(fixer) {
                  // 找出最后一个 import 语句
                  const lastImport = importNodes.reduce((latest, current) => {
                    return current.range[1] > latest.range[1] ? current : latest
                  }, importNodes[0])

                  // 获取变量声明的代码（包括注释）
                  const varCode = getNodeTextWithComments(varNode)

                  // 删除原位置的变量声明（包括注释），并在最后一个 import 之后添加
                  return [createRemoveWithCommentsFixed(fixer, varNode), fixer.insertTextAfter(lastImport, "\n" + varCode)]
                },
              })
            }
          })
        })

        // 2. 函数声明应该在变量声明之后
        functionNodes.forEach((funcNode) => {
          const funcStart = funcNode.range[0]
          constVarNodes.forEach((varNode) => {
            const varEnd = varNode.range[1]
            if (funcStart < varEnd) {
              context.report({
                node: funcNode,
                message: "函数声明应该放在变量声明之后",
                fix(fixer) {
                  // 找出最后一个变量声明
                  const lastVar = constVarNodes.reduce((latest, current) => {
                    return current.range[1] > latest.range[1] ? current : latest
                  }, constVarNodes[0])

                  // 获取函数声明的代码（包括注释）
                  const funcCode = getNodeTextWithComments(funcNode)

                  // 删除原位置的函数声明（包括注释），并在最后一个变量声明之后添加
                  return [createRemoveWithCommentsFixed(fixer, funcNode), fixer.insertTextAfter(lastVar, "\n\n" + funcCode)]
                },
              })
            }
          })
        })

        // 3. 生命周期函数（如 onLoad）应该在所有函数声明之后
        lifecycleNodes.forEach((lifecycleNode) => {
          const lifecycleStart = lifecycleNode.range[0]
          functionNodes.forEach((funcNode) => {
            const funcEnd = funcNode.range[1]
            if (lifecycleStart < funcEnd) {
              context.report({
                node: lifecycleNode,
                message: "uni-app 生命周期函数应该放在所有函数声明之后",
                fix(fixer) {
                  // 找出最后一个函数声明
                  const lastFunc = functionNodes.reduce((latest, current) => {
                    return current.range[1] > latest.range[1] ? current : latest
                  }, functionNodes[0])

                  // 获取生命周期函数的代码（包括注释）
                  const lifecycleCode = getNodeTextWithComments(lifecycleNode)

                  // 删除原位置的生命周期函数（包括注释），并在最后一个函数声明之后添加
                  return [createRemoveWithCommentsFixed(fixer, lifecycleNode), fixer.insertTextAfter(lastFunc, "\n\n" + lifecycleCode)]
                },
              })
            }
          })
        })
      },
    }
  },
}
