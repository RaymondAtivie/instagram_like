import App from '@/App.vue';
import Main from '@/pages/indexPage.vue';
import Auth from '@/pages/auth/authPage.vue';
import Dashboard from '@/pages/dashboard/dashboardPage.vue';

import store from '@/store/store';
import storeTypes from '@/store/types';
import sb from './../helpers/snackbar';
import loader from './../helpers/loader';

import dashboadRoutes from './dashboardRoutes';
import authRoutes from './authRoutes';

export default [{
        path: '/',
        name: 'index',
        component: Main
    },
    {
        path: '/auth',
        component: Auth,
        children: authRoutes,
        beforeEnter: (to, from, next) => {
            next();
        }
    },
    {
        path: '/dash',
        component: Dashboard,
        children: dashboadRoutes,
        beforeEnter: (to, from, next) => {
            loader.start('full');

            if (!store.getters[storeTypes.auth.NAME + '/' + storeTypes.auth.IS_LOGGED_IN]) {
                sb.fire('You must be logged in to view that page');
                next({ name: 'auth.login' });
            } else {
                next();
            }
            loader.stop();
        }
    },
]