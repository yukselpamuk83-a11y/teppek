import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryConfig } from '../lib/queryClient'

/**
 * Hook for fetching job listings with filters
 */
export function useJobs(filters = {}) {
  return useQuery({
    queryKey: queryKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
      
      const response = await fetch(`/api/get-jobs?${params}`)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }
      
      return response.json()
    },
    ...queryConfig.realtime,
    select: (data) => ({
      jobs: data.jobs || [],
      stats: data.stats || {},
      filters: data.filters || {},
      total: data.stats?.total_jobs || 0
    }),
    // Enable this query by default
    enabled: true,
    // Keep previous data while fetching new data (better UX)
    keepPreviousData: true,
  })
}

/**
 * Hook for creating a new job listing
 */
export function useCreateJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (jobData) => {
      const response = await fetch('/api/create-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token')}`
        },
        body: JSON.stringify(jobData),
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch job lists
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      
      // Optionally update the cache directly for better UX
      queryClient.setQueryData(queryKeys.list({}), (oldData) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          jobs: [data.job, ...oldData.jobs],
          stats: {
            ...oldData.stats,
            total_jobs: (oldData.stats?.total_jobs || 0) + 1
          }
        }
      })
    },
    onError: (error) => {
      console.error('Failed to create job:', error)
    }
  })
}

/**
 * Hook for updating a job listing
 */
export function useUpdateJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...jobData }) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token')}`
        },
        body: JSON.stringify(jobData),
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Update the specific job in the cache
      queryClient.setQueryData(queryKeys.detail(variables.id), data.job)
      
      // Invalidate job lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
    }
  })
}

/**
 * Hook for deleting a job listing
 */
export function useDeleteJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (jobId) => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token')}`
        },
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (data, jobId) => {
      // Remove the job from all relevant caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          
          return {
            ...oldData,
            jobs: oldData.jobs.filter(job => job.id !== jobId),
            stats: {
              ...oldData.stats,
              total_jobs: Math.max(0, (oldData.stats?.total_jobs || 1) - 1)
            }
          }
        }
      )
      
      // Remove the specific job detail from cache
      queryClient.removeQueries({ queryKey: queryKeys.detail(jobId) })
    }
  })
}

/**
 * Hook for fetching job statistics
 */
export function useJobStats() {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/job-stats')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return response.json()
    },
    ...queryConfig.stable,
    select: (data) => data.stats || {}
  })
}

/**
 * Hook for fetching user's own job listings
 */
export function useUserJobs() {
  return useQuery({
    queryKey: queryKeys.user.jobs(),
    queryFn: async () => {
      const response = await fetch('/api/user/jobs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return response.json()
    },
    ...queryConfig.realtime,
    select: (data) => data.jobs || []
  })
}

/**
 * Hook for prefetching job data (useful for performance optimization)
 */
export function usePrefetchJobs() {
  const queryClient = useQueryClient()
  
  return {
    prefetchJobs: (filters = {}) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.list(filters),
        queryFn: async () => {
          const params = new URLSearchParams()
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value))
          })
          
          const response = await fetch(`/api/get-jobs?${params}`)
          return response.json()
        },
        ...queryConfig.realtime
      })
    }
  }
}

/**
 * Hook for managing optimistic updates
 */
export function useOptimisticJobs() {
  const queryClient = useQueryClient()
  
  const addOptimisticJob = (tempJob) => {
    queryClient.setQueryData(queryKeys.list({}), (oldData) => {
      if (!oldData) return oldData
      
      return {
        ...oldData,
        jobs: [{ ...tempJob, id: `temp-${Date.now()}`, isOptimistic: true }, ...oldData.jobs]
      }
    })
  }
  
  const removeOptimisticJob = (tempId) => {
    queryClient.setQueryData(queryKeys.list({}), (oldData) => {
      if (!oldData) return oldData
      
      return {
        ...oldData,
        jobs: oldData.jobs.filter(job => job.id !== tempId)
      }
    })
  }
  
  return {
    addOptimisticJob,
    removeOptimisticJob
  }
}