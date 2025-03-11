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
    let importNodes = []
    let constVarNodes = []
    let functionNodes = []
    let onLoadNode = null

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
            statement.expression.callee.name === "onLoad"
          ) {
            onLoadNode = statement
          } else if (statement.type === "VariableDeclaration") {
            // 检查是否是箭头函数声明
            let isArrowFunction = false;
            
            // 检查变量声明中是否包含箭头函数
            if (statement.declarations && statement.declarations.length > 0) {
              const declaration = statement.declarations[0];
              if (
                declaration.init && 
                declaration.init.type === "ArrowFunctionExpression"
              ) {
                isArrowFunction = true;
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
        const allNodes = [...importNodes, ...constVarNodes, ...functionNodes]
        if (onLoadNode) {
          allNodes.push(onLoadNode)
        }

        // 按正确顺序排序节点
        const correctOrder = [
          ...importNodes.sort((a, b) => a.range[0] - b.range[0]),
          ...constVarNodes.sort((a, b) => a.range[0] - b.range[0]),
          ...functionNodes.sort((a, b) => a.range[0] - b.range[0])
        ]
        if (onLoadNode) {
          correctOrder.push(onLoadNode)
        }

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
                  
                  // 获取变量声明的代码
                  const varCode = sourceCode.getText(varNode)
                  
                  // 删除原位置的变量声明，并在最后一个 import 之后添加
                  return [
                    fixer.remove(varNode),
                    fixer.insertTextAfter(lastImport, '\n' + varCode)
                  ]
                }
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
                  
                  // 获取函数声明的代码
                  const funcCode = sourceCode.getText(funcNode)
                  
                  // 删除原位置的函数声明，并在最后一个变量声明之后添加
                  return [
                    fixer.remove(funcNode),
                    fixer.insertTextAfter(lastVar, '\n\n' + funcCode)
                  ]
                }
              })
            }
          })
        })

        // 3. onLoad 应该在最后
        if (onLoadNode) {
          const onLoadStart = onLoadNode.range[0]
          functionNodes.forEach((funcNode) => {
            const funcEnd = funcNode.range[1]
            if (onLoadStart < funcEnd) {
              context.report({
                node: onLoadNode,
                message: "onLoad 应该放在所有函数声明之后",
                fix(fixer) {
                  // 找出最后一个函数声明
                  const lastFunc = functionNodes.reduce((latest, current) => {
                    return current.range[1] > latest.range[1] ? current : latest
                  }, functionNodes[0])
                  
                  // 获取 onLoad 的代码
                  const onLoadCode = sourceCode.getText(onLoadNode)
                  
                  // 删除原位置的 onLoad，并在最后一个函数声明之后添加
                  return [
                    fixer.remove(onLoadNode),
                    fixer.insertTextAfter(lastFunc, '\n\n' + onLoadCode)
                  ]
                }
              })
            }
          })
        }
      },
    }
  },
}
