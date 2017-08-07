import * as types from './authTypes';
const NAME = types.NAME;

const state = {
    user: {},
    isLoggedIn: true,
}

const mutations = {
    [types.USER_LOGIN]: (state, user) => {
        if (user) {
            state.user = user
        }
        state.isLoggedIn = true;
    },
    [types.USER_LOGOUT]: (state) => {
        state.user = {};
        state.isLoggedIn = false;
    }
}

const actions = {
    [types.USER_LOGIN]: ({ commit }, user) => {
        user ? user : {};
        commit('logIn', user);
    },
    [types.USER_LOGOUT]: ({ commit }) => {
        commit('logOut');
    }
}

const getters = {
    [types.GET_USER]: state => {
        return state.user;
    },
    [types.IS_LOGGED_IN]: state => {
        return state.isLoggedIn;
    }
}

export default {
    state,
    mutations,
    actions,
    getters,
    NAME
}