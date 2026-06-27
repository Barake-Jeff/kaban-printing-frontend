export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return navigateTo('/auth')
  if (to.meta.role === 'admin' && !auth.isAdmin) return navigateTo('/app')
  if (to.path === '/auth' && auth.isLoggedIn)
    return navigateTo(auth.isAdmin ? '/admin' : '/app')
})
