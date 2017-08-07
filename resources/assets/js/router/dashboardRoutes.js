import Home from '@/pages/dashboard/screens/homeScreen.vue';
import Posts from '@/pages/dashboard/screens/postsScreen.vue';
import Messages from '@/pages/dashboard/screens/messagesScreen.vue';

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
    {
        path: 'messages',
        name: 'dash.messages',
        component: Messages
    },
]