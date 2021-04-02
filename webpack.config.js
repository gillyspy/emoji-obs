const currentTask = process.env.npm_lifecycle_event;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path');
const fse = require('fs-extra');

const postcssplugins = [
    require('postcss-import'),
    require('postcss-mixins'),
    require('postcss-simple-vars'),
    require('postcss-hexrgba'),
    require('postcss-nested'),
    require('autoprefixer')
];

let cssConfig = {
    test: /[.]css$/i,
    use : [
        //'style-loader',
        'css-loader?url=false',
        {
            loader : 'postcss-loader',
            options: {
                plugins: postcssplugins
            }
        }
    ]
}

class RunAfterCompile {
    apply(compiler) {
        compiler.hooks.done.tap('Copy images', function () {
            fse.copySync('./app/assets/img', './docs/assets/img')
        })
    }
}

let pages = fse.readdirSync('./app').filter(function (f) {
    return f.endsWith('.html');
}).map(function (page) {
    return new HtmlWebpackPlugin({
        filename: page,
        template: `./app/${page}`
    })
});

let config = {
    entry  : './app/assets/scripts/App.js',
    module : {
        rules: [ //
            cssConfig
        ]
    },/*,
    optimization : {
        runtimeChunk : "multiple"
    }*/
    plugins: pages
}

if (currentTask == 'dev') {
    config.output = {
        filename : 'bundled.js',
        path : path.resolve( __dirname, '/app' ) //multiplatform friendly
    };
    config.devServer = {
        before          : function (app, server) {
            server._watch('./app/**/*.html')

        },
        contentBase     : path.join(__dirname, 'app'),
        hot             : true,
        host            : '10.0.0.2',
        disableHostCheck: true,
        // host :  '0.0.0.0',
        port            : 3000

    }
    config.mode = 'development'
    cssConfig.use.unshift('style-loader')

} else if (currentTask == 'build') {
    config.module.rules.push({
        test   : /\.js$/,
        exclude: /(node_modules)/,
        use    : {
            loader : 'babel-loader',
            options: {
                presets: ['@babel/preset-env']
            }
        }
    })
    config.output = {
        filename     : '[name].[chunkhash].js',
        chunkFilename: '[name].[chunkhash].js',
        path         : path.resolve(__dirname, 'docs') //multiplatform friendly
    };
    config.mode = 'production';
    config.optimization = {
        splitChunks: {
            chunks: 'all'
        }
    }
    config.plugins.push(
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
          filename: 'styles.[chunkhash].css'
      }),
      new RunAfterCompile()
    )
    config.module = {
        rules: [cssConfig]
    }

    cssConfig.use.unshift(MiniCssExtractPlugin.loader)
    postcssplugins.push(require('cssnano'))

}

module.exports = config;

