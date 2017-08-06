import Vue from 'vue';
import Vuex from 'vuex';
import auth from '@/store/modules/authStore';
import messages from '@/store/modules/siteMessagesStore';

Vue.use(Vuex);
console.warn("Use constants for store actions");

export default new Vuex.Store({
    modules: {
        auth: {
            namespaced: true,
            ...auth
        },
        messages: {
            namespaced: true,
            ...messages
        }
    },
    state: {
        isLoading: false,
        isFullLoading: false,
    },
    mutations: {
        startSiteLoading: (state, payload) => {
            if(payload == 'full'){
                state.isFullLoading = true;
            }else{
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