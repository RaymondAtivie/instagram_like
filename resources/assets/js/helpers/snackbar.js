import store from './../store/store';
import storeTypes from './../store/types';

class Snackbar {
    constructor() {
        this.config = null;
    }

    _setup(message, time, label, position, close, callback, callback_label) {
        let config = {
            text: message,
            position: {}
        };
        config.time = time || null;
        config.label = label || null;
        config.close = close;
        config.callback = callback || null;
        config.callback_label = callback_label || null;

        if (position.includes('top')) {
            config.position.y = 'top';
        } else if (position.includes('bottom')) {
            config.position.y = 'bottom';
        }

        if (position.includes('right')) {
            config.position.x = 'right';
        } else if (position.includes('left')) {
            config.position.x = 'left';
        }

        return config;
    }

    fire(message, label = null, time = null, position = 'top', close = null, callback = null, callback_label = null) {
        position = position || 'top';

        this.config = this._setup(message, time, label, position, close, callback, callback_label);
        this.show();
    }

    show() {
        store.commit(storeTypes.snackbar.NAME + '/' + storeTypes.snackbar.CLEAR_SNACKBAR);
        setTimeout(() => {

            store.commit(
                storeTypes.snackbar.NAME + '/' + storeTypes.snackbar.LOAD_SNACKBAR,
                this.config
            );
        }, 500)
    }
}

export default new Snackbar();