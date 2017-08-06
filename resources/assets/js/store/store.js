import Vue from 'vue';
import Vuex from 'vuex';
import auth from '@/store/modules/authStore';

Vue.use(Vuex);
console.warn("Use constants for store actions");

export default new Vuex.Store({
    state: {
        isLoading: false,
        isFullLoading: false,
    },
    mutations: {
        startSiteLoading: (state) => {
            state.isLoading = true;
        },
        startFullLoading: (state) => {
            state.isFullLoading = true;
        },
        stopSiteLoading: (state) => {
            state.isLoading = false;
        },
        stopFullLoading: (state) => {
            state.isFullLoading = false;
        }
    },
    getters: {
        isLoading: state => {
            return state.isLoading;
        },
        isFullLoading: state => {
            return state.isFullLoading;
        }
    },
    modules: {
        auth: {
            namespaced: true,
            ...auth
        }
    }
})