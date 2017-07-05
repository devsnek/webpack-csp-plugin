const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCspPlugin = require('../src');

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve('./dist'),
    filename: 'assets/[chunkhash].js',
    chunkFilename: 'assets/[chunkhash].js',
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new ExtractTextPlugin('assets/[contenthash].css'),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './index.html',
      inject: true,
      minify: {
        removeComments: false,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
      },
      chunksSortMode: 'dependency',
    }),
    new WebpackCspPlugin({
      output: 'csp_header.txt',
      reportURI: 'https://gus.host/cspreport',
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
  module: {
    loaders: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          loader: 'css-loader?sourceMaps',
        }),
      },
    ],
  },
};
