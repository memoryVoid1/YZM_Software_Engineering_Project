import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './views/LoginView.vue';
import RegisterView from './views/RegisterView.vue';
import CollectionView from './views/CollectionView.vue';
import RankingsView from './views/RankingsView.vue';

const routes = [
  { path: '/', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/collection', component: CollectionView, meta: { requiresAuth: true } },
  { path: '/rankings', component: RankingsView, meta: { requiresAuth: true } }
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
  const loggedIn = !!localStorage.getItem('token');
  if (to.meta.requiresAuth && !loggedIn) next('/');
  else next();
});

export default router;