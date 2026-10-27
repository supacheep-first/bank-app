const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (_env, { mode }) => {
  const prod = mode === 'production'
  return {
    entry: './src/index.tsx',
    output: {
      // default path is ./dist
      filename: prod ? '[name].[contenthash].js' : '[name].js',
      clean: true,
      publicPath: '/', // refresh at /pin loads the bundle from /, not /pin/
    },
    resolve: { extensions: ['.tsx', '.ts', '.js'] },
    module: {
      rules: [
        { test: /\.tsx?$/, use: 'ts-loader' }, // transpiles and type-checks
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        { test: /\.png$/, type: 'asset' }, // < 8 KB becomes a data URI
      ],
    },
    plugins: [new HtmlWebpackPlugin({ template: 'public/index.html' })],
    devServer: {
      port: 3000,
      historyApiFallback: true,
      proxy: [{ context: ['/api'], target: 'http://localhost:8080' }],
    },
    devtool: prod ? false : 'eval-source-map',
  }
}
