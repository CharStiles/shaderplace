const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    codemirror: './editor.js',
    index: './index.js'
  },
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, './dist/'),
    filename: '[name].bundle.js',
    publicPath: '/editor/dist/'
  },
  devServer: {
    contentBase: path.join(__dirname),
    compress: true,
    socket: 'socket',
    inline:true,
    disableHostCheck: true,
    watchContentBase: true,
    publicPath: '/dist/',
    historyApiFallback: {
      index: 'index.html'
    }
  }
}
