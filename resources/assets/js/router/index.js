import VueRouter from 'vue-router'
import routes from './routes';

console.log(routes);

export default new VueRouter({
    mode: 'history',
    routes
})