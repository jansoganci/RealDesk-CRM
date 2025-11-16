# Agentic System - Quick Start Guide

## 🚀 How to Activate

### Method 1: Direct Prompt (Recommended)
Copy and paste this into Claude Code:

```
I want to activate the Agentic Development System for this Real Estate CRM project.

Please read and internalize the system prompt from:
.claude/AGENTIC_SYSTEM.md

Then load the project context from:
- claude.md (technical documentation)
- supabase/migrations/*.sql (database schema)
- src/services/*.ts (service patterns)
- src/config/colors.ts (design system)

Once loaded, confirm you're ready by showing me:
1. Available specialist agents
2. Current project capabilities
3. Example commands I can give you
```

### Method 2: Skill-based Activation (Future)
Once skills are set up, simply type:
```
@activate-agents
```

---

## 💬 Example Commands

### Simple Requests
```
"Add tenant credit score tracking"
→ Agents: Architecture → Code → Product → Security → Automation
→ Result: Complete feature in 5-10 minutes

"Fix missing RLS policy on contracts"
→ Agent: Security → Automation
→ Result: Fixed in 2 minutes

"Add Turkish and English translations for appointments"
→ Agent: Product → Automation
→ Result: Done in 1 minute
```

### Complex Requests
```
"Add property inquiry matching system with automatic scoring"
→ Product Agent scopes the feature first (MVP vs Future)
→ Architecture creates tables
→ Code builds services and UI
→ Product adds translations
→ Security audits everything
→ Automation deploys

"Build a tenant payment history feature with installment tracking"
→ Full agent orchestration
→ Multi-table schema
→ Complex UI components
→ Complete in 15-20 minutes
```

### Audit Requests
```
"Review security on all financial tables"
→ Security Agent audits expense_categories, financial_transactions, recurring_expenses
→ Generates report with fixes

"Check if all components use the design system"
→ Product Agent scans components
→ Reports violations with auto-fixes
```

---

## 🎯 What Each Agent Does (Simple Explanation)

### Architecture Agent 🏗️
**You say**: "I need a table for X"
**Agent does**: Creates migration with security built-in (RLS, user_id, indexes)

### Code Agent 💻
**You say**: "Build the service and UI for X"
**Agent does**: Generates TypeScript service + React components following your patterns

### Product Agent 🎨
**You say**: "Add translations for X"
**Agent does**: Creates both Turkish and English translations with same keys

### Security Agent 🛡️
**You say**: "Is my database secure?"
**Agent does**: Audits RLS policies, user_id injection, finds vulnerabilities + fixes them

### Automation Agent ⚙️
**You say**: "Deploy this"
**Agent does**: Runs migrations, type checks, linting, commits to git, pushes to remote

---

## 📋 Agent Decision Tree

The orchestrator automatically decides which agents to use:

```
User Request: "Add [new feature]"
├─ Has database changes? YES
│  └─ Architecture Agent (create migration)
├─ Has code changes? YES
│  └─ Code Agent (service + components)
├─ Has UI? YES
│  └─ Product Agent (translations)
├─ ALWAYS
│  ├─ Security Agent (audit)
│  └─ Automation Agent (deploy)

User Request: "Fix bug in [component]"
├─ Code Agent (fix the bug)
├─ Security Agent (check if fix is secure)
└─ Automation Agent (commit + deploy)

User Request: "Security review"
└─ Security Agent only
```

You don't need to specify which agents - the orchestrator figures it out!

---

## ✅ Success Indicators

You'll know the system is working when you see:

**1. Agent Identification**
```
Analyzing request...
Agents required: Architecture → Code → Product → Security → Automation
Execution plan created.
```

**2. Context Loading**
```
Loading project context...
✅ Database schema loaded (32 migrations, 12 tables)
✅ Service patterns loaded (11 services)
✅ Design system loaded
✅ Translations loaded (TR/EN)
Context ready.
```

**3. Agent Execution**
```
[Architecture Agent] Creating migration...
✅ Created: supabase/migrations/20251117_create_tenant_scores.sql
Validation: ✅ RLS enabled, all policies present

[Code Agent] Generating service...
✅ Created: src/services/tenantScores.service.ts
Validation: ✅ TypeScript compiles, user_id injection present

[Product Agent] Adding translations...
✅ Updated: public/locales/tr/tenants.json
✅ Updated: public/locales/en/tenants.json
Validation: ✅ Keys match in both files

[Security Agent] Running audit...
Security Score: 10/10
✅ No issues found

[Automation Agent] Deploying...
✅ Migration applied
✅ Committed: abc123f
✅ Pushed to: feature/tenant-scoring

Total time: 6 minutes
```

---

## 🚨 When Things Go Wrong

### Agent Reports Error
```
[Security Agent] ❌ Critical issue found
Issue: Missing UPDATE policy on contracts table
Location: supabase/migrations/20251027_create_contracts.sql

Auto-generated fix:
CREATE POLICY "Users can update their own contracts"...

Apply this fix? [Yes/No]
```

**What to do**: Type "Yes" to auto-fix, or "No" to review manually

### Validation Fails
```
[Code Agent] ❌ Validation failed
Error: TypeScript compilation failed
File: src/services/newService.service.ts:15
Issue: Type 'string | undefined' is not assignable to type 'string'

Suggested fix: Add null check before usage
```

**What to do**: Agent will attempt auto-fix or ask for clarification

### Rollback Triggered
```
[Automation Agent] ❌ Migration failed
Reason: Foreign key constraint violation
Action: Rolling back all changes...

✅ Rollback complete
✅ Database restored to previous state
✅ No code committed

Suggestion: Check existing data in 'tenants' table for orphaned records
```

**What to do**: Fix the underlying issue before retrying

---

## 🎓 Best Practices

### DO:
✅ Use natural language ("Add X", "Fix Y", "Review Z")
✅ Let agents determine the execution plan
✅ Trust agent validations (they enforce quality)
✅ Review auto-generated fixes before applying
✅ Test locally after agent deployment

### DON'T:
❌ Manually specify agent sequence (orchestrator handles it)
❌ Skip security audits (always included automatically)
❌ Bypass validation errors (they prevent bugs)
❌ Ignore rollback warnings (they protect your data)

---

## 📊 Performance Benchmarks

| Task | Manual Time | Agent Time | Savings |
|------|-------------|------------|---------|
| Simple feature (1 table + UI) | 2-3 hours | 5-10 min | ~95% |
| Bug fix + security check | 30 min | 2-5 min | ~90% |
| Database migration + RLS | 45 min | 3-5 min | ~92% |
| Add translations (TR + EN) | 15 min | 1 min | ~93% |
| Security audit (all tables) | 2 hours | 5 min | ~96% |
| Complex feature (multi-table) | 6-8 hours | 15-20 min | ~95% |

**Average time savings**: **90-95%**

---

## 🔧 Troubleshooting

### "Agent not responding"
- Ensure `.claude/AGENTIC_SYSTEM.md` exists
- Try re-activating with the activation prompt
- Check if you have the latest `claude.md` documentation

### "Context loading failed"
- Verify `claude.md` exists in project root
- Check `supabase/migrations/` directory has files
- Ensure `src/services/` has service files

### "Validation always failing"
- Check TypeScript configuration (`tsconfig.json`)
- Run `npm install` to ensure dependencies installed
- Verify ESLint config exists

### "Agents creating wrong code"
- Provide more context in your request
- Reference existing patterns explicitly
- Check `claude.md` for current patterns

---

## 📞 Getting Help

### System Status Check
```
"Show me the current agentic system status"
→ Lists available agents, loaded context, ready state
```

### Agent Capabilities
```
"What can the Architecture Agent do?"
→ Shows capabilities, tools, validation rules
```

### Force Re-plan
```
"Re-plan this request: [your request]"
→ Orchestrator analyzes again and shows execution plan without executing
```

---

## 🎯 Quick Reference

### Common Commands
```bash
# Natural language - let orchestrator decide
"Add customer feedback tracking"
"Fix the RLS policy on properties"
"Create a report generation feature"
"Review all services for security issues"

# Scoped requests - specific agent
"Just generate the migration for X" → Architecture Agent
"Just add translations for Y" → Product Agent
"Just audit security" → Security Agent
```

### Activation Status
```bash
# Check if activated
"Is the agentic system active?"

# Show loaded context
"What project context is loaded?"

# List available agents
"Show me all available agents"
```

---

## 🚀 Ready to Start

To activate the system, simply say:

```
Activate agentic system and load Real Estate CRM context
```

Then start making requests like:

```
"Add a tenant document storage feature with file upload"
```

The orchestrator handles the rest! 🎉

---

**Last Updated**: 2025-11-16
**Version**: 1.0
**Project**: Real Estate CRM Agentic Development System
