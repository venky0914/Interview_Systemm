#!/bin/bash

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   InterviewForge AI - Deployment Script                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

if ! command -v git &> /dev/null; then
    echo "Git is required but not installed. Exiting."
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites installed${NC}"
echo ""

# Push to GitHub
echo -e "${BLUE}Pushing latest code to GitHub...${NC}"
git push origin project-implementation
echo -e "${GREEN}✓ Code pushed to GitHub${NC}"
echo ""

# Deploy Frontend
echo -e "${BLUE}Deploying Frontend to Vercel...${NC}"
echo "Instructions:"
echo "1. Run: cd frontend && vercel --prod"
echo "2. Follow the Vercel prompts"
echo "3. When asked for environment variables, set:"
echo "   NEXT_PUBLIC_API_URL=https://api.interviewforge.com"
echo ""
echo "Waiting for manual deployment..."
echo "Once deployed, your frontend will be available at:"
echo "→ https://interviewforge.vercel.app"
echo ""

# Deploy Backend
echo -e "${BLUE}Backend Deployment Instructions${NC}"
echo "Option 1: Deploy to Render"
echo "1. Go to https://render.com/dashboard"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Select 'backend' directory"
echo "5. Use the render.yaml configuration"
echo "6. Set all environment variables"
echo "7. Deploy!"
echo ""
echo "Option 2: Deploy to Railway"
echo "1. Go to https://railway.app"
echo "2. Click 'New Project' → 'Deploy from GitHub'"
echo "3. Select this repository"
echo "4. Configure environment variables"
echo "5. Deploy!"
echo ""

echo -e "${YELLOW}DEPLOYMENT CHECKLIST:${NC}"
echo "[ ] Frontend deployed to Vercel"
echo "[ ] Backend deployed to Render/Railway"
echo "[ ] PostgreSQL database created (AWS RDS or Neon)"
echo "[ ] Redis instance created (Redis Cloud or Upstash)"
echo "[ ] AWS S3 bucket configured"
echo "[ ] Environment variables set for all services"
echo "[ ] DNS records updated (if using custom domain)"
echo "[ ] Frontend and Backend can communicate"
echo "[ ] User can register and login"
echo "[ ] Quiz system working end-to-end"
echo ""

echo -e "${GREEN}Deployment script complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Follow the Vercel and Render deployment instructions above"
echo "2. Set up your database and Redis"
echo "3. Configure AWS S3"
echo "4. Test the application"
echo "5. Set up monitoring and logging"
