#!/bin/bash
# Church Member Management - Local Server Startup Script

echo "🚀 Starting Church Member Management Local Server..."
echo

# Change to the development directory
cd "$(dirname "$0")"

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    python3 start-server.py
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    python start-server.py
else
    echo "❌ Python not found. Please install Python 3."
    echo "   Visit: https://www.python.org/downloads/"
    exit 1
fi
