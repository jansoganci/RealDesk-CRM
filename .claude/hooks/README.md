# Claude Code Hooks Documentation

This directory contains **hooks** - automatic scripts that run at specific moments during your development workflow with Claude Code.

## 🎯 What are Hooks?

Hooks are like **automatic helpers** that:
- ✅ Run checks before/after actions
- 🛡️ Protect you from mistakes
- 🎨 Auto-format and clean up code
- 💡 Give you helpful reminders
- ⚡ Save you time on repetitive tasks

---

## 📁 Available Hooks

### 1. **session-start.sh** ⭐
**When it runs**: Automatically when you start a Claude Code session

**What it does**:
- ✅ Checks if `.env` file exists and has Supabase config
- ✅ Checks if `node_modules` is installed
- ✅ Shows your current git branch and status
- ✅ Warns if you're on the main branch
- ✅ Shows count of database migrations
- ✅ Displays quick command reference
- ✅ Shows helpful reminders

**Example output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Real Estate CRM - Development Environment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Monday, November 17, 2025 at 09:30 AM

🔍 Checking Environment...
  ✅ .env file found
  ✅ Supabase configuration detected

📦 Checking Dependencies...
  ✅ node_modules installed

📍 Git Status...
  Branch: feature/new-dashboard
  ✅ Working directory clean

🗄️  Database...
  Found 32 migration files
  Remember: Run 'supabase db push' to apply migrations

⚡ Quick Commands:
  /add-feature       - Generate complete feature boilerplate
  /add-migration     - Create database migration with RLS
  ...

✨ Ready to build amazing features! Happy coding! 🚀
```

---

### 2. **before-delete.sh** 🛡️
**When it runs**: BEFORE Claude deletes any file

**What it does**:
- 🚨 **BLOCKS deletion** of critical files (`.env`, `package.json`, config files, etc.)
- ⚠️ **Warns** when deleting from important directories
- ⏱️ **Delays deletion** of database migrations (gives you time to cancel)
- 💡 **Reminds** you to update imports when deleting components/services

**Protected files** (CANNOT be deleted):
- `.env`, `.env.local`, `.env.production`
- `package.json`, `package-lock.json`
- `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`
- `.gitignore`, `README.md`, `claude.md`
- All files in `.claude/commands/` and `.claude/hooks/`

**Protected directories** (requires confirmation):
- `src/config/`
- `src/lib/`
- `src/types/`
- `src/services/`
- `supabase/migrations/`
- `.git/`
- `public/locales/`

**Example - Blocked deletion**:
```
🚨 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 DANGER! Cannot delete protected file!
🚨 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   File: package.json
   Reason: This is a critical configuration file

   If you really need to delete this file:
   1. Do it manually outside of Claude Code
   2. Make sure you know what you're doing!
   3. Have a backup ready
```

---

### 3. **before-write.sh** ✏️
**When it runs**: BEFORE Claude writes/edits any file

**What it does**:
- 🔍 **Runs TypeScript type checking** (for `.ts`/`.tsx` files)
- 💡 **Shows reminders** based on file type:
  - **Service files**: Remind to inject `user_id`, use helpers, add to serviceProxy
  - **Migration files**: Remind about RLS policies and user_id column
  - **Component files**: Remind about design system, i18n, mobile-first
  - **Translation files**: Remind to update both TR and EN files
  - **Config files**: Warning about editing critical configuration

**Example - Service file**:
```
✏️  Preparing to edit: src/services/appointments.service.ts

  💡 Service File Reminder:
     • Always inject user_id using getAuthenticatedUserId()
     • Use insertRow() and updateRow() helpers
     • Add to serviceProxy.ts if it's a new service

  ✅ Ready to edit
```

**Example - Migration file**:
```
✏️  Preparing to edit: supabase/migrations/20251117_create_appointments.sql

  💡 Migration File Reminder:
     • Include user_id column (uuid NOT NULL)
     • Enable RLS: ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
     • Create all 4 policies (SELECT, INSERT, UPDATE, DELETE)
     • Use auth.uid() = user_id in policies
     • Create index on user_id for performance

  ✅ Ready to edit
```

---

### 4. **after-write.sh** ✨
**When it runs**: AFTER Claude writes/edits any file

**What it does**:
- 🎨 **Auto-formats** TypeScript/JavaScript files with Prettier
- 🔍 **Auto-fixes** ESLint issues
- ✅ **Validates** JSON syntax (translation files, config files)
- 📋 **Shows checklists** for migrations, services, components
- ⚠️ **Warns** about missing translation counterparts (TR ↔ EN)

**Example - TypeScript file**:
```
✨ Post-processing: src/components/AppointmentCard.tsx
  🎨 Formatting with Prettier...
  ✅ Code formatted
  🔍 Running ESLint auto-fix...
  ✅ Linting complete
  ✨ Processing complete!
```

**Example - Migration file**:
```
✨ Post-processing: supabase/migrations/20251117_create_appointments.sql
  🗄️  Database migration file detected

  📋 Post-migration checklist:
     • Run: supabase db push (to apply migration)
     • Generate types: npx supabase gen types typescript --project-id YOUR_ID
     • Update src/types/database.ts with new types
     • Test RLS policies with different users

  ✨ Processing complete!
```

**Example - Translation file**:
```
✨ Post-processing: public/locales/tr/appointments.json
  🔍 Validating JSON syntax...
  ✅ Valid JSON
  🎨 Formatting JSON...
  ✅ JSON formatted
  ⚠️  Missing English translation!
     Create: public/locales/en/appointments.json
     Copy the same keys from Turkish and translate

  ✨ Processing complete!
```

---

## 🚀 How to Use

### Automatic Usage
Hooks run **automatically** - you don't need to do anything! Just work normally with Claude Code and the hooks will:
1. Run checks before dangerous operations
2. Give you helpful reminders
3. Auto-format your code
4. Validate your changes

### Manual Testing
You can test hooks manually:

```bash
# Test session start hook
./.claude/hooks/session-start.sh

# Test delete protection
./.claude/hooks/before-delete.sh "package.json"

# Test before-write reminders
./.claude/hooks/before-write.sh "src/services/example.service.ts"

# Test after-write formatting
./.claude/hooks/after-write.sh "src/components/Example.tsx"
```

---

## ⚙️ Configuration

### Disable a Hook Temporarily
If you need to disable a hook temporarily:

```bash
# Rename the hook file (adds .disabled extension)
mv .claude/hooks/before-delete.sh .claude/hooks/before-delete.sh.disabled

# To re-enable:
mv .claude/hooks/before-delete.sh.disabled .claude/hooks/before-delete.sh
```

### Modify Hook Behavior
Hooks are just bash scripts! You can edit them:

```bash
# Edit a hook
nano .claude/hooks/before-write.sh

# Or with your preferred editor
code .claude/hooks/before-write.sh
```

---

## 📚 Hook Execution Order

When Claude performs an action, hooks run in this order:

### Writing/Editing a File:
```
1. before-write.sh    (checks & reminders)
   ↓
2. [Claude edits the file]
   ↓
3. after-write.sh     (formatting & validation)
```

### Deleting a File:
```
1. before-delete.sh   (safety checks)
   ↓
2. [Claude deletes if allowed]
```

### Starting a Session:
```
1. session-start.sh   (environment checks)
   ↓
2. [Normal Claude Code session begins]
```

---

## 🎓 Best Practices

### DO:
- ✅ Let hooks run automatically
- ✅ Read hook messages carefully
- ✅ Follow hook reminders and checklists
- ✅ Customize hooks for your workflow
- ✅ Test hooks after modifying them

### DON'T:
- ❌ Disable all hooks (you'll miss important safety checks)
- ❌ Ignore hook warnings (they're there for a reason!)
- ❌ Delete hook files (they protect your project)
- ❌ Make hooks too slow (keep them under 3 seconds)

---

## 🔧 Troubleshooting

### Hook not running?
1. Check if file is executable:
   ```bash
   chmod +x .claude/hooks/session-start.sh
   ```

2. Check if hook has correct shebang:
   ```bash
   # First line should be:
   #!/bin/bash
   ```

### Hook causing errors?
1. Test hook manually to see error:
   ```bash
   ./.claude/hooks/before-write.sh "test-file.ts"
   ```

2. Check hook logs in Claude Code output

3. Temporarily disable problematic hook:
   ```bash
   mv .claude/hooks/problematic.sh .claude/hooks/problematic.sh.disabled
   ```

### Hook running too slow?
1. Remove expensive operations (like running full test suite)
2. Use `--silent` flags for commands
3. Run checks only for specific file types
4. Cache results when possible

---

## 💡 Ideas for Custom Hooks

Want to create your own hooks? Here are some ideas:

### Development Hooks:
- Run unit tests for changed files
- Check for TODO/FIXME comments
- Validate commit message format
- Check for console.log statements

### Security Hooks:
- Scan for hardcoded secrets
- Check for SQL injection vulnerabilities
- Validate API endpoint security
- Audit RLS policies

### Quality Hooks:
- Measure code complexity
- Check test coverage
- Validate accessibility (a11y)
- Check bundle size impact

---

## 📞 Questions?

If you have questions about hooks:
1. Read this README
2. Test hooks manually to understand their behavior
3. Check hook source code (they're just bash scripts!)
4. Modify hooks to fit your needs

---

**Last Updated**: 2025-11-16
**Project**: Real Estate CRM
**Maintained By**: Development Team

Happy coding with automated helpers! 🚀
