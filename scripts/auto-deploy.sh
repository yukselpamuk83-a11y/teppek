#!/bin/bash

echo "🚀 Auto-deploying to teppek.com domains..."

# Deploy to Vercel
DEPLOYMENT_URL=$(vercel --prod --yes 2>/dev/null | tail -1)

if [ ! -z "$DEPLOYMENT_URL" ]; then
    echo "📦 Deployment URL: $DEPLOYMENT_URL"
    
    # Set aliases
    echo "🔗 Setting teppek.com alias..."
    vercel alias set $DEPLOYMENT_URL teppek.com --yes
    
    echo "🔗 Setting teppek.vercel.app alias..."  
    vercel alias set $DEPLOYMENT_URL teppek.vercel.app --yes
    
    echo "✅ Success! Dashboard now available at:"
    echo "   🌐 https://teppek.com"
    echo "   🌐 https://teppek.vercel.app"
else
    echo "❌ Deployment failed!"
    exit 1
fi