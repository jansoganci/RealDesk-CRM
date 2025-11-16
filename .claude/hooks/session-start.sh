#!/bin/bash
# Session Start Hook for Real Estate CRM
# This runs automatically when you start a Claude Code session

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏢 Real Estate CRM - Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📅 $(date '+%A, %B %d, %Y at %I:%M %p')"
echo ""

# ============================================================================
# 1. Check Environment Variables
# ============================================================================
echo "🔍 Checking Environment..."
if [ -f ".env" ]; then
  echo "  ✅ .env file found"

  # Check if required variables exist
  if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo "  ✅ Supabase configuration detected"
  else
    echo "  ⚠️  Warning: Missing Supabase configuration in .env"
    echo "     Add: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  fi
else
  echo "  ❌ Missing .env file!"
  echo "     Create .env and add your Supabase credentials"
  echo "     See README.md for setup instructions"
fi
echo ""

# ============================================================================
# 2. Check Dependencies
# ============================================================================
echo "📦 Checking Dependencies..."
if [ -d "node_modules" ]; then
  echo "  ✅ node_modules installed"

  # Check if package.json was updated more recently than node_modules
  if [ "package.json" -nt "node_modules" ]; then
    echo "  ⚠️  package.json is newer than node_modules"
    echo "     Run: npm install"
  fi
else
  echo "  ❌ node_modules not found!"
  echo "     Run: npm install"
fi
echo ""

# ============================================================================
# 3. Git Status
# ============================================================================
echo "📍 Git Status..."
if [ -d ".git" ]; then
  BRANCH=$(git branch --show-current)
  echo "  Branch: $BRANCH"

  # Warn if on main/master
  if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    echo "  ⚠️  You're on the main branch!"
    echo "     Consider creating a feature branch: git checkout -b feature/your-feature"
  fi

  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "  📝 You have uncommitted changes"
  else
    echo "  ✅ Working directory clean"
  fi
else
  echo "  ℹ️  Not a git repository"
fi
echo ""

# ============================================================================
# 4. Database Migrations Check
# ============================================================================
echo "🗄️  Database..."
MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l)
echo "  Found $MIGRATION_COUNT migration files"
echo "  Remember: Run 'supabase db push' to apply migrations"
echo ""

# ============================================================================
# 5. Quick Commands Reference
# ============================================================================
echo "⚡ Quick Commands:"
echo "  /add-feature       - Generate complete feature boilerplate"
echo "  /add-migration     - Create database migration with RLS"
echo "  /add-service       - Generate service class"
echo "  /add-component     - Create React component"
echo "  /add-form          - Generate form with validation"
echo "  /add-translation   - Add i18n translation keys"
echo "  /review-rls        - Security audit for RLS policies"
echo ""

# ============================================================================
# 6. Helpful Reminders
# ============================================================================
echo "💡 Remember:"
echo "  • Always inject user_id in services for RLS security"
echo "  • Update both TR and EN translations"
echo "  • Test on mobile (375px) and desktop (1024px+)"
echo "  • Run 'npm run typecheck' before committing"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Ready to build amazing features! Happy coding! 🚀"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
