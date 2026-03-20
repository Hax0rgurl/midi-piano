module.exports = [
  {
    files: ["**/*.html"],
    plugins: {
      html: require('eslint-plugin-html')
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        OfflineAudioContext: "readonly",
        Blob: "readonly",
        URL: "readonly",
        ArrayBuffer: "readonly",
        DataView: "readonly",
        setTimeout: "readonly",
        console: "readonly",
        alert: "readonly",
        isNaN: "readonly",
        Math: "readonly",
        parseFloat: "readonly",
        parseInt: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "error"
    }
  }
];
