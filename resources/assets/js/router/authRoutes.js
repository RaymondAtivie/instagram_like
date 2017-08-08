import Login from '@/pages/auth/screens/loginScreen.vue';
import Register from '@/pages/auth/screens/registerScreen.vue';

import store from './../store/store'
import types from './../store/types'

let confirmAuth = (to, from, next) => {
    if (store.getters[types.auth.NAME + '/' + types.auth.IS_LOGGED_IN]) {
        next({ name: 'dash.home' });
    }
    next();
}

export default [{
        path: '/',
        name: 'auth.login',
        component: Login,
        beforeEnter: confirmAuth
    },
    {
        path: 'register',
        name: 'auth.register',
        component: Register,
        beforeEnter: confirmAuth
    },
]