require('./bootstrap');

import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router'
import Vuetify from 'vuetify';

Vue.use(Vuetify);

import store from './store/store';
import router from './router/router';
import App from './App.vue';

const app = new Vue({
    el: '#app',
    render: h => h(App),
    router,
    store,
});