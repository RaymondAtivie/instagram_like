import App from '@/App.vue';
import Main from '@/pages/indexPage.vue';
import Auth from '@/pages/auth/authPage.vue';
import Dashboard from '@/pages/dashboard/dashboardPage.vue';

import store from '@/store/store';

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

            // setTimeout(()=>{
            //     if (!store.getters['auth/isLoggedIn']) {
            //         store.commit('giveMessage', {message: "You need to be logged in to view this route"});

            //         next({ name: 'auth.login' });
            //     } else {
            //         next();
            //     }               
            // }, 1000);
            next();

        }
    },
]