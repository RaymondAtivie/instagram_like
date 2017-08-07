import Vue from 'vue';
import VueRouter from 'vue-router';
import routes from './routes';

import p from './../api/posts';
import a from './../api/index';


Vue.use(VueRouter);

const router = new VueRouter({
    mode: 'history',
    routes
});

router.beforeEach((to, from, next) => {

    p.getAll()
        .then(posts => {
            console.log(posts);
            console.log("global before each");
            next();
        })
        .catch(error => {
            console.log("erroring");
            console.log(error);
        })

    // next();
});

export default router;