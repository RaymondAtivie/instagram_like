import App from './../App.vue';
import Main from './../pages/indexPage.vue';
import Auth from './../pages/auth/authPage.vue';
import Dashboard from './../pages/dashboard/dashboardPage.vue';

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
        children: authRoutes
    },
    {
        path: '/dash',
        component: Dashboard,
        children: dashboadRoutes,
        beforeEnter: (to, from, next) => {
            console.warn("Dont forget to add before enter dash logic");
            next();
        }
    },
]