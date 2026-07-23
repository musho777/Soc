#!/bin/bash

# Social Network API - Setup Script
# This script helps you set up the development environment

set -e

echo "🚀 Social Network API - Setup Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js $NODE_VERSION installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm $NPM_VERSION installed${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please update the .env file with your configuration${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
fi
echo ""

# Check if PostgreSQL is installed
echo "Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    echo -e "${GREEN}✅ PostgreSQL installed: $PG_VERSION${NC}"

    # Ask if user wants to create the database
    echo ""
    read -p "Do you want to create the database now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        DB_NAME=${DB_NAME:-social_network}

        # Create database
        echo "Creating database: $DB_NAME..."
        createdb $DB_NAME 2>/dev/null || echo -e "${YELLOW}⚠️  Database might already exist${NC}"

        # Run schema
        echo "Running database schema..."
        psql -d $DB_NAME -f src/database/schema/001_initial_schema.sql
        echo -e "${GREEN}✅ Database schema applied${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL not found locally${NC}"
    echo "You can use Docker Compose instead: docker-compose up -d"
fi
echo ""

# Check if Docker is installed
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker installed: $DOCKER_VERSION${NC}"

    # Ask if user wants to use Docker Compose
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✅ Docker Compose installed${NC}"
        echo ""
        echo "You can start the full stack with:"
        echo "  docker-compose up -d"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not installed (optional)${NC}"
fi
echo ""

# Setup complete
echo "======================================"
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Update .env file with your configuration"
echo ""
echo "2. Choose one of the following options:"
echo ""
echo "   Option A - Local Development:"
echo "   $ npm run start:dev"
echo ""
echo "   Option B - Docker Compose:"
echo "   $ docker-compose up -d"
echo ""
echo "3. Access the application:"
echo "   - API: http://localhost:3000/api/v1"
echo "   - Swagger Docs: http://localhost:3000/api/docs"
echo "   - Health: http://localhost:3000/api/v1/health"
echo ""
echo "4. Read the documentation:"
echo "   - Quick Start: QUICKSTART.md"
echo "   - Full Docs: README.md"
echo "   - Architecture: ARCHITECTURE.md"
echo ""
echo "======================================"
echo "Happy coding! 🎉"
