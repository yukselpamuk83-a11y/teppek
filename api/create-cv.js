// Simple API endpoint for creating CV entries
import { Pool } from 'pg'

async function createCVHandler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    })
  }

  const { 
    full_name, title, description, lat, lon, country, city, 
    contact, skills = [], experience_years = 0, remote_available = false,
    salary_expectation_min, salary_expectation_max
  } = req.body

  // Basic validation
  if (!full_name || !title || !description || !lat || !lon || !contact) {
    return res.status(400).json({
      success: false,
      error: 'Required fields missing: full_name, title, description, lat, lon, contact',
      code: 'MISSING_FIELDS'
    })
  }

  // Additional validation for coordinates
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lon)
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates provided',
      code: 'INVALID_COORDINATES'
    })
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      error: 'Coordinates out of valid range',
      code: 'COORDINATES_OUT_OF_RANGE'
    })
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      success: false,
      error: 'Database configuration error',
      code: 'DATABASE_CONFIG_ERROR'
    })
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  let client
  try {
    client = await pool.connect()
    
    // Insert CV with dummy user ID for now
    const result = await client.query(`
      INSERT INTO cvs (
        user_id, full_name, title, description, lat, lon, 
        country, city, contact, skills, experience_years, 
        remote_available, salary_expectation_min, salary_expectation_max,
        currency, created_at, available_for_work
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), true)
      RETURNING *
    `, [
      'anonymous', // Geçici olarak anonymous user
      full_name.trim(), 
      title.trim(), 
      description.trim(),
      latitude, 
      longitude, 
      country?.trim() || 'Turkey', 
      city?.trim() || null, 
      contact?.trim(), 
      Array.isArray(skills) ? skills : [],
      parseInt(experience_years) || 0,
      Boolean(remote_available),
      salary_expectation_min ? parseInt(salary_expectation_min) : null,
      salary_expectation_max ? parseInt(salary_expectation_max) : null,
      'TRY'
    ])

    const createdCV = result.rows[0]

    return res.status(201).json({
      success: true,
      cv: {
        id: createdCV.id,
        full_name: createdCV.full_name,
        title: createdCV.title,
        description: createdCV.description,
        location: {
          lat: createdCV.lat,
          lng: createdCV.lon
        },
        country: createdCV.country,
        city: createdCV.city,
        contact: createdCV.contact,
        skills: createdCV.skills,
        experience_years: createdCV.experience_years,
        remote_available: createdCV.remote_available,
        salary_expectation: {
          min: createdCV.salary_expectation_min,
          max: createdCV.salary_expectation_max,
          currency: createdCV.currency
        },
        created_at: createdCV.created_at
      }
    })

  } catch (error) {
    console.error('Database error while creating CV:', error)
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'CV already exists at this location',
        code: 'DUPLICATE_CV'
      })
    }
    
    if (error.message.includes('relation "cvs" does not exist')) {
      return res.status(500).json({
        success: false,
        error: 'CV table not found in database',
        code: 'TABLE_NOT_FOUND'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create CV',
      code: 'DATABASE_ERROR',
      details: error.message
    })
  } finally {
    if (client) client.release()
    await pool.end()
  }
}

export default createCVHandler