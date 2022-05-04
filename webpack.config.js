const path = require('path');

module.exports = {
  entry: './demo/index.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'gantt-chart.bundle.js',
  },
};
