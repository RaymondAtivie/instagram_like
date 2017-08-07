import store from './../store/store';
import storeTypes from './../store/types';

class Loader {
    start(full = false) {
        store.commit(
            storeTypes.START_LOADING,
            full
        );
    }

    stop() {
        store.commit(storeTypes.STOP_LOADING);
    }
}

export default new Loader();