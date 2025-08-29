import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getDistance } from '../utils/distance'

export function useRealtimeData(userLocation) {
  const [realtimeData, setRealtimeData] = useState([])

  useEffect(() => {
    if (!userLocation) return

    // Initial data fetch - sadece manuel girişler
    const fetchManualEntries = async () => {
      try {
        // Jobs - source='manual' olanlar
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('source', 'manual')

        if (jobsError) throw jobsError

        // CVs - tüm cvs'ler manuel
        const { data: cvs, error: cvsError } = await supabase
          .from('cvs')
          .select('*')

        if (cvsError) throw cvsError

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

    // Realtime subscriptions
    const jobsChannel = supabase
      .channel('jobs-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
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
          
          if (payload.eventType === 'UPDATE') {
            setRealtimeData(prev => prev.map(item => 
              item.id === `manual-job-${payload.new.id}` 
                ? { ...item, ...payload.new }
                : item
            ))
          }
          
          if (payload.eventType === 'DELETE') {
            setRealtimeData(prev => prev.filter(item => 
              item.id !== `manual-job-${payload.old.id}`
            ))
          }
        }
      )
      .subscribe()

    const cvsChannel = supabase
      .channel('cvs-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cvs'
        }, 
        (payload) => {
          console.log('🔄 CV realtime update:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newCv = {
              id: `manual-cv-${payload.new.id}`,
              type: 'cv',
              title: payload.new.title,
              company: payload.new.full_name,
              name: payload.new.full_name,
              location: {
                lat: parseFloat(payload.new.lat),
                lng: parseFloat(payload.new.lon)
              },
              address: `${payload.new.city || ''}, ${payload.new.country || ''}`.replace(/^,\\s*|,\\s*$/g, ''),
              salary_min: payload.new.salary_expectation_min,
              salary_max: payload.new.salary_expectation_max,
              currency: 'TRY',
              contact: payload.new.contact,
              skills: payload.new.skills,
              experience_years: payload.new.experience_years,
              remote: payload.new.remote_available,
              source: 'manual',
              postedDate: payload.new.created_at,
              distance: getDistance(
                userLocation.lat, 
                userLocation.lng, 
                parseFloat(payload.new.lat), 
                parseFloat(payload.new.lon)
              )
            }
            
            setRealtimeData(prev => [newCv, ...prev])
          }
          
          if (payload.eventType === 'UPDATE') {
            setRealtimeData(prev => prev.map(item => 
              item.id === `manual-cv-${payload.new.id}` 
                ? { ...item, ...payload.new }
                : item
            ))
          }
          
          if (payload.eventType === 'DELETE') {
            setRealtimeData(prev => prev.filter(item => 
              item.id !== `manual-cv-${payload.old.id}`
            ))
          }
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      jobsChannel.unsubscribe()
      cvsChannel.unsubscribe()
    }

  }, [userLocation])

  return realtimeData
}