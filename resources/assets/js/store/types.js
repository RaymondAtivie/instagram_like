import * as auth from './modules/auth/authTypes';
import * as snackbar from './modules/snackbar/snackbarTypes';

const t = {
    START_LOADING: "START_LOADING",
    STOP_LOADING: "STOP_LOADING",

    // getters
    IS_LOADING: "IS_LOADING",
    IS_FULL_LOADING: "IS_FULL_LOADING"
}

export default {
    auth,
    snackbar,
    ...t
}