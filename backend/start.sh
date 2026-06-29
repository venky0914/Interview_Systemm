#!/bin/bash

set -e

echo "🚀 Starting InterviewForge AI Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "✓ .env created. Please update with your configuration."
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt || pip install --system -q -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python scripts/init_db.py

# Start backend
echo "✓ Starting Uvicorn server..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
