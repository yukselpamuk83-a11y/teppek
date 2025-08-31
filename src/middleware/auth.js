// Authentication Middleware for API Protection
// This provides server-side authentication for protected routes

export async function createAuthenticatedClient(req) {
  // Import Supabase dynamically to avoid issues with SSR
  const { createClient } = await import('@supabase/supabase-js')
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Extract JWT token from Authorization header or cookies
  let token = null
  
  // Try Authorization header first
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  // If no token in header, try cookies (for browser requests)
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {})
    
    // Supabase typically stores tokens in sb-access-token cookie
    token = cookies['sb-access-token'] || cookies['supabase-auth-token']
  }

  if (!token) {
    return { supabase, session: null, user: null }
  }

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { supabase, session: null, user: null }
    }

    // Create a session object
    const session = {
      access_token: token,
      user: user
    }

    return { supabase, session, user }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { supabase, session: null, user: null }
  }
}

export function requireAuth(handler) {
  return async (req, res) => {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    try {
      const { session, user } = await createAuthenticatedClient(req)
      
      if (!session || !user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        })
      }

      // Add user information to request object
      req.user = user
      req.session = session
      
      return handler(req, res)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      })
    }
  }
}

// Rate limiting helper
const rateLimits = new Map()

export function rateLimit(maxRequests = 10, windowMs = 60000) {
  return (handler) => {
    return async (req, res) => {
      const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      const now = Date.now()
      const windowStart = now - windowMs
      
      // Clean old entries
      if (rateLimits.has(clientId)) {
        const requests = rateLimits.get(clientId).filter(time => time > windowStart)
        rateLimits.set(clientId, requests)
      }
      
      const requests = rateLimits.get(clientId) || []
      
      if (requests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED'
        })
      }
      
      // Add current request
      requests.push(now)
      rateLimits.set(clientId, requests)
      
      return handler(req, res)
    }
  }
}

// Input validation helper
export function validateInput(schema) {
  return (handler) => {
    return async (req, res) => {
      try {
        // Basic validation - in production you'd use Zod or similar
        const { body } = req
        
        for (const [field, rules] of Object.entries(schema)) {
          const value = body[field]
          
          if (rules.required && (!value || value.trim() === '')) {
            return res.status(400).json({
              success: false,
              error: `Field '${field}' is required`,
              code: 'VALIDATION_ERROR'
            })
          }
          
          if (value && rules.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              return res.status(400).json({
                success: false,
                error: `Field '${field}' must be a valid email`,
                code: 'VALIDATION_ERROR'
              })
            }
          }
          
          if (value && rules.minLength && value.length < rules.minLength) {
            return res.status(400).json({
              success: false,
              error: `Field '${field}' must be at least ${rules.minLength} characters`,
              code: 'VALIDATION_ERROR'
            })
          }
        }
        
        return handler(req, res)
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          code: 'VALIDATION_ERROR'
        })
      }
    }
  }
}