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
    // Sadece popup için gerekli field'ları çek
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id, title, company, 
        description, 
        salary_min, salary_max, currency, 
        url,
        city, country
      `)
      .eq('id', parseInt(id))
      .single();

    if (error || !data) {
      console.log('Database error for job ID', id, ':', error);
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found',
        debug: { id, error: error?.message }
      });
    }

    console.log('Job details found:', {
      id: data.id,
      title: data.title,
      hasDescription: !!data.description,
      hasUrl: !!data.url,
      hasSalary: !!(data.salary_min && data.salary_max),
      hasLocation: !!(data.city || data.country)
    });

    // Sadece istenen field'ları döndür: maaş, link, açıklama, şehir, ülke
    res.status(200).json({
      success: true,
      title: data.title || 'İlan Başlığı',
      company: data.company || '',
      description: data.description || '',
      salary_min: data.salary_min,
      salary_max: data.salary_max, 
      currency: data.currency || 'USD',
      url: data.url || '',
      city: data.city || '',
      country: data.country || ''
    });

  } catch (error) {
    console.error('Job details API error:', error);
    res.status(500).json({
      success: false,
      error: 'Database error'
    });
  }
}