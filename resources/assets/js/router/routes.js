import App from './../App.vue';
import Main from './../pages/index.vue';
import Auth from './../pages/auth/auth.vue';
import Dashboard from './../pages/dahboard/dash.vue';

import dashboadRoutes from './dashboard';
import authRoutes from './auth';

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
        children: dashboadRoutes
    },
]