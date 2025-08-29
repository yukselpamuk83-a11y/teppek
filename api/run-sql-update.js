// Run SQL update for Adzuna popups
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fcsggaggjtxqwatimplk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjc2dnYWdnanR4cXdhdGltcGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4ODU4OTksImV4cCI6MjA0OTQ2MTg5OX0.ksNjvTIQ6Tm9c_K8EDdNc3SgCRkVLZdnZNmTKzrjD0c';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get Adzuna jobs first
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('*')  
      .eq('source', 'adzuna');

    if (fetchError) throw fetchError;
    if (!jobs || jobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No Adzuna jobs found',
        updated: 0
      });
    }

    // Update each job individually
    let updated = 0;
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

      const { error: updateError } = await supabase
        .from('jobs')
        .update({ popup_html: newPopupHtml })
        .eq('id', job.id);
        
      if (!updateError) updated++;
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updated} out of ${jobs.length} Adzuna jobs`,
      total: jobs.length,
      updated: updated
    });

  } catch (error) {
    console.error('SQL Update error:', error);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};