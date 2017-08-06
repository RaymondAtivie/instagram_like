let mix = require('laravel-mix');
// mix.disableNotifications();

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

//NOTE: make vuetify theme variables work
mix.js('resources/assets/js/app.js', 'public/js/bundle.js').extract(['vue', 'vuex', 'vue-router', 'vuetify'])
    .stylus('resources/assets/stylus/entry.styl', 'public/css/vendor.css')
    .sass('node_modules/mdi/scss/materialdesignicons.scss', 'public/css/vendor-icons.css')
    .sass('resources/assets/sass/app.scss', 'public/css')

.sourceMaps();

mix.webpackConfig({
    resolve: {
        // extensions: ['.js', '.vue', '.json', '.css', '.scss', '.sass', '.styl'],
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
            '@': path.resolve('resources/assets/js'),
            'styles': path.resolve('resources/assets/')
        }
    }
});