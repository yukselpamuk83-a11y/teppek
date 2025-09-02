import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  const { method } = req

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (method) {
      case 'POST':
        return await createCV(req, res)
      case 'GET':
        return await getCVs(req, res)
      case 'PUT':
        return await updateCV(req, res)
      case 'DELETE':
        return await deleteCV(req, res)
      default:
        res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}

async function createCV(req, res) {
  const {
    firstName,
    lastName,
    email,
    phone,
    city,
    district,
    address,
    title,
    summary,
    experience,
    skills,
    languages,
    preferredSalary,
    workType,
    availability,
    timeline_data,
    latitude,
    longitude,
    profile_photo,
    portfolio_url,
    linkedin_url,
    github_url
  } = req.body

  // Validation
  if (!firstName || !lastName || !email || !title) {
    return res.status(400).json({ 
      error: 'Required fields missing',
      required: ['firstName', 'lastName', 'email', 'title']
    })
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  const cvData = {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || null,
    city: city?.trim() || null,
    district: district?.trim() || null,
    address: address?.trim() || null,
    title: title.trim(),
    summary: summary?.trim() || null,
    experience_years: experience ? parseInt(experience) : 0,
    skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
    languages: Array.isArray(languages) ? languages : (languages ? languages.split(',').map(l => l.trim()) : []),
    preferred_salary: preferredSalary ? parseInt(preferredSalary) : null,
    work_type: workType || 'full-time',
    availability: availability || 'immediately',
    timeline_data: timeline_data || [],
    latitude: latitude || null,
    longitude: longitude || null,
    profile_photo: profile_photo || null,
    portfolio_url: portfolio_url || null,
    linkedin_url: linkedin_url || null,
    github_url: github_url || null,
    status: 'active',
    visibility: 'public',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Check for existing email
  const { data: existingCV } = await supabase
    .from('cvs')
    .select('id')
    .eq('email', cvData.email)
    .single()

  if (existingCV) {
    return res.status(409).json({ 
      error: 'Email already exists',
      message: 'A CV with this email already exists'
    })
  }

  const { data, error } = await supabase
    .from('cvs')
    .insert([cvData])
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ 
      error: 'Database error',
      details: error.message
    })
  }

  // Remove sensitive data from response
  delete data.email
  delete data.phone

  return res.status(201).json({
    success: true,
    data: data,
    message: 'CV created successfully'
  })
}

async function getCVs(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    city, 
    skills,
    work_type,
    min_experience,
    max_experience,
    title,
    availability
  } = req.query

  let query = supabase
    .from('cvs')
    .select(`
      id,
      first_name,
      last_name,
      title,
      summary,
      city,
      experience_years,
      skills,
      languages,
      work_type,
      availability,
      timeline_data,
      latitude,
      longitude,
      profile_photo,
      portfolio_url,
      linkedin_url,
      github_url,
      created_at,
      updated_at
    `)
    .eq('status', 'active')
    .eq('visibility', 'public')

  // Apply filters
  if (search) {
    query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }

  if (city) {
    query = query.ilike('city', `%${city}%`)
  }

  if (title) {
    query = query.ilike('title', `%${title}%`)
  }

  if (work_type && work_type !== 'all') {
    query = query.eq('work_type', work_type)
  }

  if (availability && availability !== 'all') {
    query = query.eq('availability', availability)
  }

  if (min_experience) {
    query = query.gte('experience_years', parseInt(min_experience))
  }

  if (max_experience) {
    query = query.lte('experience_years', parseInt(max_experience))
  }

  if (skills) {
    const skillList = Array.isArray(skills) ? skills : skills.split(',')
    query = query.overlaps('skills', skillList)
  }

  // Pagination
  const offset = (parseInt(page) - 1) * parseInt(limit)
  query = query
    .order('updated_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ 
      error: 'Database error',
      details: error.message
    })
  }

  return res.status(200).json({
    success: true,
    data: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / parseInt(limit))
    }
  })
}

async function updateCV(req, res) {
  const { id } = req.query
  const updateData = { ...req.body }
  
  if (!id) {
    return res.status(400).json({ error: 'CV ID is required' })
  }

  // Add updated timestamp
  updateData.updated_at = new Date().toISOString()

  // Handle timeline data
  if (updateData.timeline_data) {
    updateData.timeline_data = Array.isArray(updateData.timeline_data) 
      ? updateData.timeline_data 
      : []
  }

  const { data, error } = await supabase
    .from('cvs')
    .update(updateData)
    .eq('id', id)
    .select(`
      id,
      first_name,
      last_name,
      title,
      summary,
      city,
      experience_years,
      skills,
      languages,
      work_type,
      availability,
      timeline_data,
      latitude,
      longitude,
      profile_photo,
      portfolio_url,
      linkedin_url,
      github_url,
      updated_at
    `)
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ 
      error: 'Database error',
      details: error.message
    })
  }

  return res.status(200).json({
    success: true,
    data: data,
    message: 'CV updated successfully'
  })
}

async function deleteCV(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'CV ID is required' })
  }

  const { error } = await supabase
    .from('cvs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ 
      error: 'Database error',
      details: error.message
    })
  }

  return res.status(200).json({
    success: true,
    message: 'CV deleted successfully'
  })
}