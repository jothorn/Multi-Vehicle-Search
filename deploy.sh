#!/bin/bash
set -e

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building the project..."
npm run build

echo "Starting application with pm2..."
npx pm2 restart dist/server.js

echo "Deployment finished."
