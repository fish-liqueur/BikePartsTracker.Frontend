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
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/bikes',
      name: 'bikes',
      component: () => import('@/views/Bikes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/bikes/:id',
      name: 'bike-detail',
      component: () => import('@/views/BikeDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/parts',
      name: 'parts',
      component: () => import('@/views/Parts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/rides',
      name: 'rides',
      component: () => import('@/views/Rides.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/works',
      name: 'works',
      component: () => import('@/views/Works.vue'),
      meta: { requiresAuth: true }
    },    
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/strava/integration',
      name: 'strava integration',
      component: () => import('@/views/StravaIntegration.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      component: () => import('@/views/NotFound.vue')
    }
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect to login if trying to access protected route
    next('/login');
  } else if (to.meta.requiresGuest && isAuthenticated) {
    // Redirect to HOME if trying to access guest-only route while authenticated
    next('/home');
  } else {
    next();
  }
});

export default router
