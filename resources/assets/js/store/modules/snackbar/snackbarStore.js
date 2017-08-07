import * as types from "./snackbarTypes";
const NAME = types.NAME;

const state = {
    message: {
        text: '',
        show: false,
        position: {
            y: 'top',
            x: false,
        },
        label: false,
        time: 6000,
        callback: false,
        callback_label: 'CLOSE',
        close: true,
    }
}

const mutations = {
    [types.LOAD_SNACKBAR]: (state, payload) => {
        state.message.show = true;
        state.message.text = payload.text;

        if (payload.label)
            state.message.label = payload.label;

        if (payload.position.y)
            state.message.position.y = payload.position.y;

        if (payload.position.x)
            state.message.position.x = payload.position.x;

        if (payload.time)
            state.message.time = payload.time;

        if (payload.callback)
            state.message.callback = payload.callback;

        if (payload.callback_label)
            state.message.callback_label = payload.callback_label;

        if (payload.hasOwnProperty('close')) {
            if (payload.close !== null) {
                state.message.close = payload.close;
            }
        }
    },
    [types.CLEAR_SNACKBAR]: (state) => {
        state.message.show = false;
        state.message.text = '';
        state.message.label = false;
        state.message.time = 6000;
        state.message.callback = false;
        state.message.callback_label = 'CLOSE';
        state.message.close = true;
        setTimeout(() => {
            state.message.position.y = 'top';
            state.message.position.x = false;
        }, 500);
    }
}

const actions = {

}

const getters = {
    [types.GET_MESSAGE]: state => {
        return state.message;
    },
    [types.GET_MESSAGE_VISIBILITY]: state => {
        return state.message.show;
    }
}

export default {
    state,
    mutations,
    actions,
    getters,
    NAME
}