const state = {
    posts: {},
    isLoggedIn: true,
}

const mutations = {
    logIn: (state, user) => {
        if (user) {
            state.user = user
        }
        state.isLoggedIn = true;
    },
    logOut: (state) => {
        state.user = {};
        state.isLoggedIn = false;
    }
}

const actions = {
    login: ({ commit }, user) => {
        user ? user : {};
        commit('logIn', user);
    },
    logout: ({ commit }) => {
        commit('logOut');
    },
}

const getters = {
    user: state => {
        return state.user;
    },
    isLoggedIn: state => {
        return state.isLoggedIn;
    }
}

export default {
    state,
    mutations,
    actions,
    getters,
}