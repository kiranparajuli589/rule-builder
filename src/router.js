import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';
import Rule from './views/Rule.vue';

Vue.use(Router);

const routes = [
  {
    path: '/',
    component: Home,
  },
  {
    path: "/rule",
    component: Rule
  }
];

export default new Router({
  mode: 'history',
  routes,
});