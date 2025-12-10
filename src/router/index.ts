import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    // {
    //   path: '/bikes/:id',
    //   name: 'bike-detail',
    //   component: () => import('../views/BikeDetailView.vue'), // We'll create this later
    //   meta: { requiresAuth: true }
    // },
    // {
    //   path: '/bikes/:id/edit',
    //   name: 'bike-edit',
    //   component: () => import('../views/BikeEditView.vue'), // We'll create this later
    //   meta: { requiresAuth: true }
    // }
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect to login if trying to access protected route
    next('/login');
  } else if (to.meta.requiresGuest && isAuthenticated) {
    // Redirect to dashboard if trying to access guest-only route while authenticated
    next('/dashboard');
  } else {
    next();
  }
});

export default router
