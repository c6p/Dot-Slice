/**
 * webpack.production.js
 * 
 * What it Does:
 *   Webpack bundles up your application for the browser.
 *   This file configures webpack to create an optimized and minified
 *   build of your code in order to put the compiled files on a production server.
 *   
 * Things to Edit:
 *   Be careful when editing webpack configuration files. They can be very confusing
 *   and break things in weird ways. Changing this file allows you to add new webpack
 *   plugins to your production server, or change the way that webpack is packaging
 *   your deployed files. 
 */

var path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { HashedModuleIdsPlugin } = require('webpack');

module.exports = {
  mode: 'production',
  entry: "./index.js",
  output: {
    path: path.resolve(process.cwd(), 'build'),
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].chunk.js',
    publicPath: '/',
  },
  optimization: {
    minimize: true,
    nodeEnv: 'production',
    sideEffects: true,
    concatenateModules: true,
    splitChunks: { chunks: 'all' },
    runtimeChunk: true,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        // Preprocess our own .css files
        test: /\.css$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
      {
        // Preprocess 3rd party .css files located in node_modules
        test: /\.css$/,
        include: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(eot|otf|ttf|woff|woff2)$/,
        use: 'file-loader',
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              limit: 10 * 1024,
              noquotes: true,
            },
          },
        ],
      },
      {
        test: /\.(jpg|png|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              mozjpeg: {
                enabled: false,
              },
              gifsicle: {
                interlaced: false,
              },
              optipng: {
                optimizationLevel: 7,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4,
              },
            },
          },
        ],
      },
      {
        test: /\.html$/,
        use: 'html-loader',
      },
      {
        test: /\.(mp4|webm)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
          },
        },
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
    new HtmlWebpackPlugin({
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      inject: true,
      template: './index.html',
    }),
    new HashedModuleIdsPlugin({
      hashFunction: 'sha256',
      hashDigest: 'hex',
      hashDigestLength: 20,
    }),
  ],
  resolve: {
    modules: ['node_modules', 'frontend'],
    extensions: ['.js', '.jsx', '.react.js'],
    mainFields: ['browser', 'jsnext:main', 'main'],
  }
};
