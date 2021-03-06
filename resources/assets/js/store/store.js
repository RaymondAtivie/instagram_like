import Vue from 'vue';
import Vuex from 'vuex';

import auth from '@/store/modules/auth/authStore';
import snackbar from '@/store/modules/snackbar/snackbarStore';
import post from '@/store/modules/post/postStore';

import types from './types';

Vue.use(Vuex);

export default new Vuex.Store({
    // strict: true,
    modules: {
        [auth.NAME]: {
            namespaced: true,
            ...auth
        },
        [snackbar.NAME]: {
            namespaced: true,
            ...snackbar
        },
        [post.NAME]: {
            namespaced: true,
            ...post
        }
    },
    state: {
        isLoading: false,
        isFullLoading: false,
    },
    mutations: {
        [types.START_LOADING]: (state, payload) => {
            if (payload == 'full') {
                state.isFullLoading = true;
            } else {
                state.isLoading = true;
            }
        },
        [types.STOP_LOADING]: (state) => {
            state.isLoading = false;
            state.isFullLoading = false;
        }
    },
    getters: {
        [types.IS_LOADING]: state => {
            return state.isLoading;
        },
        [types.IS_FULL_LOADING]: state => {
            return state.isFullLoading;
        }
    }
})