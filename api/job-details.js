import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'Job ID is required' 
    });
  }

  try {
    // Gerçek database'den veri çek (DB ID ile)
    const { data, error } = await supabase
      .from('jobs')
      .select('salary_min, salary_max, currency, url, source, remote')
      .eq('id', parseInt(id))
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        currency: data.currency || 'USD',
        url: data.url,
        source: data.source,
        remote: data.remote || false
      }
    });

  } catch (error) {
    console.error('Job details API error:', error);
    res.status(500).json({
      success: false,
      error: 'Database error'
    });
  }
}