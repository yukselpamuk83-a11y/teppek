// Simple popup update without external dependencies
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase environment variables not configured' });
    }
    
    // First get Adzuna jobs
    const getResponse = await fetch(`${supabaseUrl}/rest/v1/jobs?source=eq.adzuna&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Get failed: ${getResponse.statusText}`);
    }
    
    const jobs = await getResponse.json();
    
    if (!jobs || jobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No Adzuna jobs found',
        updated: 0
      });
    }

    let updated = 0;
    
    // Update each job
    for (const job of jobs) {
      const address = `${job.city || ''}, ${job.country || ''}`.replace(/^,\s*|,\s*$/g, '');
      
      const newPopupHtml = `<div class="custom-popup-container adzuna-popup">
<div class="popup-header">
<div class="popup-title">${job.title}</div>
<div class="popup-source">
<i class="fa-solid fa-globe"></i>
Adzuna
</div>
</div>
<div class="popup-salary adzuna-salary">
<i class="fa-solid fa-dollar-sign"></i>
${job.currency || 'USD'} ${job.salary_min || '?'} - ${job.salary_max || '?'}
</div>
<div class="popup-details">
<div class="popup-company">
<i class="fa-solid fa-building"></i>
${job.company || 'Şirket bilgisi mevcut değil'}
</div>
<div class="popup-location">
<i class="fa-solid fa-location-dot"></i>
${address}
</div>
</div>
<a href="${job.url}" target="_blank" rel="noopener noreferrer" class="popup-apply-btn adzuna-apply">
<i class="fa-solid fa-external-link"></i>
İlana Başvur
</a>
<div class="popup-footer">
<small>Powered by Adzuna API</small>
</div>
</div>`;

      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/jobs?id=eq.${job.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          popup_html: newPopupHtml
        })
      });
      
      if (updateResponse.ok) {
        updated++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updated} out of ${jobs.length} Adzuna jobs`,
      total: jobs.length,
      updated: updated
    });

  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};