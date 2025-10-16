#!/bin/bash

# LabourLink Startup Script
echo "🚀 Starting LabourLink Application..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   - On macOS: brew services start mongodb-community"
    echo "   - On Ubuntu: sudo systemctl start mongod"
    echo "   - On Windows: net start MongoDB"
    echo ""
    echo "Starting MongoDB..."
    
    # Try to start MongoDB (this might not work on all systems)
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
    else
        echo "Please start MongoDB manually and run this script again."
        exit 1
    fi
fi

# Wait a moment for MongoDB to start
sleep 2

# Check if MongoDB is accessible
if ! mongo --eval "db.runCommand('ping')" &> /dev/null; then
    echo "❌ MongoDB is not accessible. Please check your MongoDB installation."
    exit 1
fi

echo "✅ MongoDB is running"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "🎯 Starting LabourLink..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

npm run dev