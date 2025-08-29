# 🚀 Production Deployment Guide

This guide will help you deploy the enhanced Teppek application with all security and performance improvements.

## 📋 Pre-Deployment Checklist

### 🔒 Critical Security Steps (MUST DO FIRST!)

1. **Database Security (CRITICAL)**
   - [ ] Execute all SQL commands from `DATABASE_SECURITY_SETUP.md`
   - [ ] Verify RLS is enabled: `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'jobs';`
   - [ ] Test policies work correctly
   - [ ] Add `user_id` column to existing jobs table

2. **Environment Variables**
   - [ ] `DATABASE_URL` - PostgreSQL connection string
   - [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
   - [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

3. **API Security**
   - [ ] All API endpoints have proper error handling
   - [ ] Rate limiting is configured
   - [ ] Input validation is in place
   - [ ] Authentication middleware is working

### 🛠️ Technical Setup

4. **Dependencies**
   ```bash
   npm install
   npm audit fix
   ```

5. **Build Process**
   ```bash
   npm run build
   npm run preview  # Test production build locally
   ```

6. **Database Migrations**
   - Execute the SQL scripts in the correct order
   - Test with a sample authenticated user
   - Verify RLS policies work as expected

## 🚀 Deployment Steps

### Option 1: Vercel Deployment (Recommended)

1. **Connect Repository**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Configure Environment Variables in Vercel Dashboard**
   - Go to Project Settings > Environment Variables
   - Add all required environment variables
   - Make sure `VITE_` prefixed variables are available in all environments

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Manual Deployment

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Deploy Static Files**
   - Upload `dist/` folder to your hosting provider
   - Configure redirects for SPA routing

3. **Deploy API Functions**
   - Ensure serverless functions are supported
   - Configure environment variables on the server

## 🧪 Post-Deployment Testing

### Functional Tests

1. **Database Connectivity**
   ```bash
   curl https://your-domain.com/api/get-jobs?limit=1
   ```

2. **Authentication Flow**
   - [ ] User can sign up
   - [ ] User can sign in
   - [ ] Protected routes require authentication
   - [ ] User can create job listings (authenticated)
   - [ ] RLS prevents unauthorized access

3. **API Endpoints**
   - [ ] `GET /api/get-jobs` - Returns job listings
   - [ ] `POST /api/create-job` - Creates job (requires auth)
   - [ ] Rate limiting works (try 100+ requests quickly)
   - [ ] Input validation rejects invalid data

4. **Frontend Features**
   - [ ] Map loads with job markers
   - [ ] Filters work correctly
   - [ ] Pagination functions
   - [ ] Loading states display properly
   - [ ] Error handling shows user-friendly messages
   - [ ] Job creation form validates input

### Performance Tests

5. **Page Load Speed**
   - [ ] Initial page load < 3 seconds
   - [ ] TanStack Query caching works
   - [ ] Lazy loading components work
   - [ ] No console errors

6. **Database Performance**
   - [ ] Queries return results < 1 second
   - [ ] Indexes are being used
   - [ ] No N+1 query issues

## 🔍 Monitoring Setup

### Error Tracking

1. **Client-Side Monitoring**
   ```javascript
   // Add to your error boundary or main app
   window.addEventListener('error', (event) => {
     console.error('Global error:', event.error)
     // Send to your monitoring service
   })
   ```

2. **API Monitoring**
   - Monitor response times
   - Track error rates
   - Set up alerts for database connectivity issues

### Performance Monitoring

3. **Core Web Vitals**
   - Use Vercel Analytics (built-in)
   - Monitor LCP, FID, CLS scores
   - Set up alerts for performance degradation

## 🛡️ Security Verification

### Database Security

1. **Test Unauthorized Access**
   ```sql
   -- This should fail for users trying to access other users' data
   SELECT * FROM jobs WHERE user_id != auth.uid();
   ```

2. **Verify RLS Policies**
   ```sql
   -- Check all policies are in place
   SELECT * FROM pg_policies WHERE tablename = 'jobs';
   ```

### API Security

3. **Test Rate Limiting**
   ```bash
   # This should eventually return 429 (Too Many Requests)
   for i in {1..200}; do curl https://your-domain.com/api/get-jobs & done
   ```

4. **Test Input Validation**
   ```bash
   # These should return 400 (Bad Request)
   curl -X POST https://your-domain.com/api/create-job -H "Content-Type: application/json" -d '{}'
   curl -X POST https://your-domain.com/api/create-job -H "Content-Type: application/json" -d '{"title": ""}'
   ```

## 🚨 Rollback Plan

If issues occur during deployment:

1. **Database Rollback**
   ```sql
   -- Disable RLS temporarily (not recommended for production)
   ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
   ```

2. **Application Rollback**
   ```bash
   # Revert to previous deployment
   vercel rollback
   ```

3. **Quick Fixes**
   - Check environment variables are set correctly
   - Verify database connectivity
   - Check browser console for JavaScript errors

## 📊 Success Metrics

After deployment, monitor these metrics:

- **Performance**: Page load time < 3s, API response time < 1s
- **Security**: No unauthorized database access, rate limiting working
- **User Experience**: Error rate < 1%, successful job creation rate > 95%
- **Reliability**: Uptime > 99.9%, database connection stability

## 🎉 Go Live!

Once all checks pass:

1. Update your domain DNS (if needed)
2. Enable production monitoring
3. Notify users of new features
4. Monitor closely for the first 24 hours

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Check Supabase database logs
3. Monitor browser console errors
4. Review network requests in browser dev tools

**Remember**: The security improvements are critical. Don't skip the database security setup!