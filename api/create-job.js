// Simple API endpoint for creating job listings
const { Pool } = require('pg')

async function createJobHandler(req, res) {
  console.log('🚀 create-job API started')
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled')
    return res.status(200).end();
  }

  console.log('📝 Method:', req.method)
  console.log('📦 Body:', req.body)

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed')
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    })
  }

  const { title, company, city, country, lat, lon, contact, remote = false, salary_min, salary_max, currency = 'USD' } = req.body

  console.log('📋 Received data:', { title, company, lat, lon })

  // Basic validation
  if (!title || !company || !lat || !lon) {
    console.log('❌ Validation failed - missing required fields')
    return res.status(400).json({
      success: false,
      error: 'Required fields missing: title, company, lat, lon',
      code: 'MISSING_FIELDS'
    })
  }

  console.log('✅ Basic validation passed')

  // Additional validation for coordinates
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lon)
  
  console.log('🗺 Coordinates:', { latitude, longitude })
  
  if (isNaN(latitude) || isNaN(longitude)) {
    console.log('❌ Invalid coordinates')
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates provided',
      code: 'INVALID_COORDINATES'
    })
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    console.log('❌ Coordinates out of range')
    return res.status(400).json({
      success: false,
      error: 'Coordinates out of valid range',
      code: 'COORDINATES_OUT_OF_RANGE'
    })
  }

  console.log('✅ Coordinate validation passed')

  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL missing')
    return res.status(500).json({
      success: false,
      error: 'Database configuration error',
      code: 'DATABASE_CONFIG_ERROR'
    })
  }

  console.log('✅ DATABASE_URL exists, length:', process.env.DATABASE_URL.length)

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  let client
  try {
    client = await pool.connect()
    
    // Insert job with adzuna_id for manual entries
    const adzunaId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await client.query(`
      INSERT INTO jobs (
        adzuna_id, title, company, city, country, lat, lon, 
        url, contact, salary_min, salary_max, currency, source, user_id, remote, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *
    `, [
      adzunaId,
      title.trim(), 
      company.trim(), 
      city?.trim() || null, 
      country?.trim() || null, 
      latitude, 
      longitude, 
      '#', // url için placeholder
      contact?.trim() || null, 
      salary_min ? parseInt(salary_min) : null,
      salary_max ? parseInt(salary_max) : null,
      currency?.trim()?.substring(0, 3) || 'USD', // Currency'yi 3 karakterle sınırla
      'manual', 
      null, // user_id NULL - anonymous işler için
      Boolean(remote)
    ])

    const createdJob = result.rows[0]

    return res.status(201).json({
      success: true,
      job: {
        id: createdJob.id,
        adzuna_id: createdJob.adzuna_id,
        title: createdJob.title,
        company: createdJob.company,
        city: createdJob.city,
        country: createdJob.country,
        location: {
          lat: createdJob.lat,
          lng: createdJob.lon
        },
        url: createdJob.url,
        contact: createdJob.contact,
        salary_min: createdJob.salary_min,
        salary_max: createdJob.salary_max,
        currency: createdJob.currency,
        remote: createdJob.remote,
        source: createdJob.source,
        created_at: createdJob.created_at
      }
    })

  } catch (error) {
    console.error('Database error while creating job:', error)
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Job listing already exists',
        code: 'DUPLICATE_JOB'
      })
    }
    
    if (error.message.includes('relation "jobs" does not exist')) {
      return res.status(500).json({
        success: false,
        error: 'Jobs table not found in database',
        code: 'TABLE_NOT_FOUND'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create job listing',
      code: 'DATABASE_ERROR',
      details: error.message
    })
  } finally {
    if (client) client.release()
    await pool.end()
  }
}

module.exports = createJobHandler