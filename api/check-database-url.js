// Check DATABASE_URL format and test different connection methods
import pg from 'pg'
const { Pool } = pg

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return res.status(500).json({ error: 'DATABASE_URL not set' })
    }

    // Show parsed URL components (without password)
    let urlInfo = {}
    try {
      const url = new URL(dbUrl)
      urlInfo = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        username: url.username,
        password: url.password ? '***' : 'not set',
        search: url.search
      }
    } catch (e) {
      urlInfo = { error: 'Invalid URL format', message: e.message }
    }

    // Test different connection methods
    const connectionTests = []

    // Test 1: Original DATABASE_URL
    try {
      const pool1 = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      })
      const client1 = await pool1.connect()
      const result1 = await client1.query('SELECT NOW()')
      client1.release()
      await pool1.end()
      connectionTests.push({ method: 'Original URL', success: true, result: result1.rows[0] })
    } catch (error) {
      connectionTests.push({ method: 'Original URL', success: false, error: error.message })
    }

    // Test 2: Alternative host format
    const altUrl = dbUrl.replace('db.fcsggaggjtxqwatimplk.supabase.co', 'fcsggaggjtxqwatimplk.supabase.co')
    if (altUrl !== dbUrl) {
      try {
        const pool2 = new Pool({
          connectionString: altUrl,
          ssl: { rejectUnauthorized: false }
        })
        const client2 = await pool2.connect()
        const result2 = await client2.query('SELECT NOW()')
        client2.release()
        await pool2.end()
        connectionTests.push({ method: 'Alternative host', success: true, result: result2.rows[0] })
      } catch (error) {
        connectionTests.push({ method: 'Alternative host', success: false, error: error.message })
      }
    }

    // Test 3: Manual config object
    try {
      const url = new URL(dbUrl)
      const pool3 = new Pool({
        user: url.username,
        password: url.password,
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.substring(1) || 'postgres',
        ssl: { rejectUnauthorized: false }
      })
      const client3 = await pool3.connect()
      const result3 = await client3.query('SELECT NOW()')
      client3.release()
      await pool3.end()
      connectionTests.push({ method: 'Manual config', success: true, result: result3.rows[0] })
    } catch (error) {
      connectionTests.push({ method: 'Manual config', success: false, error: error.message })
    }

    return res.status(200).json({
      success: true,
      database_url_info: urlInfo,
      connection_tests: connectionTests,
      recommendation: connectionTests.find(test => test.success) 
        ? `Use ${connectionTests.find(test => test.success).method} method`
        : 'No working connection method found'
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Connection test failed',
      details: error.message
    })
  }
}