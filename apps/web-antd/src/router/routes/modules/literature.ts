import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:airplay',
      order: 3,
      title: '文献',
    },
    name: 'Literature',
    path: '/literature',
    component: () => import('#/views/literature/index.vue'),
  },
];

export default routes;
