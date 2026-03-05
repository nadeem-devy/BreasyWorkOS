const path = require('path');

module.exports = {
  entry: {
    'service-worker': './src/background/service-worker.ts',
    'activity-monitor': './src/content/activity-monitor.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
