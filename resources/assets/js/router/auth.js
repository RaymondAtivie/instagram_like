import Login from './../pages/auth/login.vue';
import Register from './../pages/auth/register.vue';

export default [{
        path: '/',
        name: 'login',
        component: Login
    },
    {
        path: 'register',
        name: 'register',
        component: Register
    },
]