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
        return await createJob(req, res)
      case 'GET':
        return await getJobs(req, res)
      case 'PUT':
        return await updateJob(req, res)
      case 'DELETE':
        return await deleteJob(req, res)
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

async function createJob(req, res) {
  const {
    title,
    company,
    description,
    requirements,
    location,
    latitude,
    longitude,
    salary_min,
    salary_max,
    work_type,
    employment_type,
    category,
    skills,
    benefits,
    application_deadline,
    contact_email,
    contact_phone,
    company_website,
    remote_allowed,
    experience_level,
    education_level
  } = req.body

  // Validation
  if (!title || !company || !description || !location) {
    return res.status(400).json({ 
      error: 'Required fields missing',
      required: ['title', 'company', 'description', 'location']
    })
  }

  const jobData = {
    title: title.trim(),
    company: company.trim(),
    description: description.trim(),
    requirements: requirements || '',
    location: location.trim(),
    latitude: latitude || null,
    longitude: longitude || null,
    salary_min: salary_min || null,
    salary_max: salary_max || null,
    work_type: work_type || 'full-time',
    employment_type: employment_type || 'permanent',
    category: category || 'general',
    skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
    benefits: Array.isArray(benefits) ? benefits : (benefits ? benefits.split(',').map(b => b.trim()) : []),
    application_deadline: application_deadline || null,
    contact_email: contact_email || null,
    contact_phone: contact_phone || null,
    company_website: company_website || null,
    remote_allowed: remote_allowed === true || remote_allowed === 'true',
    experience_level: experience_level || 'mid',
    education_level: education_level || 'bachelors',
    status: 'active',
    posted_date: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ 
      error: 'Database error',
      details: error.message
    })
  }

  return res.status(201).json({
    success: true,
    data: data,
    message: 'Job posted successfully'
  })
}

async function getJobs(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    location, 
    category,
    work_type,
    salary_min,
    salary_max,
    company,
    skills
  } = req.query

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')

  // Apply filters
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,company.ilike.%${search}%`)
  }

  if (location) {
    query = query.ilike('location', `%${location}%`)
  }

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (work_type && work_type !== 'all') {
    query = query.eq('work_type', work_type)
  }

  if (company) {
    query = query.ilike('company', `%${company}%`)
  }

  if (salary_min) {
    query = query.gte('salary_max', parseInt(salary_min))
  }

  if (salary_max) {
    query = query.lte('salary_min', parseInt(salary_max))
  }

  if (skills) {
    const skillList = Array.isArray(skills) ? skills : skills.split(',')
    query = query.overlaps('skills', skillList)
  }

  // Pagination
  const offset = (parseInt(page) - 1) * parseInt(limit)
  query = query
    .order('posted_date', { ascending: false })
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

async function updateJob(req, res) {
  const { id } = req.query
  const updateData = { ...req.body }
  
  if (!id) {
    return res.status(400).json({ error: 'Job ID is required' })
  }

  // Add updated timestamp
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', id)
    .select()
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
    message: 'Job updated successfully'
  })
}

async function deleteJob(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Job ID is required' })
  }

  const { error } = await supabase
    .from('jobs')
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
    message: 'Job deleted successfully'
  })
}