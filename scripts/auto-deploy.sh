#!/bin/bash

echo "🚀 Auto-deploying to teppek.com domains..."

# Deploy to Vercel (--yes parametresi kaldırıldı)
DEPLOYMENT_URL=$(vercel --prod 2>/dev/null | tail -1)

if [ ! -z "$DEPLOYMENT_URL" ]; then
    echo "📦 Deployment URL: $DEPLOYMENT_URL"
    
    # Set aliases
    echo "🔗 Setting teppek.com alias..."
    vercel alias set $DEPLOYMENT_URL teppek.com
    
    echo "🔗 Setting teppek.vercel.app alias..."  
    vercel alias set $DEPLOYMENT_URL teppek.vercel.app
    
    echo "✅ Success! Dashboard now available at:"
    echo "   🌐 https://teppek.com"
    echo "   🌐 https://teppek.vercel.app"
else
    echo "❌ Deployment failed!"
    exit 1
fi