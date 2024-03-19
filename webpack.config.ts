import path from 'path'
import nodeExternals from 'webpack-node-externals'
import WebpackShellPluginNext from 'webpack-shell-plugin-next'
// @ts-ignore
import ConfigWebpackPlugin from 'config-webpack'

const {
    NODE_ENV = 'production'
} = process.env

module.exports = {
    entry: './src/app.ts',
    devtool: NODE_ENV === 'development' ? 'inline-source-map' : 'source-map',
    mode: NODE_ENV,
    watch: NODE_ENV === 'development',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'index.bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    'ts-loader'
                ]
            }
        ]
    },
    plugins: [
        new WebpackShellPluginNext({
            onBuildEnd: {
                scripts: ['npm run start:prod'],
                blocking: true,
                parallel: false
            }
        }),
        new ConfigWebpackPlugin()
    ],
    externals: [
        nodeExternals()
    ]
}
