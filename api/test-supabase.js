// Test Supabase connection instead of direct PostgreSQL
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Environment check
    const envCheck = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Supabase environment check:', envCheck);

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Supabase environment variables not set',
        envCheck
      });
    }

    // Supabase connection test
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );

    // Test jobs table
    const { data: jobsData, error: jobsError, count: jobsCount } = await supabase
      .from('jobs')
      .select('id, title, created_at', { count: 'exact' })
      .limit(3);

    // Test cvs table
    const { data: cvsData, error: cvsError, count: cvsCount } = await supabase
      .from('cvs')
      .select('id, title, created_at', { count: 'exact' })
      .limit(3);

    const results = {
      jobs: {
        success: !jobsError,
        count: jobsCount,
        sample_data: jobsData || [],
        error: jobsError?.message
      },
      cvs: {
        success: !cvsError,
        count: cvsCount,
        sample_data: cvsData || [],
        error: cvsError?.message
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Supabase connection test completed',
      envCheck,
      database_test: results
    });

  } catch (error) {
    console.error('❌ Supabase test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Supabase connection test failed',
      details: error.message
    });
  }
}