module.exports = {
  rules: {
    "script-setup-order": require("./rules/script-setup-order")
  },
  configs: {
    recommended: {
      plugins: ["vue-script-setup-order"],
      rules: {
        "vue-script-setup-order/script-setup-order": "error"
      }
    }
  }
};