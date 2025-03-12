module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "确保 Vue <script setup> 中的生命周期函数在最后",
      category: "Stylistic Issues",
      recommended: true,
    },
    fixable: "code", // 或 null 如果不提供自动修复
    schema: [], // 无选项
  },
  create(context) {
    const sourceCode = context.getSourceCode()

    // 这些变量用于跟踪节点位置
    let otherNodes = [] // 所有非生命周期函数的节点
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
     * 获取变量或函数的名称
     * @param {Node} node - AST节点
     * @returns {string} 节点的名称
     */
    function getNodeName(node) {
      if (node.type === "ExpressionStatement" && node.expression.type === "CallExpression" && node.expression.callee.name) {
        return node.expression.callee.name
      }
      return ""
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
          if (
            statement.type === "ExpressionStatement" &&
            statement.expression.type === "CallExpression" &&
            isUniAppLifecycleFunction(statement.expression.callee.name)
          ) {
            // uni-app 生命周期函数应该放在最后
            lifecycleNodes.push(statement)
          } else {
            // 所有其他节点
            otherNodes.push(statement)
          }
        })

        // 对节点进行排序
        const allNodes = [
          ...otherNodes, // 所有非生命周期函数的节点
          ...lifecycleNodes, // 最后是 uni-app 生命周期函数
        ]

        // 按正确顺序排序节点
        const correctOrder = [
          ...otherNodes.sort((a, b) => a.range[0] - b.range[0]), // 非生命周期函数节点保持原有顺序
          ...lifecycleNodes.sort((a, b) => getNodeName(a).localeCompare(getNodeName(b))), // 生命周期函数按字母顺序排序
        ]

        // 检查顺序并提供修复
        // 对每个节点进行检查，确保它们在正确的位置
        // 当前文件中的节点顺序
        const currentOrder = [...body].filter(node => 
          otherNodes.includes(node) || 
          lifecycleNodes.includes(node)
        );
        
        // 如果当前顺序与正确顺序不同，报告错误并提供修复
        if (JSON.stringify(currentOrder.map(n => n.range)) !== JSON.stringify(correctOrder.map(n => n.range))) {
          // 使用单个修复操作替换所有内容，避免重叠
          context.report({
            node: node,
            message: "<script setup> 中的生命周期函数应该放在最后",
            fix(fixer) {
              // 找出所有相关节点的范围
              const allNodes = [...currentOrder];
              if (allNodes.length === 0) return null;
              
              // 按照节点在代码中的位置排序
              allNodes.sort((a, b) => a.range[0] - b.range[0]);
              
              // 找出范围的开始和结束
              const startPos = allNodes[0].range[0];
              const endPos = allNodes[allNodes.length - 1].range[1];
              
              // 生成新的代码
              let newCode = '';
              
              // 生成每个节点的代码，并添加适当的间距
              correctOrder.forEach((node, index) => {
                const code = getNodeTextWithComments(node);
                
                // 添加适当的间距
                if (index > 0) {
                  const prevNode = correctOrder[index - 1];
                  
                  // 根据节点类型决定间距
                  const prevIsOther = otherNodes.includes(prevNode);
                  const currentIsOther = otherNodes.includes(node);
                  
                  // 如果节点类型变化，添加空行
                  if ((prevIsOther && !currentIsOther)) {
                    newCode += '\n\n';
                  } else {
                    newCode += '\n';
                  }
                }
                
                newCode += code;
              });
              
              // 返回单个修复操作，替换整个范围
              return fixer.replaceTextRange([startPos, endPos], newCode);
            }
          });
        }
      },
    }
  },
}
