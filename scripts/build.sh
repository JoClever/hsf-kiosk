#!/bin/bash

# HSF Kiosk - Build Script
# This script builds the frontend for production

set -e

echo "🔨 Building HSF Kiosk for production..."

# Build frontend
echo ""
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

echo ""
echo "✅ Build complete!"
echo "Frontend build is in: frontend/dist/"
