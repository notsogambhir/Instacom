#!/bin/bash

# InstaCom - Quick Deployment Setup Script
# Generates JWT secrets and creates a deployment checklist

echo "🚀 InstaCom Deployment Setup"
echo "=============================="
echo ""

# Generate JWT secrets
echo "📝 Generating JWT Secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "✅ Secrets generated!"
echo ""
echo "🔐 Copy these values (they will not be shown again):"
echo "------------------------------------------------------"
echo "JWT_SECRET:"
echo "$JWT_SECRET"
echo ""
echo "REFRESH_SECRET:"
echo "$REFRESH_SECRET"
echo "------------------------------------------------------"
echo ""

# Create deployment checklist
echo "📋 Deployment Checklist:"
echo ""
echo "SUPABASE SETUP:"
echo "  [ ] Create Supabase project at supabase.com"
echo "  [ ] Get DATABASE_URL from Settings → Database"
echo "  [ ] Create 'voice-messages' storage bucket"
echo "  [ ] Get SUPABASE_URL and SUPABASE_KEY from Settings → API"
echo ""
echo "RENDER SETUP:"
echo "  [ ] Create Render account at render.com"
echo "  [ ] Create Web Service (connected to GitHub repo)"
echo "  [ ] Set Root Directory: apps/server"
echo "  [ ] Set Build Command: npm install && npx prisma generate"
echo "  [ ] Set Start Command: npm start"
echo "  [ ] Add environment variables (see .env.example)"
echo "  [ ] Run migration via Shell: npx prisma migrate deploy"
echo ""
echo "VERCEL SETUP:"
echo "  [ ] Create Vercel account at vercel.com"
echo "  [ ] Import GitHub repository"
echo "  [ ] Set Root Directory: Webapp"
echo "  [ ] Add VITE_API_URL (Render backend URL)"
echo "  [ ] Add VITE_WS_URL (same as VITE_API_URL)"
echo ""
echo "FINAL STEPS:"
echo "  [ ] Update ALLOWED_ORIGINS in Render (use Vercel URL)"
echo "  [ ] Test login at Vercel URL"
echo "  [ ] Create test users"
echo "  [ ] Test audio functionality"
echo ""
echo "✨ Done! Follow the deployment guide for detailed instructions."
