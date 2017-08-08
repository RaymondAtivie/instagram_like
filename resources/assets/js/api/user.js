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
                        this.user = res.data;
                        store.commit(types.auth.NAME + '/' + types.auth.USER_LOGIN, res.data);
                        l.stop();

                        resolve(res);
                    }
                })
                .catch((error) => {
                    if (error) {
                        s.fire(error.data.message, 'warning');
                    } else {
                        s.fire("something went wrong", 'error');
                    }

                    l.stop();
                    reject(error);
                })
        })
    }

    signUp(user) {
        let data = {
            name: user.name,
            image: user.image,
            title: user.title,
            email: user.email,
            password: user.password,
        }

        console.log(data);
        // return;

        return new Promise((resolve, reject) => {

            api.post('register', data)
                .then(res => {
                    if (res.status) {
                        this.user = res.data;
                        // store.commit(types.auth.NAME + '/' + types.auth.USER_LOGIN, res.data);
                        l.stop();

                        resolve(res);
                    }
                })
                .catch((error) => {
                    if (error) {
                        s.fire(error.data.message, 'warning');
                    } else {
                        s.fire("something went wrong", 'error');
                    }

                    l.stop();
                    reject(error);
                })

        })
    }

}

export default new User();