// DENEYSEL PROJE - Simple Router for Auth Callbacks
export const getCurrentRoute = () => {
  const path = window.location.pathname
  const hash = window.location.hash
  
  return {
    path,
    hash,
    isAuthCallback: path === '/auth/callback' || path.includes('/auth/callback'),
    isProfile: path === '/profile' || path.includes('/profile'),
    isHome: path === '/' || path === ''
  }
}

export const navigateTo = (path) => {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export const useRouter = () => {
  const route = getCurrentRoute()
  
  return {
    currentRoute: route,
    navigateTo,
    isAuthCallback: route.isAuthCallback,
    isProfile: route.isProfile,
    isHome: route.isHome
  }
}