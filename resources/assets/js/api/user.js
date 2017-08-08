import api from './index';
import s from './../helpers/snackbar';
import l from './../helpers/loader';
import store from './../store/store';
import types from './../store/types';

class User {

    constructor() {
        this.model = 'users';
        this.user = null;
        // this.last_fetch = moment();
    }

    attempt(email, password) {
        let data = {
            email,
            password
        }

        return new Promise((resolve, reject) => {
            l.start();

            api.post('login', data)
                .then(res => {
                    if (res.status) {
                        s.fire(res.message);
                        store.commit(types.auth.NAME + '/' + types.auth.USER_LOGIN, res.data);
                        l.stop();
                        this.user = res.data;
                        resolve(res.data);
                    }
                })
                .catch((error) => {
                    if (error) {
                        s.fire(error.data.message, 'warning');
                    } else {
                        s.fire("something went wrong", 'error');
                    }

                    reject(res);
                    l.stop();
                })
        })
    }

}

export default new User();