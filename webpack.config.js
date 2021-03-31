const currentTask = process.env.npm_lifecycle_event;
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path');
const fse = require('fs-extra');

let pages = fse.readdirSync('./app').filter(function(f){
    return f.endsWith('.html');
}).map(function(page){
    return new HtmlWebpackPlugin({
        filename : page,
        template : `./app/${page}`
    })
});

let config = {
    entry: './app/assets/scripts/App.js',
    plugins : pages,
    module : {
        rules : [ //
        // cssConfig
         ]
    }/*,
    optimization : {
        runtimeChunk: "multiple"
    }*/
}

if (currentTask == 'dev') {
    config.output = {
        filename : 'bundled.js',
        path : path.resolve( __dirname, 'app' ) //multiplatform friendly
    };
    config.devServer = {
        before : function(app, server){
            server._watch('./app/**/*.html')

        },
        contentBase : path.join(__dirname, 'app'),
        hot : true,
        host : '10.0.0.2',
        disableHostCheck : true,
        // host :  '0.0.0.0',
        port : 3000

    }
    config.mode = 'development'

}

module.exports = config;

