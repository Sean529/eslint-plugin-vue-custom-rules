module.exports = {
  rules: {
    "script-setup-order": require("./rules/script-setup-order"),
  },
  configs: {
    recommended: {
      plugins: ["vue-custom-rules"],
      rules: {
        "vue-custom-rules/script-setup-order": "error",
      },
    },
  },
}
