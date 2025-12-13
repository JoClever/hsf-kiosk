#!/bin/bash

# HSF Kiosk - Install Script
# This script installs all dependencies for the frontend and backend

set -e

echo "🚀 Installing HSF Kiosk dependencies..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Create .env file for backend if it doesn't exist
if [ ! -f backend/.env ]; then
    echo ""
    echo "📝 Creating backend .env file from example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - please update with your configuration"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "To start the development servers:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
