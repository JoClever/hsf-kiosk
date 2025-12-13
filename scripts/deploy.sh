#!/bin/bash

# HSF Kiosk - Deploy Script
# This script deploys the application to a production server

set -e

echo "🚀 Deploying HSF Kiosk..."

# Build the frontend
echo ""
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Copy NGINX configuration
echo ""
echo "📋 Copying NGINX configuration..."
sudo cp scripts/nginx.conf /etc/nginx/sites-available/hsf-kiosk
sudo ln -sf /etc/nginx/sites-available/hsf-kiosk /etc/nginx/sites-enabled/hsf-kiosk

# Test NGINX configuration
echo ""
echo "🔍 Testing NGINX configuration..."
sudo nginx -t

# Reload NGINX
echo ""
echo "🔄 Reloading NGINX..."
sudo systemctl reload nginx

# Setup backend service (optional)
# Uncomment if you want to use systemd to manage the backend
# echo ""
# echo "📋 Setting up backend service..."
# sudo cp scripts/hsf-kiosk-backend.service /etc/systemd/system/
# sudo systemctl daemon-reload
# sudo systemctl enable hsf-kiosk-backend
# sudo systemctl restart hsf-kiosk-backend

echo ""
echo "✅ Deployment complete!"
echo "Your application should now be accessible via NGINX"
