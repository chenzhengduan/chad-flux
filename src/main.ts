import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHashHistory} from 'vue-router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'

// 创建一个简单的路由
const router = createRouter({
  history: createWebHashHistory('/'),
  routes: [
    {
      path: '/',
      component: () => import('./pages/falAIImageEdit.vue')
    },
  ]
});

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount('#app');
