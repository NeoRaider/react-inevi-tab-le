module.exports = {
	entry: './src/index.tsx',
	output: {
		filename: 'bundle.js',
		path: __dirname + '/dist',
	},

	devtool: 'source-map',

	devServer: {
		publicPath: '/dist/',
	},

	resolve: {
		extensions: ['.ts', '.tsx', '.js']
	},

	module: {
		rules: [
			{ test: /\.tsx?$/, loader: 'ts-loader' },
			{ test: /\.css$/, use: ['style-loader', 'css-loader'] },
		],
	},
};
