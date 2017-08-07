import store from './../store/store';
import storeTypes from './../store/types';

export class Snackbar {
    constructor(full = null) {

    }

    _setup(message, time, label, position, close, callback, callback_label) {

    }

    fire() {
        store.commit(
            storeTypes.NAME + '/' + storeTypes.snackbar.LOAD_SNACKBAR,
            this.config
        );
    }
}