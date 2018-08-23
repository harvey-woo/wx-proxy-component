const nodeExternals = require('webpack-node-externals');
const { resolve } = require('path')
module.exports = {
  context: resolve('src'),
  output: {
    path: resolve('.'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  entry: {
    'dist/wx-proxy-component': './index',
    'example/utils/wx-proxy-component': './index'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader'
      }
    ]
  },
  target: 'node',
  externals: [nodeExternals()]
}