import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getDistance } from '../utils/distance'

// OPTIMIZED VERSION - Only listens to INSERT events, not UPDATE/DELETE
// Fetches only last 24 hours of data to reduce load
export function useRealtimeData(userLocation) {
  const [realtimeData, setRealtimeData] = useState([])
  const channelsRef = useRef(null)

  useEffect(() => {
    if (!userLocation) return

    // Initial data fetch - ONLY last 24 hours manual entries
    const fetchManualEntries = async () => {
      try {
        // Calculate 24 hours ago
        const yesterday = new Date()
        yesterday.setHours(yesterday.getHours() - 24)
        const yesterdayISO = yesterday.toISOString()

        // Jobs - only manual entries from last 24h
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('id, title, company, lat, lon, city, country, salary_min, salary_max, currency, contact, created_at')
          .eq('source', 'manual')
          .gte('created_at', yesterdayISO)
          .order('created_at', { ascending: false })
          .limit(100)

        if (jobsError) throw jobsError

        // CVs - devre dışı (tablo yok)
        const cvs = []
        // const { data: cvs, error: cvsError } = await supabase
        //   .from('cvs')
        //   .select('id, title, full_name, lat, lon, city, country, salary_expectation_min, salary_expectation_max, contact, skills, experience_years, remote_available, created_at')
        //   .gte('created_at', yesterdayISO)
        //   .order('created_at', { ascending: false })
        //   .limit(100)

        // if (cvsError) throw cvsError

        // Format data for map
        const formattedJobs = (jobs || []).map(job => ({
          id: `manual-job-${job.id}`,
          type: 'job',
          title: job.title,
          company: job.company,
          location: {
            lat: parseFloat(job.lat),
            lng: parseFloat(job.lon)
          },
          address: `${job.city || ''}, ${job.country || ''}`.replace(/^,\\s*|,\\s*$/g, ''),
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          currency: job.currency,
          contact: job.contact,
          source: 'manual',
          postedDate: job.created_at,
          distance: getDistance(
            userLocation.lat, 
            userLocation.lng, 
            parseFloat(job.lat), 
            parseFloat(job.lon)
          )
        }))

        const formattedCvs = (cvs || []).map(cv => ({
          id: `manual-cv-${cv.id}`,
          type: 'cv',
          title: cv.title,
          company: cv.full_name,
          name: cv.full_name,
          location: {
            lat: parseFloat(cv.lat),
            lng: parseFloat(cv.lon)
          },
          address: `${cv.city || ''}, ${cv.country || ''}`.replace(/^,\\s*|,\\s*$/g, ''),
          salary_min: cv.salary_expectation_min,
          salary_max: cv.salary_expectation_max,
          currency: 'TRY',
          contact: cv.contact,
          skills: cv.skills,
          experience_years: cv.experience_years,
          remote: cv.remote_available,
          source: 'manual',
          postedDate: cv.created_at,
          distance: getDistance(
            userLocation.lat, 
            userLocation.lng, 
            parseFloat(cv.lat), 
            parseFloat(cv.lon)
          )
        }))

        setRealtimeData([...formattedJobs, ...formattedCvs])
        console.log('✅ Manual entries loaded:', formattedJobs.length + formattedCvs.length)

      } catch (error) {
        console.error('Manual entries fetch error:', error)
      }
    }

    fetchManualEntries()

    // OPTIMIZED Realtime - ONLY listen to INSERT events
    const jobsChannel = supabase
      .channel('new-manual-jobs-only')
      .on('postgres_changes', 
        { 
          event: 'INSERT', // ONLY new entries
          schema: 'public', 
          table: 'jobs',
          filter: 'source=eq.manual'
        }, 
        (payload) => {
          console.log('🔄 Job realtime update:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newJob = {
              id: `manual-job-${payload.new.id}`,
              type: 'job',
              title: payload.new.title,
              company: payload.new.company,
              location: {
                lat: parseFloat(payload.new.lat),
                lng: parseFloat(payload.new.lon)
              },
              address: `${payload.new.city || ''}, ${payload.new.country || ''}`.replace(/^,\\s*|,\\s*$/g, ''),
              salary_min: payload.new.salary_min,
              salary_max: payload.new.salary_max,
              currency: payload.new.currency,
              contact: payload.new.contact,
              source: 'manual',
              postedDate: payload.new.created_at,
              distance: getDistance(
                userLocation.lat, 
                userLocation.lng, 
                parseFloat(payload.new.lat), 
                parseFloat(payload.new.lon)
              )
            }
            
            setRealtimeData(prev => [newJob, ...prev])
          }
          
          // Skip UPDATE and DELETE events to reduce load
          // Only handle INSERT above
        }
      )
      .subscribe()

    // CVs channel - devre dışı (tablo yok)
    // const cvsChannel = supabase
    //   .channel('new-cvs-only')
    //   .on('postgres_changes', 
    //     { 
    //       event: 'INSERT', // ONLY new entries
    //       schema: 'public', 
    //       table: 'cvs'
    //     }, 
    //     (payload) => {
    //       console.log('🔄 CV realtime update:', payload)
    //       
    //       if (payload.eventType === 'INSERT') {
    //         const newCv = {
    //           id: `manual-cv-${payload.new.id}`,
    //           type: 'cv',
    //           title: payload.new.title,
    //           company: payload.new.full_name,
    //           name: payload.new.full_name,
    //           location: {
    //             lat: parseFloat(payload.new.lat),
    //             lng: parseFloat(payload.new.lon)
    //           },
    //           address: `${payload.new.city || ''}, ${payload.new.country || ''}`.replace(/^,\\s*|,\\s*$/g, ''),
    //           salary_min: payload.new.salary_expectation_min,
    //           salary_max: payload.new.salary_expectation_max,
    //           currency: 'TRY',
    //           contact: payload.new.contact,
    //           skills: payload.new.skills,
    //           experience_years: payload.new.experience_years,
    //           remote: payload.new.remote_available,
    //           source: 'manual',
    //           postedDate: payload.new.created_at,
    //           distance: getDistance(
    //             userLocation.lat, 
    //             userLocation.lng, 
    //             parseFloat(payload.new.lat), 
    //             parseFloat(payload.new.lon)
    //           )
    //         }
    //         
    //         setRealtimeData(prev => [newCv, ...prev])
    //       }
    //       
    //       // Skip UPDATE and DELETE events to reduce load
    //       // Only handle INSERT above
    //     }
    //   )
    //   .subscribe()

    // Cleanup
    return () => {
      jobsChannel.unsubscribe()
      // cvsChannel.unsubscribe() // CVs devre dışı
    }

  }, [userLocation])

  return realtimeData
}