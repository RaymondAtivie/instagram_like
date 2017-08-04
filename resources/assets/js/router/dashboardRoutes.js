import Home from './../pages/dashboard/screens/homeScreen.vue';
import Dashboard from './../pages/dashboard/screens/dashboardScreen.vue';

export default [{
        path: '',
        name: 'dash.home',
        component: Home
    },
    {
        path: 'dash',
        name: 'dash.dash',
        component: Dashboard
    },
]