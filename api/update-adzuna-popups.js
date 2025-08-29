// Update existing Adzuna job popups in database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fcsggaggjtxqwatimplk.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseKey) {
    return res.status(500).json({ error: 'Supabase key not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all Adzuna jobs
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('source', 'adzuna');

    if (fetchError) {
      throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No Adzuna jobs found to update',
        updated: 0
      });
    }

    let updatedCount = 0;

    // Update each job's popup HTML
    for (const job of jobs) {
      const address = `${job.city || ''}, ${job.country || ''}`.replace(/^,\s*|,\s*$/g, '');
      
      const newPopupHtml = `
    <div class="custom-popup-container adzuna-popup">
      <div class="popup-header">
        <div class="popup-title">${job.title}</div>
        <div class="popup-source">
          <i class="fa-solid fa-globe"></i>
          Adzuna
        </div>
      </div>
      
      <div class="popup-salary adzuna-salary">
        <i class="fa-solid fa-dollar-sign"></i>
        ${job.currency || 'USD'} ${Math.round(job.salary_min)?.toLocaleString() || '?'} - ${Math.round(job.salary_max)?.toLocaleString() || '?'}
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
        .update({ 
          popup_html: newPopupHtml.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) {
        console.error(`Failed to update job ${job.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} Adzuna job popups`,
      total: jobs.length,
      updated: updatedCount
    });

  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};