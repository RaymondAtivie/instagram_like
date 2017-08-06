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
        giveMessage: (state, payload) => {
            state.message.show = true;
            state.message.text = payload.message;

            if (payload.label)
                state.message.label = payload.label;

            if (payload.y)
                state.message.position.y = payload.y;

            if (payload.x)
                state.message.position.x = payload.x;

            if (payload.time)
                state.message.time = payload.time;

            if (payload.callback)
                state.message.callback = payload.callback;

            if (payload.callback_label)
                state.message.callback_label = payload.callback_label;

            if(payload.hasOwnProperty('close'))
                state.message.close = payload.close;

            console.log(payload)

        },
        clearMessage: (state) => {
            state.message.show = false;
            state.message.text = '';
            state.message.label = false;
            state.message.position.y = 'top';
            state.message.position.x = false;
            state.message.time = 6000;
            state.message.callback = false;
            state.message.callback_label = 'CLOSE';
            state.message.close = true;
        }
}

const actions = {
    
}

const getters = {
        message: state => {
            return state.message;
        },
        showMessage: state => {
            return state.message.show;
        }
}

export default {
    state,
    mutations,
    actions,
    getters,
}