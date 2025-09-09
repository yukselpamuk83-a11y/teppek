import { useState, useEffect, useRef } from 'react'
import logger from '../utils/logger.js'

// Simple in-memory cache
const memoryCache = new Map()

export function useDataCache(key, fetchFunction, options = {}) {
  const {
    memoryTTL = 300000, // 5 minutes default
    staleWhileRevalidate = true
  } = options

  const [data, setData] = useState(() => {
    // Check memory cache first
    const cached = memoryCache.get(key)
    if (cached && Date.now() - cached.timestamp < memoryTTL) {
      return cached.data
    }
    return null
  })
  
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState(null)
  const fetchInProgress = useRef(false)

  useEffect(() => {
    const loadData = async () => {
      // Check if already fetching
      if (fetchInProgress.current) return
      
      // Check memory cache
      const cached = memoryCache.get(key)
      const now = Date.now()
      
      if (cached) {
        const age = now - cached.timestamp
        
        // If data is fresh, use it
        if (age < memoryTTL) {
          if (!data) {
            setData(cached.data)
            setLoading(false)
          }
          return
        }
        
        // If stale while revalidate, show stale data while fetching
        if (staleWhileRevalidate && !data) {
          setData(cached.data)
          setLoading(false)
        }
      }
      
      // Fetch new data
      try {
        fetchInProgress.current = true
        setLoading(true)
        setError(null)
        
        const newData = await fetchFunction()
        
        // Update memory cache
        memoryCache.set(key, {
          data: newData,
          timestamp: now
        })
        
        setData(newData)
      } catch (err) {
        logger.error('Cache fetch error:', err)
        setError(err)
      } finally {
        setLoading(false)
        fetchInProgress.current = false
      }
    }
    
    loadData()
  }, [key]) // Only re-run when key changes
  
  return { data, loading, error }
}