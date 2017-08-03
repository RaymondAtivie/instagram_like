require('./bootstrap');

import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router'
import Vuetify from 'vuetify';

Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(Vuetify);

import router from './router';
import App from './App.vue';

const app = new Vue({
    el: '#app',
    render: h => h(App),
    router
});