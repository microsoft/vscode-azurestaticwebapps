module.exports = {
    "extends": [
        "../.eslintrc.js"
    ],
    "rules": {
        "no-restricted-imports": ["error", { "patterns": ["**/src/"] }],
    }
};
