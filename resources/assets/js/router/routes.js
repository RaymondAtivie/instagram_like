import App from '@/App.vue';
import Main from '@/pages/indexPage.vue';
import Auth from '@/pages/auth/authPage.vue';
import Dashboard from '@/pages/dashboard/dashboardPage.vue';

import store from '@/store/store';
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

            setTimeout(() => {
                if (!store.getters['auth/isLoggedIn']) {
                    // sb.fire('Hello world this is me', 2000);

                    next();
                    // next({ name: 'auth.login' });
                } else {
                    next();
                }
                loader.stop();

            }, 1000);
            // next();

        }
    },
]