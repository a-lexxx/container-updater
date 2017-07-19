module.exports = {
    root: true,
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        node: true,
        mocha: true
    },
    globals: {
        modules: true
    },
    'extends': 'eslint:recommended',
    rules: {
        'array-bracket-spacing': [2, 'never'],
        'arrow-spacing': 2,
        'brace-style': [2, '1tbs', {
            allowSingleLine: true
        }],
        'comma-dangle': 2,
        'comma-spacing': 2,
        'comma-style': 2,
        'consistent-this': [2, '_this'],
        curly: [2, 'multi-line'],
        'dot-notation': 0,
        'dot-location': [2, 'property'],
        eqeqeq: 2,
        'eol-last': 2,
        'func-call-spacing': 2,
        'guard-for-in': 2,
        'key-spacing': [2, {
            beforeColon: false,
            afterColon: true
        }],
        'keyword-spacing': [2, {
            overrides: {
                'else': { before: true, after: true },
                'while': { before: true, after: true },
                'catch': { before: true, after: true },
                'if': { after: true },
                'for': { after: true },
                'do': { after: true },
                'switch': { after: true },
                'return': { after: true },
                'try': { after: true }
            }
        }],
        'linebreak-style': [2, 'unix'],
        'new-cap': [2, { capIsNew: false }],
        'no-eval': 2,
        'no-caller': 2,
        'no-console': 'off',
        'no-cond-assign': [2, 'except-parens'],
        'no-empty': 2,
        'no-extra-semi': 2,
        'no-loop-func': 2,
        'no-multi-str': 2,
        'no-multiple-empty-lines': [2, { max: 1 }],
        'no-mixed-spaces-and-tabs': 2,
        'no-new-func': 2,
        'no-new-wrappers': 2,
        'no-redeclare': 2,
        'no-trailing-spaces': 2,
        'no-undef': 2,
        'no-unused-vars': 2,
        'no-unused-expressions': 0,
        'no-with': 2,
        'max-depth': [2, 4],
        'max-len': [2, {
            code: 120,
            ignoreStrings: true,
            ignoreComments: true
        }],
        'object-curly-spacing': [2, 'always'],
        'operator-linebreak': [2, 'after'],
        quotes: [2, 'single', 'avoid-escape'],
        'quote-props': [2, 'as-needed', { unnecessary: true, keywords: true }],
        semi: [2, 'always'],
        'space-before-function-paren': [2, 'never'],
        'space-before-blocks': [2, 'always'],
        'space-in-parens': 2,
        'space-infix-ops': 2,
        'space-unary-ops': [2, {
            words: true,
            nonwords: false
        }],
        'spaced-comment': [2, 'always', { block: { balanced: true } }],
        yoda: [2, 'never'],
        'wrap-iife': [2, 'any']
    }
};
