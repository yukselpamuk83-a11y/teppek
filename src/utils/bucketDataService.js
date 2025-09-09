// BUCKET-FIRST DATA SERVICE
// Priority: Supabase Storage (bucket) → Database fallback
import { supabase } from '../lib/supabase.js'
import logger from './logger.js'

class BucketDataService {
  constructor() {
    this.cache = new Map()
    this.bucketUrl = null
    this.initializeBucketUrl()
  }

  async initializeBucketUrl() {
    try {
      this.bucketUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/public-assets`
      logger.debug('Bucket URL initialized:', this.bucketUrl)
    } catch (error) {
      logger.error('Failed to initialize bucket URL:', error)
    }
  }

  /**
   * Fetch data from bucket (GeoJSON) first, fallback to database
   */
  async fetchItemData(itemId, forceRefresh = false) {
    const cacheKey = `item_${itemId}`
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && this.cache.has(cacheKey)) {
      logger.debug('Returning cached data for item:', itemId)
      return this.cache.get(cacheKey)
    }

    try {
      // Step 1: Try to get data from bucket (map-data.geojson)
      const bucketData = await this.fetchFromBucket(itemId)
      if (bucketData) {
        logger.debug('Found complete data in bucket for item:', itemId)
        this.cache.set(cacheKey, bucketData)
        return bucketData
      }

      // Step 2: Fallback to database
      logger.debug('Bucket data incomplete, fetching from database for item:', itemId)
      const dbData = await this.fetchFromDatabase(itemId)
      if (dbData) {
        this.cache.set(cacheKey, dbData)
        return dbData
      }

      // Step 3: Return null if neither source has data
      logger.warn('No data found for item:', itemId)
      return null

    } catch (error) {
      logger.error('Error in fetchItemData:', error)
      return null
    }
  }

  /**
   * Fetch item data from Supabase Storage bucket
   */
  async fetchFromBucket(itemId) {
    try {
      if (!this.bucketUrl) {
        await this.initializeBucketUrl()
      }

      // Cache busting kaldırıldı - performans için
      // const cacheBuster = Date.now() // PERFORMANS OPTIMIZASYONU
      const response = await fetch(`${this.bucketUrl}/map-data.geojson`)
      
      if (!response.ok) {
        logger.warn('Failed to fetch bucket data:', response.status, response.statusText)
        return null
      }

      const geoJsonData = await response.json()
      
      if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
        logger.warn('Invalid GeoJSON structure from bucket')
        return null
      }

      // Find the specific item
      const feature = geoJsonData.features.find(f => 
        f.properties.id === itemId || 
        f.properties.id === String(itemId) ||
        f.properties.id === parseInt(itemId)
      )

      if (!feature) {
        logger.debug('Item not found in bucket:', itemId)
        return null
      }

      // Transform GeoJSON feature to our data structure
      const itemData = {
        id: feature.properties.id,
        type: feature.properties.type,
        title: feature.properties.title,
        company: feature.properties.company || feature.properties.user,
        name: feature.properties.name || feature.properties.user,
        city: feature.properties.city,
        country: feature.properties.country,
        location: {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0]
        },
        salary_min: feature.properties.salary_min,
        salary_max: feature.properties.salary_max,
        currency: feature.properties.currency,
        url: feature.properties.applyUrl || feature.properties.url,
        contact: feature.properties.contact,
        source: feature.properties.source || 'bucket',
        skills: feature.properties.skills,
        experience_years: feature.properties.experience_years,
        remote: feature.properties.remote,
        full_name: feature.properties.full_name || feature.properties.name,
        description: feature.properties.description,
        popup_html: feature.properties.popup_html,
        // Keep original bucket data
        _bucketData: feature.properties
      }

      // Check if data is complete
      const isComplete = this.isDataComplete(itemData)
      if (!isComplete) {
        logger.debug('Bucket data incomplete for item:', itemId)
        return null
      }

      logger.debug('Successfully fetched complete data from bucket for:', itemId)
      return itemData

    } catch (error) {
      logger.error('Error fetching from bucket:', error)
      return null
    }
  }

  /**
   * Fetch item data from database as fallback
   */
  async fetchFromDatabase(itemId) {
    try {
      // Try different table names based on item type
      const tables = ['jobs', 'listings', 'items']
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('id', itemId)
            .single()

          if (error) {
            logger.debug(`Item not found in table ${table}:`, error.message)
            continue
          }

          if (data) {
            logger.debug(`Found data in table ${table} for item:`, itemId)
            
            // Transform database data to our structure
            const itemData = {
              ...data,
              location: {
                lat: data.lat || data.latitude,
                lng: data.lng || data.longitude || data.lon
              },
              source: data.source || 'database'
            }

            return itemData
          }
        } catch (tableError) {
          logger.debug(`Error accessing table ${table}:`, tableError.message)
          continue
        }
      }

      logger.warn('Item not found in any database table:', itemId)
      return null

    } catch (error) {
      logger.error('Error fetching from database:', error)
      return null
    }
  }

  /**
   * Check if item data is complete enough for popup display
   */
  isDataComplete(itemData) {
    // Required fields for popup display
    const requiredFields = ['id', 'title']
    const hasRequired = requiredFields.every(field => itemData[field])
    
    // At least one contact method (url or contact info)
    const hasContact = itemData.url || itemData.contact || itemData.company
    
    // Location information
    const hasLocation = itemData.city || (itemData.location && itemData.location.lat)

    return hasRequired && (hasContact || hasLocation)
  }

  /**
   * Batch fetch multiple items efficiently
   */
  async fetchMultipleItems(itemIds, forceRefresh = false) {
    const results = {}
    const uncachedIds = forceRefresh ? itemIds : itemIds.filter(id => !this.cache.has(`item_${id}`))
    
    if (uncachedIds.length === 0) {
      // All items are cached
      itemIds.forEach(id => {
        results[id] = this.cache.get(`item_${id}`)
      })
      return results
    }

    try {
      // Batch fetch from bucket first
      const bucketData = await this.fetchMultipleFromBucket(uncachedIds)
      
      // Identify items still missing data
      const missingIds = uncachedIds.filter(id => !bucketData[id])
      
      // Fetch missing items from database
      let dbData = {}
      if (missingIds.length > 0) {
        dbData = await this.fetchMultipleFromDatabase(missingIds)
      }

      // Combine results and cache
      const allData = { ...bucketData, ...dbData }
      Object.entries(allData).forEach(([id, data]) => {
        if (data) {
          this.cache.set(`item_${id}`, data)
          results[id] = data
        }
      })

      // Add cached items
      const cachedIds = itemIds.filter(id => this.cache.has(`item_${id}`) && !results[id])
      cachedIds.forEach(id => {
        results[id] = this.cache.get(`item_${id}`)
      })

      return results

    } catch (error) {
      logger.error('Error in batch fetch:', error)
      return {}
    }
  }

  async fetchMultipleFromBucket(itemIds) {
    try {
      // Cache busting kaldırıldı - performans için
      // const cacheBuster = Date.now() // PERFORMANS OPTIMIZASYONU
      const response = await fetch(`${this.bucketUrl}/map-data.geojson`)
      if (!response.ok) return {}

      const geoJsonData = await response.json()
      if (!geoJsonData.features) return {}

      const results = {}
      
      geoJsonData.features.forEach(feature => {
        const id = feature.properties.id
        if (itemIds.includes(id) || itemIds.includes(String(id)) || itemIds.includes(parseInt(id))) {
          const itemData = this.transformGeoJsonFeature(feature)
          if (this.isDataComplete(itemData)) {
            results[id] = itemData
          }
        }
      })

      return results
    } catch (error) {
      logger.error('Error in batch bucket fetch:', error)
      return {}
    }
  }

  async fetchMultipleFromDatabase(itemIds) {
    try {
      const { data, error } = await supabase
        .from('jobs') // Try primary table first
        .select('*')
        .in('id', itemIds)

      if (error) {
        logger.warn('Database batch fetch error:', error.message)
        return {}
      }

      const results = {}
      if (data) {
        data.forEach(item => {
          results[item.id] = {
            ...item,
            location: {
              lat: item.lat || item.latitude,
              lng: item.lng || item.longitude || item.lon
            },
            source: item.source || 'database'
          }
        })
      }

      return results
    } catch (error) {
      logger.error('Error in database batch fetch:', error)
      return {}
    }
  }

  transformGeoJsonFeature(feature) {
    return {
      id: feature.properties.id,
      type: feature.properties.type,
      title: feature.properties.title,
      company: feature.properties.company || feature.properties.user,
      name: feature.properties.name || feature.properties.user,
      city: feature.properties.city,
      country: feature.properties.country,
      location: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      },
      salary_min: feature.properties.salary_min,
      salary_max: feature.properties.salary_max,
      currency: feature.properties.currency,
      url: feature.properties.applyUrl || feature.properties.url,
      contact: feature.properties.contact,
      source: feature.properties.source || 'bucket',
      skills: feature.properties.skills,
      experience_years: feature.properties.experience_years,
      remote: feature.properties.remote,
      full_name: feature.properties.full_name || feature.properties.name,
      description: feature.properties.description,
      _bucketData: feature.properties
    }
  }

  /**
   * Clear cache (useful for debugging or memory management)
   */
  clearCache() {
    this.cache.clear()
    logger.debug('Bucket data cache cleared')
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const bucketDataService = new BucketDataService()
export default bucketDataService