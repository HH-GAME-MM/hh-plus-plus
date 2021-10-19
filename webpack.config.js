/* eslint-env node */
const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const BannerBuilder = require('./build/BannerBuilder')

const banner = BannerBuilder.buildBanner()

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    output: {
        filename: 'hh-plus-plus.user.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.svg$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                        },
                    },
                ],
            },
        ]
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                parallel: true,
                uglifyOptions: {
                    output: {
                        beautify: false,
                        preamble: banner,
                    },
                },
            }),
        ],
    },
    // devtool: 'inline-cheap-source-map',
    plugins: [
        new webpack.BannerPlugin({
            banner,
            raw: true,
            entryOnly: true
        })
    ]
}
