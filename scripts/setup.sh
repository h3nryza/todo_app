#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up Oh Right! development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 20+ required. Install from https://nodejs.org"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required. Install from https://docker.com"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required. You have $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ Docker $(docker --version | cut -d' ' -f3)"

# Copy env file if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Created .env from .env.example — edit it with your secrets"
else
  echo "📝 .env already exists"
fi

# Start infrastructure
echo "🐳 Starting Postgres + Redis..."
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 3

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build shared package
echo "🔨 Building shared package..."
npm run build -w @ohright/shared

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate -w @ohright/api

# Seed database (optional)
echo "🌱 Seeding database..."
npm run db:seed -w @ohright/api || echo "⚠️ Seed skipped (may already exist)"

echo ""
echo "✅ Setup complete! Run these commands:"
echo "   npm run dev          — Start all packages in dev mode"
echo "   npm run test         — Run all tests"
echo "   npm run db:studio    — Open Prisma Studio (DB GUI)"
echo ""
