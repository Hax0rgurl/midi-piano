import js from "@eslint/js";
import html from "eslint-plugin-html";

export default [
    js.configs.recommended,
    {
        files: ["**/*.html"],
        plugins: {
            html
        },
        languageOptions: {
            globals: {
                window: "readonly",
                document: "readonly",
                AudioContext: "readonly",
                webkitAudioContext: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                console: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                Blob: "readonly",
                URL: "readonly",
                localStorage: "readonly"
            }
        },
        rules: {
            "no-unused-vars": ["error", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false }]
        }
    }
];
