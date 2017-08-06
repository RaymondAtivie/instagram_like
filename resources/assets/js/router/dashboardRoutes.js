import Home from '@/pages/dashboard/screens/homeScreen.vue';
import Posts from '@/pages/dashboard/screens/postsScreen.vue';

export default [{
        path: '',
        name: 'dash.home',
        component: Home
    },
    {
        path: 'posts',
        name: 'dash.posts',
        component: Posts
    },
]