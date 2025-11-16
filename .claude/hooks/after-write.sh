#!/bin/bash
# After Write Hook - Runs cleanup after editing files
# This runs AFTER Claude writes/edits any file

FILE_PATH="$1"

# If no file path provided, exit safely
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

echo "✨ Post-processing: $FILE_PATH"

# Only process if file exists
if [ ! -f "$FILE_PATH" ]; then
  echo "  ⚠️  File not found, skipping post-processing"
  exit 0
fi

# ============================================================================
# TypeScript/JavaScript Files - Auto-formatting & Linting
# ============================================================================
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]] || [[ "$FILE_PATH" == *.js ]] || [[ "$FILE_PATH" == *.jsx ]]; then

  # Check if node_modules exists (required for prettier/eslint)
  if [ ! -d "node_modules" ]; then
    echo "  ⚠️  node_modules not found, skipping formatting"
    exit 0
  fi

  # Auto-format with Prettier (if available)
  if [ -f "node_modules/.bin/prettier" ]; then
    echo "  🎨 Formatting with Prettier..."
    npx prettier --write "$FILE_PATH" --log-level silent
    if [ $? -eq 0 ]; then
      echo "  ✅ Code formatted"
    else
      echo "  ⚠️  Prettier had issues (continuing anyway)"
    fi
  fi

  # Run ESLint auto-fix (if available)
  if [ -f "node_modules/.bin/eslint" ] && [ -f "eslint.config.js" -o -f ".eslintrc.json" -o -f ".eslintrc.js" ]; then
    echo "  🔍 Running ESLint auto-fix..."
    npx eslint "$FILE_PATH" --fix --quiet
    if [ $? -eq 0 ]; then
      echo "  ✅ Linting complete"
    else
      echo "  ⚠️  ESLint found some issues (check manually)"
    fi
  fi

fi

# ============================================================================
# JSON Files - Validate & Format
# ============================================================================
if [[ "$FILE_PATH" == *.json ]]; then

  # Validate JSON syntax
  echo "  🔍 Validating JSON syntax..."
  if python3 -m json.tool "$FILE_PATH" > /dev/null 2>&1; then
    echo "  ✅ Valid JSON"

    # Format JSON with prettier if available
    if [ -d "node_modules" ] && [ -f "node_modules/.bin/prettier" ]; then
      echo "  🎨 Formatting JSON..."
      npx prettier --write "$FILE_PATH" --log-level silent
      echo "  ✅ JSON formatted"
    fi
  else
    echo "  ❌ Invalid JSON syntax!"
    echo "     Please fix syntax errors in: $FILE_PATH"
  fi

fi

# ============================================================================
# SQL Migration Files - Validation
# ============================================================================
if [[ "$FILE_PATH" == supabase/migrations/*.sql ]]; then

  echo "  🗄️  Database migration file detected"
  echo ""
  echo "  📋 Post-migration checklist:"
  echo "     • Run: supabase db push (to apply migration)"
  echo "     • Generate types: npx supabase gen types typescript --project-id YOUR_ID"
  echo "     • Update src/types/database.ts with new types"
  echo "     • Test RLS policies with different users"
  echo ""

fi

# ============================================================================
# Service Files - Remind about service proxy
# ============================================================================
if [[ "$FILE_PATH" == src/services/*.service.ts ]]; then

  # Check if this file is in serviceProxy.ts
  SERVICE_NAME=$(basename "$FILE_PATH" .service.ts)

  if grep -q "${SERVICE_NAME}Service" "src/lib/serviceProxy.ts" 2>/dev/null; then
    echo "  ✅ Service found in serviceProxy.ts"
  else
    echo ""
    echo "  ⚠️  This service may not be in serviceProxy.ts!"
    echo "     Add it to src/lib/serviceProxy.ts to enable demo mode"
    echo ""
  fi

fi

# ============================================================================
# Translation Files - Check counterpart exists
# ============================================================================
if [[ "$FILE_PATH" == public/locales/tr/*.json ]]; then
  EN_FILE="${FILE_PATH/\/tr\//\/en\/}"

  if [ -f "$EN_FILE" ]; then
    echo "  ✅ English translation file exists"
  else
    echo ""
    echo "  ⚠️  Missing English translation!"
    echo "     Create: $EN_FILE"
    echo "     Copy the same keys from Turkish and translate"
    echo ""
  fi
fi

if [[ "$FILE_PATH" == public/locales/en/*.json ]]; then
  TR_FILE="${FILE_PATH/\/en\//\/tr\/}"

  if [ -f "$TR_FILE" ]; then
    echo "  ✅ Turkish translation file exists"
  else
    echo ""
    echo "  ⚠️  Missing Turkish translation!"
    echo "     Create: $TR_FILE"
    echo "     Copy the same keys from English and translate"
    echo ""
  fi
fi

# ============================================================================
# React Component Files - Remind about imports and routes
# ============================================================================
if [[ "$FILE_PATH" == src/features/*/[A-Z]*.tsx ]]; then

  # Extract feature name and component name
  FEATURE_DIR=$(echo "$FILE_PATH" | sed -E 's|src/features/([^/]+)/.*|\1|')
  COMPONENT_NAME=$(basename "$FILE_PATH" .tsx)

  echo ""
  echo "  📋 Component checklist:"
  echo "     • Add to src/App.tsx if it's a page component"
  echo "     • Add to src/components/layout/Sidebar.tsx for navigation"
  echo "     • Create translation files: public/locales/{tr,en}/${FEATURE_DIR}.json"
  echo "     • Update navigation.json with menu item"
  echo ""

fi

echo "  ✨ Processing complete!"
exit 0
