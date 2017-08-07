import App from '@/App.vue';
import Main from '@/pages/indexPage.vue';
import Auth from '@/pages/auth/authPage.vue';
import Dashboard from '@/pages/dashboard/dashboardPage.vue';

import store from '@/store/store';
import { Snackbar } from './../helpers/snackbar';

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

            // setTimeout(() => {
            //     if (!store.getters['auth/isLoggedIn']) {
            //         let sb = new Snackbar('Hello world', 1000);
            //         sb.fire();

            //         next({ name: 'auth.login' });
            //     } else {
            //         next();
            //     }
            // }, 0);
            next();

        }
    },
]