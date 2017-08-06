import Login from '@/pages/auth/screens/loginScreen.vue';
import Register from '@/pages/auth/screens/registerScreen.vue';

export default [{
        path: '/',
        name: 'auth.login',
        component: Login
    },
    {
        path: 'register',
        name: 'auth.register',
        component: Register
    },
]