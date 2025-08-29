import { QueryClient } from '@tanstack/react-query'

// Create a client with optimized defaults for the job listing app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes
      staleTime: 2 * 60 * 1000,
      // Data is cached for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests twice
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      // Don't refetch on window focus (can be overwhelming for users)
      refetchOnWindowFocus: false,
      // Refetch on reconnect (when user comes back online)
      refetchOnReconnect: true,
      // Error boundary will handle errors
      useErrorBoundary: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Use error boundary for unhandled mutation errors
      useErrorBoundary: false,
    },
  },
})

// Query keys factory for better organization
export const queryKeys = {
  all: ['jobs'],
  lists: () => [...queryKeys.all, 'list'],
  list: (filters) => [...queryKeys.lists(), filters],
  details: () => [...queryKeys.all, 'detail'],
  detail: (id) => [...queryKeys.details(), id],
  stats: () => [...queryKeys.all, 'stats'],
  user: {
    all: ['user'],
    profile: () => [...queryKeys.user.all, 'profile'],
    jobs: () => [...queryKeys.user.all, 'jobs'],
  }
}

// Default query configuration for different types of queries
export const queryConfig = {
  // For data that changes frequently (job listings)
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  },
  // For data that rarely changes (user profile, stats)
  stable: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },
  // For data that changes very rarely (configuration, countries)
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  },
}