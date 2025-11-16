#!/bin/bash
# Before Delete Hook - Prevents deletion of critical files
# This runs BEFORE Claude deletes any file

FILE_PATH="$1"

# If no file path provided, exit safely
if [ -z "$FILE_PATH" ]; then
  echo "⚠️  No file path provided to delete hook"
  exit 0
fi

echo "🗑️  Delete request for: $FILE_PATH"

# ============================================================================
# Protected Files - NEVER DELETE THESE
# ============================================================================
PROTECTED_FILES=(
  ".env"
  ".env.local"
  ".env.production"
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "vite.config.ts"
  "tailwind.config.js"
  ".gitignore"
  "README.md"
  "claude.md"
  ".claude/commands/*"
  ".claude/hooks/*"
)

# Check if file matches any protected pattern
for protected in "${PROTECTED_FILES[@]}"; do
  # Convert glob pattern to regex for matching
  if [[ "$FILE_PATH" == $protected ]] || [[ "$FILE_PATH" =~ $protected ]]; then
    echo ""
    echo "🚨 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚨 DANGER! Cannot delete protected file!"
    echo "🚨 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "   File: $FILE_PATH"
    echo "   Reason: This is a critical configuration file"
    echo ""
    echo "   If you really need to delete this file:"
    echo "   1. Do it manually outside of Claude Code"
    echo "   2. Make sure you know what you're doing!"
    echo "   3. Have a backup ready"
    echo ""
    echo "🚨 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1  # Block the deletion
  fi
done

# ============================================================================
# Protected Directories - NEVER DELETE THESE
# ============================================================================
PROTECTED_DIRS=(
  "src/config"
  "src/lib"
  "src/types"
  "src/services"
  "supabase/migrations"
  ".git"
  "node_modules"
  "public/locales"
)

for protected_dir in "${PROTECTED_DIRS[@]}"; do
  if [[ "$FILE_PATH" == "$protected_dir"* ]]; then
    echo ""
    echo "⚠️  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  WARNING: Deleting from protected directory!"
    echo "⚠️  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "   File: $FILE_PATH"
    echo "   Directory: $protected_dir"
    echo ""
    echo "   This directory contains important files."
    echo "   Are you sure you want to delete this?"
    echo ""
    echo "   Press Ctrl+C to cancel, or wait 3 seconds to continue..."
    echo ""
    sleep 3
    echo "   ✅ Continuing with deletion..."
    echo ""
  fi
done

# ============================================================================
# Database Migration Files - Extra Warning
# ============================================================================
if [[ "$FILE_PATH" == supabase/migrations/*.sql ]]; then
  echo ""
  echo "⚠️  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⚠️  DATABASE MIGRATION FILE!"
  echo "⚠️  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "   File: $FILE_PATH"
  echo ""
  echo "   ⚠️  Deleting migration files can cause database issues!"
  echo "   ⚠️  Migrations should almost NEVER be deleted!"
  echo ""
  echo "   Instead, create a new migration to rollback changes."
  echo ""
  echo "   Press Ctrl+C to cancel, or wait 5 seconds to continue..."
  echo ""
  sleep 5
  echo "   ⚠️  Proceeding with deletion (I hope you know what you're doing)..."
  echo ""
fi

# ============================================================================
# Service Files - Confirmation
# ============================================================================
if [[ "$FILE_PATH" == src/services/*.service.ts ]]; then
  echo ""
  echo "📋 Deleting service file: $FILE_PATH"
  echo "   Remember to also remove from:"
  echo "   - src/lib/serviceProxy.ts"
  echo "   - Any components using this service"
  echo ""
fi

# ============================================================================
# Component Files - Confirmation
# ============================================================================
if [[ "$FILE_PATH" == src/features/* ]] || [[ "$FILE_PATH" == src/components/* ]]; then
  echo ""
  echo "📋 Deleting component: $FILE_PATH"
  echo "   Remember to check for:"
  echo "   - Import statements in other files"
  echo "   - Routes in App.tsx"
  echo "   - Navigation items in Sidebar.tsx"
  echo ""
fi

echo "✅ Safe to delete: $FILE_PATH"
exit 0  # Allow the deletion
