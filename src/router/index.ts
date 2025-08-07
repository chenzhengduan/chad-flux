import { RouteRecordRaw } from 'vue-router';

export const baseRoutes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'falAIImageEdit',
    component: () => import('@/pages/falAIImageEdit.vue'),
    meta: { title: 'fal.ai 图像编辑 DEMO' },
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/',
  },
];

// 你项目中可能有 createRouter/useRouter 等逻辑，按需保留基础路由注册部分