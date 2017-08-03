import App from './../App.vue';
import Home from './../screens/home.vue';
import Dashboard from './../screens/dashboard.vue';

export default [{
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/dash',
        name: 'dash',
        component: Dashboard
    },
]