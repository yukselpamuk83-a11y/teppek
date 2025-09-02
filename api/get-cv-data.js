// GET CV DATA API - Enhanced for Timeline Support
import { createClient } from '@supabase/supabase-js';

export default async function getCVDataHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  // Check Supabase environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Supabase environment variables missing!');
    return res.status(500).json({
      success: false,
      error: 'Database configuration error - Supabase credentials missing',
      code: 'SUPABASE_CONFIG_ERROR'
    });
  }

  const {
    q = '',                    // Search term
    country = '',              // Country filter
    city = '',                 // City filter  
    remote = '',               // Remote work filter (true/false)
    skills = '',               // Skills filter (comma-separated)
    experience_min = '',       // Min experience years
    experience_max = '',       // Max experience years
    education_level = '',      // Education level filter
    timeline_types = '',       // Timeline types filter
    page = '1',               // Page number
    limit = '50',             // Items per page
    clear = ''                // Clear filters
  } = req.query;

  // Input validation and sanitization
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * limitNum;

  const sanitizedQuery = q.trim().substring(0, 100);
  const sanitizedCountry = country.trim().substring(0, 50);
  const sanitizedCity = city.trim().substring(0, 50);
  const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [];
  const experienceMin = experience_min ? parseInt(experience_min) : null;
  const experienceMax = experience_max ? parseInt(experience_max) : null;
  const educationLevels = education_level ? education_level.split(',').map(e => e.trim()).filter(e => e) : [];
  const timelineTypesArray = timeline_types ? timeline_types.split(',').map(t => t.trim()).filter(t => t) : [];

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    let cvsQuery = supabase
      .from('cvs')
      .select(`
        id, full_name, title, description, lat, lon, country, city, 
        contact, skills, experience_years, remote_available,
        salary_expectation_min, salary_expectation_max, currency,
        timeline_data, is_timeline_public, profile_photo_url,
        linkedin_url, github_url, created_at
      `, { count: 'exact' })
      .eq('available_for_work', true);

    // Apply filters
    if (clear !== 'true') {
      // Text search in name, title, and description
      if (sanitizedQuery) {
        cvsQuery = cvsQuery.or(`
          full_name.ilike.%${sanitizedQuery}%,
          title.ilike.%${sanitizedQuery}%,
          description.ilike.%${sanitizedQuery}%
        `);
      }
      
      // Location filters
      if (sanitizedCountry) {
        cvsQuery = cvsQuery.eq('country', sanitizedCountry);
      }
      
      if (sanitizedCity) {
        cvsQuery = cvsQuery.ilike('city', `%${sanitizedCity}%`);
      }
      
      // Remote availability
      if (remote === 'true') {
        cvsQuery = cvsQuery.eq('remote_available', true);
      } else if (remote === 'false') {
        cvsQuery = cvsQuery.eq('remote_available', false);
      }

      // Experience years filter
      if (experienceMin !== null) {
        cvsQuery = cvsQuery.gte('experience_years', experienceMin);
      }
      if (experienceMax !== null) {
        cvsQuery = cvsQuery.lte('experience_years', experienceMax);
      }

      // Skills filter (PostgreSQL array contains)
      if (skillsArray.length > 0) {
        cvsQuery = cvsQuery.overlaps('skills', skillsArray);
      }

      // Timeline types filter (JSON array contains)
      if (timelineTypesArray.length > 0) {
        const timelineFilter = timelineTypesArray.map(type => 
          `timeline_data @> '[{"type": "${type}"}]'`
        ).join(' OR ');
        cvsQuery = cvsQuery.or(timelineFilter);
      }

      // Education level filter (requires timeline analysis)
      if (educationLevels.length > 0) {
        const educationFilter = educationLevels.map(level => {
          switch (level) {
            case 'high_school':
              return `timeline_data @> '[{"type": "education", "title": "lise"}]'`;
            case 'associate':
              return `timeline_data @> '[{"type": "education", "title": "ön lisans"}]'`;
            case 'bachelor':
              return `timeline_data @> '[{"type": "education", "title": "lisans"}]'`;
            case 'master':
              return `timeline_data @> '[{"type": "education", "title": "yüksek lisans"}]'`;
            case 'phd':
              return `timeline_data @> '[{"type": "education", "title": "doktora"}]'`;
            default:
              return null;
          }
        }).filter(f => f).join(' OR ');
        
        if (educationFilter) {
          cvsQuery = cvsQuery.or(educationFilter);
        }
      }
    }

    // Execute query with pagination
    const { data: cvsData, error: cvsError, count: totalCount } = await cvsQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (cvsError) {
      console.error('CVs query error:', cvsError);
      throw cvsError;
    }

    // Transform data for map display
    const transformedCVs = cvsData.map(cv => ({
      id: `cv-${cv.id}`,
      type: 'cv',
      title: cv.title,
      name: cv.full_name,
      company: cv.full_name, // For compatibility with existing map code
      location: {
        lat: parseFloat(cv.lat),
        lng: parseFloat(cv.lon)
      },
      address: `${cv.city || ''}, ${cv.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
      contact: cv.contact,
      skills: cv.skills || [],
      experience_years: cv.experience_years || 0,
      remote_available: cv.remote_available || false,
      salary_min: cv.salary_expectation_min,
      salary_max: cv.salary_expectation_max,
      currency: cv.currency || 'TRY',
      
      // Timeline specific data
      timeline_data: cv.timeline_data || [],
      timeline_items_count: cv.timeline_data ? cv.timeline_data.length : 0,
      is_timeline_public: cv.is_timeline_public !== false,
      profile_photo_url: cv.profile_photo_url,
      linkedin_url: cv.linkedin_url,
      github_url: cv.github_url,
      
      // Map integration fields
      source: 'manual',
      postedDate: cv.created_at,
      
      // Computed fields
      latest_position: cv.timeline_data && cv.timeline_data.length > 0 
        ? cv.timeline_data
            .filter(t => t.type === 'work' || t.type === 'current_work')
            .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0]?.title || cv.title
        : cv.title,
      
      unique_skills_count: cv.timeline_data 
        ? [...new Set(cv.timeline_data.flatMap(t => t.skills || []))].length
        : cv.skills ? cv.skills.length : 0
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    // Statistics
    const stats = {
      total_items: totalCount,
      current_page: pageNum,
      total_pages: totalPages,
      items_per_page: limitNum,
      has_next_page: pageNum < totalPages,
      has_prev_page: pageNum > 1,
      
      // CV specific stats
      avg_experience: cvsData.length > 0 
        ? Math.round(cvsData.reduce((sum, cv) => sum + (cv.experience_years || 0), 0) / cvsData.length)
        : 0,
      remote_available_count: cvsData.filter(cv => cv.remote_available).length,
      timeline_enabled_count: cvsData.filter(cv => cv.timeline_data && cv.timeline_data.length > 0).length
    };

    return res.status(200).json({
      success: true,
      data: transformedCVs,
      stats,
      filters: {
        search_query: sanitizedQuery,
        country: sanitizedCountry || 'all',
        city: sanitizedCity || 'all',
        remote: remote || 'all',
        skills: skillsArray,
        experience_min: experienceMin,
        experience_max: experienceMax,
        education_level: educationLevels,
        timeline_types: timelineTypesArray
      }
    });

  } catch (error) {
    console.error('❌ Supabase CV API error:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
      success: false,
      error: isDevelopment ? `Supabase error: ${error.message}` : 'Internal server error',
      code: 'SUPABASE_ERROR',
      ...(isDevelopment && {
        details: {
          message: error.message,
          stack: error.stack
        }
      })
    });
  }
}