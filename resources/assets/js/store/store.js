import Vue from 'vue';
import Vuex from 'vuex';
import auth from '@/store/modules/auth/authStore';
import snackbar from '@/store/modules/snackbar/snackbarStore';

Vue.use(Vuex);
console.warn("Use constants for store actions");

export default new Vuex.Store({
    modules: {
        [auth.NAME]: {
            namespaced: true,
            ...auth
        },
        [snackbar.NAME]: {
            namespaced: true,
            ...snackbar
        }
    },
    state: {
        isLoading: false,
        isFullLoading: false,
    },
    mutations: {
        startSiteLoading: (state, payload) => {
            if (payload == 'full') {
                state.isFullLoading = true;
            } else {
                state.isLoading = true;
            }
        },
        stopSiteLoading: (state) => {
            state.isLoading = false;
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
    }
})