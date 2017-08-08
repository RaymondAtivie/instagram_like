import Home from '@/pages/dashboard/screens/homeScreen.vue';
import Posts from '@/pages/dashboard/screens/postsScreen.vue';
import Messages from '@/pages/dashboard/screens/messagesScreen.vue';

import p from './../api/posts';

export default [{
        path: '',
        name: 'dash.home',
        component: Home
    },
    {
        path: 'posts',
        name: 'dash.posts',
        component: Posts,
        beforeEnter: (to, from, next) => {
            p.getAll()
                .then(posts => {
                    console.log(posts);
                    console.log("get posts before dash");
                    next();
                })
                .catch(error => {
                    console.log("erroring");
                    console.log(error);
                    next();
                })
        }
    },
    {
        path: 'messages',
        name: 'dash.messages',
        component: Messages
    },
]