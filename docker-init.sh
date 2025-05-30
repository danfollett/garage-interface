#!/bin/bash

# Docker initialization script
echo "🐳 Initializing Garage Interface with Docker..."

# Check if database exists
if [ ! -f "./database.db" ]; then
    echo "📊 Creating database..."
    cd backend
    npm run init-db
    cd ..
    echo "✅ Database created"
else
    echo "ℹ️  Database already exists"
fi

# Create upload directories if they don't exist
echo "📁 Creating upload directories..."
mkdir -p uploads/vehicles uploads/manuals uploads/videos
echo "✅ Upload directories ready"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "🔧 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created - please edit with your settings"
else
    echo "ℹ️  .env file already exists"
fi

echo "🚀 Ready to start Docker containers!"
echo "Run: docker-compose up -d"