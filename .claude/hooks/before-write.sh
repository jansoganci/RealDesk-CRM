#!/bin/bash
# Before Write Hook - Runs checks before editing files
# This runs BEFORE Claude writes/edits any file

FILE_PATH="$1"

# If no file path provided, exit safely
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

echo "✏️  Preparing to edit: $FILE_PATH"

# ============================================================================
# TypeScript/JavaScript Files - Type Checking
# ============================================================================
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]] || [[ "$FILE_PATH" == *.js ]] || [[ "$FILE_PATH" == *.jsx ]]; then

  # Check if this is a new file (doesn't exist yet)
  if [ ! -f "$FILE_PATH" ]; then
    echo "  📝 New file - will be created"
    exit 0  # Skip checks for new files
  fi

  # Only run type check if tsconfig exists and node_modules is installed
  if [ -f "tsconfig.json" ] && [ -d "node_modules" ]; then
    echo "  🔍 Running TypeScript type check..."

    # Run type check (silently, we just care about exit code)
    if npm run typecheck --silent > /dev/null 2>&1; then
      echo "  ✅ No type errors found"
    else
      echo ""
      echo "  ⚠️  TypeScript errors detected in the project!"
      echo "     (Continuing anyway - you can fix them later)"
      echo ""
    fi
  fi
fi

# ============================================================================
# Service Files - Reminder about user_id
# ============================================================================
if [[ "$FILE_PATH" == src/services/*.service.ts ]]; then
  echo ""
  echo "  💡 Service File Reminder:"
  echo "     • Always inject user_id using getAuthenticatedUserId()"
  echo "     • Use insertRow() and updateRow() helpers"
  echo "     • Add to serviceProxy.ts if it's a new service"
  echo ""
fi

# ============================================================================
# Migration Files - Reminder about RLS
# ============================================================================
if [[ "$FILE_PATH" == supabase/migrations/*.sql ]]; then
  echo ""
  echo "  💡 Migration File Reminder:"
  echo "     • Include user_id column (uuid NOT NULL)"
  echo "     • Enable RLS: ALTER TABLE ... ENABLE ROW LEVEL SECURITY;"
  echo "     • Create all 4 policies (SELECT, INSERT, UPDATE, DELETE)"
  echo "     • Use auth.uid() = user_id in policies"
  echo "     • Create index on user_id for performance"
  echo ""
fi

# ============================================================================
# Component Files - Reminder about design system
# ============================================================================
if [[ "$FILE_PATH" == src/components/* ]] || [[ "$FILE_PATH" == src/features/* ]]; then
  if [[ "$FILE_PATH" == *.tsx ]] || [[ "$FILE_PATH" == *.jsx ]]; then
    echo ""
    echo "  💡 Component Reminder:"
    echo "     • Use COLORS from config/colors.ts"
    echo "     • Mobile-first: h-11 md:h-9 for touch targets"
    echo "     • Use useTranslation() for all text"
    echo "     • Update TR and EN translation files"
    echo ""
  fi
fi

# ============================================================================
# Translation Files - Reminder about both languages
# ============================================================================
if [[ "$FILE_PATH" == public/locales/tr/*.json ]]; then
  EN_FILE="${FILE_PATH/\/tr\//\/en\/}"
  echo ""
  echo "  💡 Translation Reminder:"
  echo "     Turkish file: $FILE_PATH"
  echo "     English file: $EN_FILE"
  echo "     • Update BOTH files with the same keys!"
  echo ""
fi

if [[ "$FILE_PATH" == public/locales/en/*.json ]]; then
  TR_FILE="${FILE_PATH/\/en\//\/tr\/}"
  echo ""
  echo "  💡 Translation Reminder:"
  echo "     English file: $FILE_PATH"
  echo "     Turkish file: $TR_FILE"
  echo "     • Update BOTH files with the same keys!"
  echo ""
fi

# ============================================================================
# Configuration Files - Warning
# ============================================================================
CONFIG_FILES=(
  "package.json"
  "tsconfig.json"
  "vite.config.ts"
  "tailwind.config.js"
  ".env"
)

for config in "${CONFIG_FILES[@]}"; do
  if [[ "$FILE_PATH" == "$config" ]]; then
    echo ""
    echo "  ⚠️  Editing configuration file: $config"
    echo "     Be careful - changes here affect the entire project!"
    echo ""
  fi
done

echo "  ✅ Ready to edit"
exit 0  # Allow the edit
