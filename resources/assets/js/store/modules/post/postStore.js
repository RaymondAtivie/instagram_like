import * as types from './postTypes';
const NAME = types.NAME;

const state = {
    posts: [],
}

const mutations = {
    [types.ADD_NEW_POST]: (state, post) => {
        state.posts.unshift(post);
    },
    [types.REPLACE_POSTS]: (state, posts) => {
        state.posts = posts;
    }
}

const actions = {
    // [types.USER_LOGIN]: ({ commit }, user) => {
    //     user ? user : {};
    //     commit(types.USER_LOGIN, user);
    // },
    // [types.USER_LOGOUT]: ({ commit }) => {
    //     commit(types.USER_LOGIN);
    // }
}

const getters = {
    [types.GET_POSTS]: state => {
        return state.posts;
    }
}

export default {
    state,
    mutations,
    actions,
    getters,
    NAME
}