const nodeResolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');

const globals = require('rollup-plugin-node-globals');
// const builtins = require('rollup-plugin-node-builtins');
const plugin_async = require('rollup-plugin-async');
const css = require("rollup-plugin-import-css");
const svg = require('rollup-plugin-svg');

module.exports = [
    {
        input: './server/index.js',
        output: {
            file: 'server-build/index.js',
            format: 'esm',
        },
        external: [ 'std', 'wasi_net','wasi_http'],
        plugins: [
            plugin_async(),
            nodeResolve({preferBuiltins: true}),
            commonjs({ignoreDynamicRequires: false}),
            css(),
            svg({base64: true}),
            globals(),
            // builtins(),
            replace({
                preventAssignment: true,
                'process.env.NODE_ENV': JSON.stringify('production'),
                'process.env.NODE_DEBUG': JSON.stringify(''),
            }),
        ],
    },
];