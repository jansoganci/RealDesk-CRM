# Real Estate CRM - Complete Agentic Infrastructure Overview

## 🎯 System Overview

Your Real Estate CRM now has **TWO PARALLEL AGENTIC SYSTEMS**:

1. **Development Agentic System** (Already Implemented ✅)
   - For AI-assisted development and code generation
   - Used by Claude Code to build features automatically

2. **User-Facing Agentic System** (Design Blueprint Created 📋)
   - For real estate agents to interact with the CRM
   - Natural language interface for daily operations

---

## 📂 Directory Structure

```
.claude/
├── AGENTIC_SYSTEM.md                    # Development agent orchestrator
├── AGENTIC_QUICKSTART.md                # How to activate development agents
├── AGENTIC_EXAMPLES.md                  # Example development workflows
├── AGENTIC_ARCHITECTURE_DIAGRAM.md      # User-facing system diagrams
├── REAL_ESTATE_AGENTIC_SYSTEM.md        # User-facing system design (NEW)
│
├── commands/                             # Slash commands (7 total)
│   ├── add-migration.md                 # /add-migration
│   ├── add-service.md                   # /add-service
│   ├── add-component.md                 # /add-component
│   ├── add-form.md                      # /add-form
│   ├── add-feature.md                   # /add-feature
│   ├── add-translation.md               # /add-translation
│   └── review-rls.md                    # /review-rls
│
└── hooks/                                # Automated scripts (4 hooks)
    ├── README.md                        # Hook documentation
    ├── session-start.sh                 # Runs on session start
    ├── before-write.sh                  # Runs before editing files
    ├── after-write.sh                   # Runs after editing files
    └── before-delete.sh                 # Runs before deleting files
```

---

## 🤖 SYSTEM 1: DEVELOPMENT AGENTIC SYSTEM (Implemented)

This is your **AI development team** that helps build the CRM faster.

### Orchestrator: AI Development Assistant

**Role**: Routes development tasks to specialist agents

**Example Usage**:
```
You: "Add tenant credit score tracking"
→ Orchestrator analyzes: Needs DB + code + UI + i18n
→ Calls agents in sequence:
  1. Architecture Agent (migration)
  2. Code Agent (service + components)
  3. Product Agent (translations)
  4. Security Agent (RLS audit)
  5. Automation Agent (deploy)
→ Result: Complete feature in ~8 minutes
```

### Specialist Agents (5 Development Experts)

#### 1. **Architecture Agent** 🏗️
**Purpose**: Database schema, migrations, RLS policies

**Tools**:
- `/add-migration` slash command

**What it creates**:
- SQL migration files with:
  - Table with `id`, `user_id`, timestamps
  - All 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
  - Indexes on `user_id` and foreign keys
  - Triggers for `updated_at`
  - Comments and documentation

**Example**:
```
You: "Create appointments table"
Architecture Agent →
  ✅ Creates: supabase/migrations/20251117_create_appointments.sql
  ✅ Includes: RLS, indexes, triggers, constraints
  ✅ Security score: 10/10
```

---

#### 2. **Code Agent** 💻
**Purpose**: Services, components, forms, business logic

**Tools**:
- `/add-service` - Generate TypeScript service classes
- `/add-component` - Create React components
- `/add-form` - Build forms with validation

**Patterns Enforced**:
- Service Proxy pattern
- `user_id` injection via `getAuthenticatedUserId()`
- Helper functions: `insertRow()`, `updateRow()`
- Mobile-first design (h-11 md:h-9)
- Design system colors from `src/config/colors.ts`
- No hardcoded text (uses i18n)

**Example**:
```
You: "Create appointments service"
Code Agent →
  ✅ Creates: src/services/appointments.service.ts
  ✅ Methods: getAll(), getById(), create(), update(), delete()
  ✅ Registered in: src/lib/serviceProxy.ts
  ✅ TypeScript: strict mode, no 'any' types
```

---

#### 3. **Product Agent** 🎨
**Purpose**: Translations, UX, design system compliance

**Tools**:
- `/add-translation` - Generate bilingual i18n files

**What it creates**:
- `public/locales/tr/[namespace].json` (Turkish)
- `public/locales/en/[namespace].json` (English)
- Same keys in both files
- Mobile-first UX validation

**Example**:
```
You: "Add translations for appointments"
Product Agent →
  ✅ Created: public/locales/tr/appointments.json
  ✅ Created: public/locales/en/appointments.json
  ✅ Keys matched: 25 translation keys
```

---

#### 4. **Security Agent** 🛡️
**Purpose**: RLS audits, vulnerability scanning, security fixes

**Tools**:
- `/review-rls` - Audit Row Level Security policies

**What it checks**:
- ✅ RLS enabled on all tables
- ✅ All 4 policies exist (SELECT, INSERT, UPDATE, DELETE)
- ✅ Policies use `auth.uid() = user_id`
- ✅ Services inject `user_id` on create
- ✅ No SQL injection vulnerabilities
- ✅ Input validation with Zod schemas
- ✅ No hardcoded secrets

**Output**:
```
Security Score: 10/10
Critical Issues: 0
Warnings: 1 (Missing index on tenant_id)
Auto-fix available: Yes
```

---

#### 5. **Automation Agent** ⚙️
**Purpose**: Migrations, git, quality checks, deployment

**What it does**:
- Runs `supabase db push` to apply migrations
- Generates types: `supabase gen types typescript`
- TypeScript check: `npm run typecheck`
- Linting: `npm run lint`
- Build test: `npm run build`
- Git workflow: branch, commit, push

**Example**:
```
Automation Agent →
  ✅ Migration applied
  ✅ Types generated
  ✅ TypeScript: No errors
  ✅ ESLint: Passed
  ✅ Build: Success
  ✅ Git commit: "[Agents] Add appointments feature"
  ✅ Pushed to: feature/appointments
```

---

### 📜 Slash Commands (7 Commands)

Slash commands are **shortcuts** that activate specific agents with pre-configured templates.

#### Available Commands:

1. **`/add-migration`** → Architecture Agent
   - Creates database migration with RLS
   - Template enforces security patterns

2. **`/add-service`** → Code Agent
   - Generates TypeScript service class
   - Follows Service Proxy pattern

3. **`/add-component`** → Code Agent
   - Creates React component
   - Mobile-first, design system compliant

4. **`/add-form`** → Code Agent
   - Builds form with React Hook Form + Zod
   - Pre-configured validation patterns

5. **`/add-feature`** → Multi-Agent Orchestration
   - Combines migration + service + component + i18n
   - Complete feature boilerplate

6. **`/add-translation`** → Product Agent
   - Creates TR and EN translation files
   - Ensures key consistency

7. **`/review-rls`** → Security Agent
   - Audits Row Level Security
   - Generates auto-fixes

**Usage**:
```
You: "/add-migration appointments"
→ Slash command expands to full prompt
→ Architecture Agent activates
→ Creates migration following template
```

---

### 🪝 Hooks (4 Automated Scripts)

Hooks are **automatic safety guards** that run at specific moments.

#### 1. **session-start.sh** ⭐
**Triggers**: When you start Claude Code

**What it checks**:
- ✅ `.env` file exists (Supabase config)
- ✅ `node_modules` installed
- ✅ Git status and current branch
- ⚠️ Warns if on `main` branch
- 📊 Shows migration count
- 💡 Displays quick command reference

**Output Example**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Real Estate CRM - Development Environment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ .env file found
✅ node_modules installed
📍 Branch: feature/new-dashboard
🗄️  32 migrations found

⚡ Quick Commands:
  /add-feature - Generate complete feature
  /add-migration - Create DB migration
  /review-rls - Audit security

✨ Ready to build! 🚀
```

---

#### 2. **before-delete.sh** 🛡️
**Triggers**: BEFORE deleting any file

**Protected Files (CANNOT DELETE)**:
- ❌ `.env`, `.env.local`, `.env.production`
- ❌ `package.json`, `package-lock.json`
- ❌ `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`
- ❌ `.gitignore`, `README.md`, `claude.md`
- ❌ All `.claude/commands/*.md` and `.claude/hooks/*.sh`

**Protected Directories (REQUIRES CONFIRMATION)**:
- ⚠️ `src/config/`, `src/lib/`, `src/types/`
- ⚠️ `src/services/`
- ⚠️ `supabase/migrations/`
- ⚠️ `public/locales/`

**Example - Blocked**:
```
🚨 DANGER! Cannot delete protected file!
   File: package.json
   Reason: Critical configuration file

   To delete: Do it manually outside Claude Code
```

**Example - Migration Delete Warning**:
```
⚠️  WARNING: Deleting database migration!
   File: 20251117_create_appointments.sql

   ⏱️  You have 5 seconds to cancel (Ctrl+C)...

   This will affect database schema!
   Make sure you rollback this migration first.
```

---

#### 3. **before-write.sh** ✏️
**Triggers**: BEFORE writing/editing any file

**Smart Reminders Based on File Type**:

**Service Files** (`*.service.ts`):
```
💡 Service File Reminder:
   • Always inject user_id using getAuthenticatedUserId()
   • Use insertRow() and updateRow() helpers
   • Add to serviceProxy.ts if new service
   • No hardcoded text - use i18n
```

**Migration Files** (`*.sql`):
```
💡 Migration File Reminder:
   • Include user_id column (uuid NOT NULL)
   • Enable RLS: ALTER TABLE ... ENABLE ROW LEVEL SECURITY
   • Create all 4 policies (SELECT, INSERT, UPDATE, DELETE)
   • Use auth.uid() = user_id in policies
   • Create index on user_id
```

**Component Files** (`*.tsx`):
```
💡 Component Reminder:
   • Use design system colors (COLORS from src/config/colors.ts)
   • Use useTranslation() for all text
   • Mobile-first: h-11 md:h-9 for buttons
   • Responsive: cards on mobile, tables on desktop
```

**Translation Files** (`*.json`):
```
💡 Translation Reminder:
   • Update BOTH tr/ and en/ versions
   • Use same keys in both files
   • Naming: [domain].[noun/action]
```

---

#### 4. **after-write.sh** ✨
**Triggers**: AFTER writing/editing any file

**Auto-Processing**:

**TypeScript/JavaScript Files**:
```
✨ Post-processing: src/components/AppointmentCard.tsx
  🎨 Formatting with Prettier... ✅
  🔍 Running ESLint auto-fix... ✅
  ✨ Processing complete!
```

**JSON Files** (translations, config):
```
✨ Post-processing: public/locales/tr/appointments.json
  🔍 Validating JSON syntax... ✅
  🎨 Formatting JSON... ✅
  ⚠️  Missing English counterpart!
     Create: public/locales/en/appointments.json
```

**Migration Files**:
```
✨ Post-processing: supabase/migrations/20251117_create_appointments.sql
  📋 Post-migration checklist:
     • Run: supabase db push
     • Generate types: npx supabase gen types typescript
     • Update: src/types/database.ts
     • Test: RLS policies with different users
```

**Service Files**:
```
✨ Post-processing: src/services/appointments.service.ts
  📋 Service checklist:
     • Register in src/lib/serviceProxy.ts
     • Add types to src/types/index.ts
     • Create tests (optional)
     • Update documentation
```

---

## 🤖 SYSTEM 2: USER-FACING AGENTIC SYSTEM (Design Blueprint)

This is the **conversational AI** for real estate agents to manage their business.

### Orchestrator: "Emlak Asistanı" (Real Estate Assistant)

**Role**: Natural language interface for CRM operations

**Example**:
```
Agent: "Günaydın! Bugün ne yapmalıyım?"
Emlak Asistanı →
  ☀️ Günaydın!
  📅 3 randevu var (10:00 mülk gösterimi...)
  ⚠️ 2 acil hatırlatıcı (sözleşme bitiyor)
  ✨ 3 yeni talep eşleşmesi bulundu
  📊 5 boş mülk, %75 doluluk oranı
```

### Specialist Agents (7 Business Experts)

#### 1. **Property Agent** (Mülk Yöneticisi) 🏢
**Domain**: Properties, owners, photos, status

**Capabilities**:
- List/search properties (rental/sale, by location, price, status)
- Create/update properties
- Upload/manage photos (max 10)
- Manage owners
- Auto-trigger inquiry matching

**Example**:
```
Agent: "Kadıköy'de boş kiralık mülklerim var mı?"
Property Agent →
  "Evet, 5 boş kiralık mülk:
  1. Bahariye Cad. - 18.000 TRY
  2. Moda Rıhtım - 22.000 TRY
  ..."
```

---

#### 2. **Tenant Agent** (Kiracı Yöneticisi) 👥
**Domain**: Tenants, contracts, renewals

**Capabilities**:
- Manage tenants
- Create/update/renew contracts
- Upload contract PDFs
- **Atomic tenant+contract creation**
- Contract expiration tracking

**Example**:
```
Agent: "Mehmet için sözleşme yenile"
Tenant Agent → [Multi-turn dialogue]
  "Mevcut sözleşme: 25.000 TRY, bitiş 1 Ocak 2025
  Yeni kira tutarı?"
Agent: "27.500 TRY"
  "✅ Sözleşme yenilendi!
  Yeni kira: 27.500 TRY (+%10)
  Yeni hatırlatıcı: 2 Aralık 2025"
```

---

#### 3. **Financial Agent** (Mali İşler Yöneticisi) 💰
**Domain**: Income, expenses, commissions, budgets

**Capabilities**:
- Track income/expenses
- Manage commissions (rental + sale)
- Recurring expense automation
- Financial analytics and forecasting
- Budget vs actual reports
- CSV export

**Example**:
```
Agent: "Bu ay ne kadar kazandım?"
Financial Agent →
  "💰 Kasım 2024 Özeti:
  Gelir: 127.500 TRY
    - Kira kom: 85k (4 sözleşme)
    - Satış kom: 42.5k (1 satış)
  Gider: 28.300 TRY
  📊 Net Kar: 99.200 TRY (%78 marj)"
```

---

#### 4. **Inquiry Agent** (Talep Yöneticisi) 🔍
**Domain**: Client inquiries, property matching

**Capabilities**:
- Create rental/sale inquiries
- **Automatic property matching algorithm**
  - Matches by: type, location, budget, status
  - Creates match records
  - Tracks contact status
- Lead management

**Example**:
```
Agent: "Selin Aydın kiralık arıyor, Kadıköy, 18-25k bütçe"
Inquiry Agent →
  "✅ Talep kaydedildi!
  🔍 7 eşleşme bulundu:
  ⭐ Moda Rıhtım - 22k TRY, 3+1, deniz manzaralı
  ⭐ Fenerbahçe - 24k TRY, 2+1, deniz manzaralı
  ✅ Bahariye - 19.5k TRY, 2+1"
```

---

#### 5. **Calendar Agent** (Takvim Yöneticisi) 📅
**Domain**: Meetings, appointments, viewings

**Capabilities**:
- Schedule meetings
- Property viewings
- Contract signings
- Owner meetings
- Meeting reminders

**Example**:
```
Agent: "Bugün randevularım neler?"
Calendar Agent →
  "📅 Bugün 3 randevu:
  10:00 - Mülk gösterimi (Can Yılmaz, Beşiktaş)
  14:30 - Sözleşme imza (Zeynep Kaya, Ofis)
  17:00 - Mal sahibi toplantı (Ahmet Öztürk, Cafe)"
```

---

#### 6. **Analytics Agent** (Analiz Uzmanı) 📊
**Domain**: Reports, statistics, forecasting

**Capabilities**:
- Property analytics (occupancy, trends)
- Financial analytics (profit, margins)
- Portfolio performance
- Inquiry conversion rates
- Predictive forecasting

**Example**:
```
Agent: "Portföy durumunu göster"
Analytics Agent →
  "📊 Portföy Özeti:
  🏢 42 mülk (%75 doluluk)
  👥 21 aktif sözleşme
  💰 Gelir: 127.5k TRY
  📈 Doluluk trendi: ↗️ %75 (geçen ay %71)
  🎯 3 sözleşme yenileme gerekli"
```

---

#### 7. **Reminder Agent** (Hatırlatıcı Yöneticisi) ⏰
**Domain**: Contract reminders, follow-ups

**Capabilities**:
- Contract expiration warnings
- Rent increase reminders
- Urgency categorization (expired, urgent, soon)
- Mark as contacted

**Example**:
```
Agent: "Hangi sözleşmeler bitiyor?"
Reminder Agent →
  "📅 Yaklaşan Sözleşmeler:
  🔴 ACİL (30 gün içinde)
  1. Nişantaşı - Mehmet Yılmaz (18 gün)
     Mevcut: 25k, Önerilen: 28k TRY
     ❌ Henüz görüşülmedi
  2. Kadıköy - Ayşe Demir (31 gün)
     ✅ Görüşüldü (yenileyecek)"
```

---

## 🔄 How the Two Systems Work Together

### Development System (Build Features)
```
You: "Add appointment scheduling feature"
↓
Development Orchestrator analyzes
↓
Architecture Agent → Creates appointments table
Code Agent → Creates appointments service + components
Product Agent → Adds TR/EN translations
Security Agent → Audits RLS
Automation Agent → Deploys
↓
✅ Feature ready in 10 minutes
```

### User-Facing System (Use Features)
```
Real Estate Agent: "Yarın saat 10'da Can ile mülk gösterimi ayarla"
↓
User-Facing Orchestrator analyzes (Turkish)
↓
Calendar Agent creates meeting:
  - Date: Tomorrow 10:00
  - Type: Property viewing
  - Client: Can
  - Sends reminder 1 hour before
↓
✅ "Randevu oluşturuldu! Can ile yarın 10:00'da mülk gösterimi"
```

---

## 🎯 Complete Workflow Example

**Scenario**: Add and use a new "Property Documents" feature

### Step 1: Build with Development System
```
You to Claude Code: "Add property document storage feature"

Development Orchestrator activates:

[Architecture Agent]
✅ Creates migration: property_documents table
✅ Fields: property_id, document_type, file_url, description
✅ RLS enabled with all policies

[Code Agent]
✅ Creates service: propertyDocuments.service.ts
✅ Methods: upload(), delete(), getByPropertyId()
✅ Creates component: DocumentsList.tsx

[Product Agent]
✅ Adds translations:
   - tr: "Belgeler", "Belge Yükle", "Sil"
   - en: "Documents", "Upload Document", "Delete"

[Security Agent]
✅ Audits RLS: Score 10/10
✅ Checks file upload security

[Automation Agent]
✅ Migration applied
✅ Types generated
✅ Git commit + push

Result: Feature ready in 8 minutes!
```

### Step 2: Use with User-Facing System
```
Agent to Emlak Asistanı: "Nişantaşı'ndaki mülk için tapu belgesi yükle"

User-Facing Orchestrator analyzes (Turkish):
  - Intent: Upload document
  - Entity: Property (Nişantaşı)
  - Document type: Deed (Tapu)

Property Agent activates:
  - Identifies property: "Nişantaşı, Teşvikiye Cad."
  - Calls propertyDocuments.service.upload()
  - Stores in Supabase Storage

Response: "✅ Tapu belgesi başarıyla yüklendi!
          Nişantaşı, Teşvikiye Cad. No:12
          Belge türü: Tapu
          Yüklenme: 17 Kasım 2024"
```

---

## 📊 Summary Comparison

| Aspect | Development System | User-Facing System |
|--------|-------------------|-------------------|
| **Purpose** | Build features | Use features |
| **User** | You (developer) | Real estate agents |
| **Language** | English (technical) | Turkish/English (conversational) |
| **Interface** | Claude Code IDE | Chat/Voice interface |
| **Agents** | 5 agents | 7 agents |
| **Tools** | Slash commands + Hooks | Service APIs |
| **Status** | ✅ Implemented | 📋 Design ready |
| **Example** | "/add-migration appointments" | "Bugün randevularım neler?" |

---

## 🚀 Current Status

### ✅ What You Have (Implemented)

1. **Development Agentic System**
   - 5 specialist agents (Architecture, Code, Product, Security, Automation)
   - 7 slash commands (/add-migration, /add-service, etc.)
   - 4 hooks (session-start, before-write, after-write, before-delete)
   - Full documentation (AGENTIC_SYSTEM.md, QUICKSTART, EXAMPLES)
   - Working orchestrator

2. **Real Estate CRM Application**
   - 12 database tables with RLS
   - 11 service layers
   - Complete UI with mobile-first design
   - Bilingual support (TR/EN)
   - Financial tracking, inquiries, contracts, etc.

### 📋 What You Have (Design Blueprint)

3. **User-Facing Agentic System**
   - Complete architecture design (REAL_ESTATE_AGENTIC_SYSTEM.md)
   - 7 specialist agents defined (Property, Tenant, Financial, Inquiry, Calendar, Analytics, Reminder)
   - Orchestrator logic documented
   - Use cases and examples provided
   - Implementation roadmap ready

### 🔨 What's Next (To Implement)

To activate the User-Facing Agentic System:

1. **Choose LLM Stack**
   - LangChain or LlamaIndex for orchestration
   - LangGraph for multi-agent workflows
   - GPT-4/Claude for orchestrator, GPT-3.5/Haiku for specialist agents

2. **Build Orchestrator**
   - Intent classification (query/action/analytics)
   - Entity extraction (properties, tenants, dates, amounts)
   - Agent routing logic
   - Turkish language support

3. **Implement Specialist Agents**
   - Start with Property Agent + Inquiry Agent (MVP)
   - Create agent prompts with tool access
   - Wrap existing services as agent tools

4. **Create Chat Interface**
   - Mobile-first chat UI
   - Voice input support (Turkish)
   - Rich responses (cards, tables, charts)
   - Context management (conversation history)

5. **Deploy & Test**
   - Supabase Edge Functions or containerized
   - Test with real Turkish queries
   - Iterate based on accuracy metrics

---

## 💡 Key Insights

### Why This Architecture is Powerful

1. **Dual Systems**:
   - Build features fast with development agents
   - Use features naturally with user-facing agents
   - Both systems leverage the same underlying CRM

2. **Hooks = Safety**:
   - Prevent mistakes (can't delete package.json)
   - Enforce patterns (RLS on all tables)
   - Auto-format code
   - Save time (no manual formatting)

3. **Slash Commands = Speed**:
   - `/add-feature` → Complete feature in 10 min
   - Manual development → 2-3 hours
   - 90%+ time savings

4. **User-Facing Agents = UX Revolution**:
   - "Boş mülkler" vs navigating menus
   - Turkish natural language
   - Mobile-friendly (voice input)
   - Proactive assistance ("Bugün ne yapmalıyım?")

5. **Service Layer = Flexibility**:
   - Same services used by both systems
   - Development agents create services
   - User-facing agents consume services
   - Single source of truth

---

## 🎓 How to Think About This

```
┌────────────────────────────────────────────────────┐
│         YOU (Developer)                            │
│              ↓                                     │
│    Development Agentic System                      │
│    (Claude Code + Agents + Hooks)                  │
│              ↓                                     │
│    BUILDS FEATURES                                 │
│    (migrations, services, components)              │
│              ↓                                     │
│    Real Estate CRM Application                     │
│    (12 tables, 11 services, UI)                    │
│              ↑                                     │
│    USES FEATURES                                   │
│              ↑                                     │
│    User-Facing Agentic System                      │
│    (Natural language interface)                    │
│              ↑                                     │
│    Real Estate Agents (End Users)                  │
└────────────────────────────────────────────────────┘
```

**You build with AI → Agents use with AI → Full circle!**

---

## 📞 Questions?

### About Development System
- See: `.claude/AGENTIC_QUICKSTART.md`
- Try: `/add-feature` command
- Check: Hook outputs in console

### About User-Facing System
- See: `.claude/REAL_ESTATE_AGENTIC_SYSTEM.md`
- Review: `.claude/AGENTIC_ARCHITECTURE_DIAGRAM.md`
- Plan: Implementation roadmap (Phase 1-5)

### About Hooks
- See: `.claude/hooks/README.md`
- Test: Run hooks manually
- Customize: Edit hook scripts

---

**Your Real Estate CRM is now a dual-layer AI-powered system!** 🚀

- **Layer 1**: AI builds features automatically
- **Layer 2**: AI helps users operate the CRM naturally

This is the future of software development and user experience! 🌟
