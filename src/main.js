import Vue from 'vue';
import App from './App.vue';
import router from './router';
import "./assets/main.scss"

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');