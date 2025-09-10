# CloudFlare Worker Deployment Instructions for teppek.com

## 🎯 Overview
This guide will help you deploy the tile proxy CloudFlare Worker for the `tiles.teppek.com` subdomain using your CloudFlare dashboard.

**Your CloudFlare Dashboard**: https://dash.cloudflare.com/7dfd0c43e113e626f0712b7bba438533/teppek.com

## 📋 Prerequisites
- Access to your CloudFlare dashboard for teppek.com
- Worker script file: `cloudflare-worker-teppek.js`
- Domain: teppek.com (already configured in your CloudFlare account)

---

## 🚀 Step-by-Step Deployment

### Step 1: Access CloudFlare Workers
1. **Navigate to your dashboard**: https://dash.cloudflare.com/7dfd0c43e113e626f0712b7bba438533/teppek.com
2. Click on **"Workers & Pages"** in the left sidebar
3. If this is your first worker, you may need to set up a Workers subdomain
4. Click **"Create application"**
5. Select **"Create Worker"**

### Step 2: Create the Worker
1. **Worker Name**: Enter `teppek-tile-proxy`
2. Click **"Deploy"** to create the basic worker
3. Click **"Edit code"** to open the editor

### Step 3: Deploy the Worker Code
1. **Delete the default code** in the editor
2. **Copy and paste** the entire content from `cloudflare-worker-teppek.js`
3. Click **"Save and Deploy"**
4. Wait for the deployment to complete (usually 10-30 seconds)

### Step 4: Configure Custom Domain (tiles.teppek.com)
1. **Go back to the Workers overview** (click "Back to overview")
2. Click on your worker **"teppek-tile-proxy"**
3. Go to **"Settings"** tab
4. Click **"Triggers"** section
5. Click **"Add Custom Domain"**
6. Enter: `tiles.teppek.com`
7. Click **"Add Custom Domain"**
8. Wait for DNS propagation (5-10 minutes)

### Step 5: Configure DNS (if needed)
If the custom domain setup doesn't automatically create DNS records:

1. **Go to DNS settings**: https://dash.cloudflare.com/7dfd0c43e113e626f0712b7bba438533/teppek.com/dns
2. Click **"Add record"**
3. Configure:
   - **Type**: CNAME
   - **Name**: tiles
   - **Target**: teppek-tile-proxy.your-subdomain.workers.dev
   - **Proxy status**: Proxied (orange cloud)
4. Click **"Save"**

---

## ⚙️ Configuration Options

### Cache Settings (Recommended)
1. Go to **"Caching"** in your CloudFlare dashboard
2. **Page Rules** → **Create Page Rule**
3. **URL Pattern**: `tiles.teppek.com/*`
4. **Settings**:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 7 days
   - Browser Cache TTL: 1 day
5. **Save and Deploy**

### Security Settings
1. Go to **"Security"** → **"Settings"**
2. **Security Level**: Medium (recommended)
3. **Challenge Passage**: 30 minutes
4. **Bot Fight Mode**: On

### Performance Optimizations
1. Go to **"Speed"** → **"Optimization"**
2. **Auto Minify**: Enable JavaScript, CSS, HTML
3. **Rocket Loader**: Off (can interfere with map tiles)
4. **Mirage**: On (for image optimization)
5. **Polish**: Lossy (for image compression)

---

## 🧪 Testing the Deployment

### Test URLs to Verify
Once deployed, test these URLs in your browser:

1. **Health Check**:
   ```
   https://tiles.teppek.com/health
   ```
   Should return JSON with service status

2. **Sample Tile (OpenStreetMap)**:
   ```
   https://tiles.teppek.com/osm/1/0/0.png
   ```
   Should return a map tile image

3. **Sample Satellite Tile**:
   ```
   https://tiles.teppek.com/satellite/1/0/0.jpg
   ```
   Should return a satellite image tile

### Verify CORS Headers
Open your browser's Developer Tools and check the Network tab when your React app loads tiles. You should see:
- `Access-Control-Allow-Origin: https://teppek.com`
- `X-Cache-Status: HIT` or `MISS`
- `X-Response-Time: XXXms`

---

## 📊 Monitoring and Analytics

### CloudFlare Analytics
1. Go to **"Analytics & Logs"** in your dashboard
2. Monitor:
   - **Requests**: Total tile requests
   - **Bandwidth**: Data transferred
   - **Cache Hit Ratio**: Efficiency of caching
   - **Response Time**: Performance metrics

### Worker Analytics
1. Go to **"Workers & Pages"** → **"teppek-tile-proxy"** → **"Metrics"**
2. Monitor:
   - **Invocations**: Number of worker executions
   - **Errors**: Failed requests
   - **CPU Time**: Worker performance

### Set Up Alerts (Optional)
1. Go to **"Notifications"**
2. Create alerts for:
   - High error rate (>5%)
   - Low cache hit ratio (<80%)
   - High response time (>500ms)

---

## 🔧 Updating the Worker

### Code Updates
1. Go to **"Workers & Pages"** → **"teppek-tile-proxy"**
2. Click **"Edit code"**
3. Make your changes
4. Click **"Save and Deploy"**
5. Test the changes using the test URLs above

### Configuration Changes
Update the configuration constants in the worker code:
- `TILE_PROVIDERS`: Add/modify tile sources
- `CACHE_CONFIG`: Adjust caching behavior
- `CORS_CONFIG`: Modify CORS settings

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. "Worker not found" Error
- **Solution**: Check if the custom domain is properly configured
- **Check**: DNS settings and wait for propagation

#### 2. CORS Errors in Browser
- **Solution**: Verify the origin is in `CORS_CONFIG.allowedOrigins`
- **Check**: Browser console for specific CORS error messages

#### 3. Tiles Not Loading
- **Solution**: Test the health check endpoint first
- **Check**: CloudFlare Workers logs for errors

#### 4. Slow Performance
- **Solution**: Check cache hit ratio in analytics
- **Check**: Consider increasing cache TTL values

#### 5. SSL Certificate Issues
- **Solution**: Ensure "Proxied" status is enabled for tiles subdomain
- **Check**: SSL/TLS settings are set to "Full" or "Full (strict)"

### Debug Mode
Add debug headers by temporarily modifying the worker:
```javascript
response.headers.set('X-Debug-Info', JSON.stringify({
  provider,
  zoom: z,
  tileX: x,
  tileY: y,
  cacheStatus,
  upstreamUrl
}));
```

---

## 🎯 Expected Performance Results

### Cache Hit Rates
- **First hour**: 20-40% (cache warming)
- **After 24 hours**: 80-95% (optimal)
- **Peak usage**: 90%+ (steady state)

### Response Times
- **Cache HIT**: 10-50ms
- **Cache MISS**: 200-800ms (depends on upstream)
- **Error responses**: <100ms

### Data Transfer Savings
- **Bandwidth reduction**: 60-80% (due to caching)
- **Origin server load**: Reduced by 80-95%

---

## 🔒 Security Considerations

### Origin Validation
The worker only accepts requests from:
- `https://teppek.com`
- `https://www.teppek.com`
- `https://teppek.vercel.app`
- `http://localhost:*` (development only)

### Rate Limiting
Consider adding CloudFlare rate limiting:
1. Go to **"Security"** → **"WAF"**
2. Create custom rule for `tiles.teppek.com`
3. Set limit: 1000 requests per minute per IP

### DDoS Protection
CloudFlare's DDoS protection is automatically enabled for the worker.

---

## 📈 Optimization Tips

### For High Traffic
1. **Increase cache TTL** to 30 days for static tiles
2. **Enable Argo Smart Routing** for better performance
3. **Use CloudFlare Images** for advanced image optimization

### For Development
1. Add your local development origins to CORS config
2. Use shorter cache TTL during testing
3. Enable debug headers temporarily

### For Production
1. Remove localhost origins from CORS
2. Set up proper monitoring and alerts
3. Consider upgrading to Workers Paid plan for better performance

---

## 📞 Support

### CloudFlare Resources
- **Documentation**: https://developers.cloudflare.com/workers/
- **Community**: https://community.cloudflare.com/
- **Support**: Available through your CloudFlare dashboard

### Worker-Specific Help
- **Logs**: Available in Workers dashboard under "Logs"
- **Metrics**: Real-time performance data
- **Error Tracking**: Automatic error collection

---

## ✅ Post-Deployment Checklist

- [ ] Worker deployed successfully
- [ ] Custom domain `tiles.teppek.com` configured
- [ ] DNS records created and propagated
- [ ] Health check returns 200 status
- [ ] Sample tiles load correctly
- [ ] CORS headers present in responses
- [ ] React app successfully loads tiles
- [ ] Cache hit ratio >50% within 24 hours
- [ ] No JavaScript errors in browser console
- [ ] Monitoring and alerts configured

---

## 🎉 You're Done!

Your tile proxy service is now live at `tiles.teppek.com` and optimized for:
- ⚡ Fast loading with CloudFlare's global CDN
- 🚀 7-day aggressive caching
- 🌍 Turkey/Europe region optimization
- 📱 Mobile and desktop support
- 🔒 CORS security for your React app
- 📊 Built-in analytics and monitoring

The service will automatically handle millions of tile requests with excellent performance!