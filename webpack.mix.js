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

mix.js('resources/assets/js/app.js', 'public/js/bundle.js').extract(['vue', 'vuex', 'vue-router', 'vuetify'])
    .stylus('node_modules/vuetify/src/stylus/main.styl', 'public/css/vendor.css')
    .sass('resources/assets/sass/app.scss', 'public/css');