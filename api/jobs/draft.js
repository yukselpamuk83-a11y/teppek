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

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { draft_data, type, user_id } = req.body

    if (!draft_data || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['draft_data', 'type']
      })
    }

    if (!['job', 'cv'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type',
        allowed: ['job', 'cv']
      })
    }

    const draftData = {
      type: type,
      draft_data: draft_data,
      user_id: user_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Check for existing draft of same type for user
    if (user_id) {
      const { data: existingDraft } = await supabase
        .from('drafts')
        .select('id')
        .eq('user_id', user_id)
        .eq('type', type)
        .single()

      if (existingDraft) {
        // Update existing draft
        const { data, error } = await supabase
          .from('drafts')
          .update({
            draft_data: draft_data,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDraft.id)
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
          message: 'Draft updated successfully'
        })
      }
    }

    // Create new draft
    const { data, error } = await supabase
      .from('drafts')
      .insert([draftData])
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
      message: 'Draft saved successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}