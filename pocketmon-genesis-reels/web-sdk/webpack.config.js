const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.[contenthash].js',
        publicPath: '/'
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true
                    },
                    mangle: true
                }
            })
        ],
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                },
                gameAssets: {
                    test: /[\\/]assets[\\/]/,
                    name: 'assets',
                    chunks: 'all'
                }
            }
        }
    },
    plugins: [
        new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[hash][ext][query]'
                }
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    }
};