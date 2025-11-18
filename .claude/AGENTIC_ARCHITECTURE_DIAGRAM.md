# Real Estate CRM - Agentic System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER QUERY                                   │
│              (Natural Language - Turkish or English)                    │
│                                                                         │
│  Examples:                                                              │
│  • "Boş kiralık mülkleri göster"                                       │
│  • "Bu ay ne kadar kazandım?"                                          │
│  • "Hangi sözleşmeler bitiyor?"                                        │
│  • "Yeni talebe uygun mülk var mı?"                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR AGENT                                 │
│                   "Emlak Asistanı" (Real Estate Assistant)             │
│                                                                         │
│  Responsibilities:                                                      │
│  ✓ Language detection (TR/EN)                                          │
│  ✓ Intent classification                                               │
│  ✓ Entity extraction (properties, tenants, dates, amounts)             │
│  ✓ Route to specialist agent(s)                                        │
│  ✓ Coordinate multi-agent workflows                                    │
│  ✓ Aggregate and format responses                                      │
│  ✓ Multi-turn conversation management                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
            ┌───────────────────────┴───────────────────────┐
            │                                               │
┌───────────▼──────────┬────────────────┬──────────────────▼──────────────┐
│                      │                │                                 │
│  SPECIALIST AGENTS (7 Domain Experts)                                  │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Property Agent  │  │  Tenant Agent   │  │ Financial Agent │        │
│  │  Mülk Yöneticisi│  │ Kiracı Yöneticisi│  │ Mali İşler Yön. │        │
│  │                 │  │                 │  │                 │        │
│  │ • List/search   │  │ • Tenant CRUD   │  │ • Transactions  │        │
│  │ • Create/update │  │ • Contract CRUD │  │ • Categories    │        │
│  │ • Photo mgmt    │  │ • Atomic create │  │ • Recurring exp │        │
│  │ • Owner mgmt    │  │ • Contract PDF  │  │ • Commissions   │        │
│  │ • Status change │  │ • Renewals      │  │ • Reports       │        │
│  │ • Stats         │  │ • Stats         │  │ • Analytics     │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Inquiry Agent   │  │ Calendar Agent  │  │ Reminder Agent  │        │
│  │ Talep Yöneticisi│  │ Takvim Yöneticisi│  │Hatırlatıcı Yön. │        │
│  │                 │  │                 │  │                 │        │
│  │ • Inquiry CRUD  │  │ • Meeting CRUD  │  │ • List reminders│        │
│  │ • Auto matching │  │ • Schedule      │  │ • Categorize    │        │
│  │ • Match tracking│  │ • Date range    │  │ • Mark contacted│        │
│  │ • Notifications │  │ • Reminders     │  │ • Urgency calc  │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                         │
│  ┌─────────────────┐                                                   │
│  │ Analytics Agent │                                                   │
│  │  Analiz Uzmanı  │                                                   │
│  │                 │                                                   │
│  │ • Property stats│                                                   │
│  │ • Financial     │                                                   │
│  │ • Portfolio     │                                                   │
│  │ • Inquiry stats │                                                   │
│  │ • Forecasting   │                                                   │
│  └─────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          TOOLS LAYER                                    │
│                  (Services, Database, Storage, RPC)                     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ PROPERTY OPERATIONS                                      │          │
│  ├──────────────┬──────────────┬──────────────┬────────────┤          │
│  │ Properties   │ Photos       │ Owners       │ Stats      │          │
│  │ • getAll     │ • upload     │ • getAll     │ • getStats │          │
│  │ • getRental  │ • delete     │ • getById    │ • missing  │          │
│  │ • getSale    │ • reorder    │ • create     │   info     │          │
│  │ • getById    │ • count      │ • update     │            │          │
│  │ • create     │              │ • withCount  │            │          │
│  │ • update     │              │              │            │          │
│  │ • delete     │              │              │            │          │
│  └──────────────┴──────────────┴──────────────┴────────────┘          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ TENANT & CONTRACT OPERATIONS                             │          │
│  ├──────────────┬──────────────────────────────────────────┤          │
│  │ Tenants      │ Contracts                                │          │
│  │ • getAll     │ • getAll, getActive, getExpiring         │          │
│  │ • getById    │ • getByTenantId, getByPropertyId         │          │
│  │ • create     │ • create, createWithStatusUpdate (RPC)   │          │
│  │ • update     │ • update, delete (RPC)                   │          │
│  │ • delete     │ • uploadPdf, deletePdf                   │          │
│  │ • getStats   │ • getStats                               │          │
│  │ • createWith │                                          │          │
│  │   Contract   │                                          │          │
│  │   (ATOMIC)   │                                          │          │
│  └──────────────┴──────────────────────────────────────────┘          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ FINANCIAL OPERATIONS                                     │          │
│  ├──────────────┬──────────────┬──────────────┬────────────┤          │
│  │ Transactions │ Categories   │ Recurring    │ Commissions│          │
│  │ • get        │ • get        │ • get        │ • getAll   │          │
│  │ • create     │ • create     │ • create     │ • getStats │          │
│  │ • update     │ • update     │ • update     │ • create   │          │
│  │ • delete     │ • breakdown  │ • markPaid   │ • createSale│          │
│  │              │ • topCats    │ • upcoming   │   (RPC)    │          │
│  ├──────────────┴──────────────┴──────────────┴────────────┤          │
│  │ REPORTS & ANALYTICS                                      │          │
│  │ • getMonthlySummary, getMonthlyTrends                   │          │
│  │ • getFinancialDashboard, getFinancialRatios             │          │
│  │ • getBudgetVsActual, getYearlySummary                   │          │
│  │ • getCashFlowForecast, exportToCSV                      │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ INQUIRY & MATCHING OPERATIONS                            │          │
│  ├──────────────┬───────────────────────────────────────────┤          │
│  │ Inquiries    │ Matching Engine                           │          │
│  │ • getAll     │ • checkMatchesForNewProperty (AUTO)       │          │
│  │ • getRental  │ • matchInquiryToProperty (ALGORITHM)      │          │
│  │ • getSale    │ • createMatch                             │          │
│  │ • create     │ • getMatchesByInquiry                     │          │
│  │ • update     │ • markAsContacted                         │          │
│  │ • delete     │ • markNotificationSent                    │          │
│  │ • getActive  │ • getUnreadMatchesCount                   │          │
│  │ • getStats   │                                           │          │
│  └──────────────┴───────────────────────────────────────────┘          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ CALENDAR OPERATIONS                                      │          │
│  │ • getAll, getById, getByDateRange, getUpcoming           │          │
│  │ • create, update, delete                                 │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ REMINDER OPERATIONS                                      │          │
│  │ • getAllReminders, getActive, getUpcoming, getOverdue    │          │
│  │ • getScheduled, getExpired                               │          │
│  │ • markAsContacted, markAsNotContacted                    │          │
│  │ • updateReminderSettings                                 │          │
│  │ • categorizeReminders, getUrgencyCategory                │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │ USER PREFERENCES                                         │          │
│  │ • getPreferences, updatePreferences                      │          │
│  │ • updateLanguage, updateCurrency, updateMeetingReminder  │          │
│  └──────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                                   │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  PostgreSQL  │  │   Storage    │  │     Auth     │                 │
│  │   Database   │  │ (Photos/PDFs)│  │  (Sessions)  │                 │
│  │              │  │              │  │              │                 │
│  │ • 12 Tables  │  │ • property-  │  │ • User login │                 │
│  │ • RLS        │  │   photos     │  │ • Sessions   │                 │
│  │ • RPC funcs  │  │ • contract-  │  │ • user_id    │                 │
│  │ • Triggers   │  │   pdfs       │  │   for RLS    │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Multi-Agent Workflow Examples

### Example 1: Complex Query with Multiple Agents
```
User Query: "Boş mülklerim için aktif talep var mı?"
(Are there active inquiries for my empty properties?)

┌──────────────────────────────────────────────────────┐
│ ORCHESTRATOR                                         │
│ • Detects: Query about empty properties + inquiries  │
│ • Agents needed: Property Agent + Inquiry Agent      │
│ • Execution: Sequential                              │
└──────────────────────────────────────────────────────┘
            ↓                           ↓
┌─────────────────────┐    ┌─────────────────────────┐
│ Property Agent      │    │ Inquiry Agent           │
│ Step 1:             │    │ Step 2:                 │
│ • Get empty props   │    │ • For each empty prop:  │
│ • Filter by status  │→───│   check matches         │
│ • Return list       │    │ • Aggregate results     │
└─────────────────────┘    └─────────────────────────┘
                                    ↓
            ┌───────────────────────────────────────┐
            │ ORCHESTRATOR                          │
            │ • Aggregates results                  │
            │ • Formats response in Turkish         │
            │ • Returns: "5 boş mülk için 12 eşleşme"│
            └───────────────────────────────────────┘
```

### Example 2: Complex Action with Atomic Transaction
```
User Query: "Yeni kiracı ekle ve sözleşme oluştur"
(Add new tenant and create contract)

┌──────────────────────────────────────────────────────┐
│ ORCHESTRATOR                                         │
│ • Detects: Multi-step action                         │
│ • Agent needed: Tenant Agent                         │
│ • Execution: Multi-turn dialogue                     │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ Tenant Agent (Multi-turn Dialogue)                   │
│                                                       │
│ Turn 1: "Kiracı adı ve telefonu?"                   │
│ User: "Ahmet Yılmaz, 0532 123 45 67"                │
│                                                       │
│ Turn 2: "Hangi mülk için?"                           │
│ User: "Nişantaşı'ndaki"                              │
│   → Calls Property Agent to disambiguate             │
│   → Shows: "Nişantaşı, Teşvikiye Cad. No:12?"       │
│ User: "Evet"                                         │
│                                                       │
│ Turn 3: "Sözleşme başlangıç/bitiş tarihi?"          │
│ User: "1 Ocak 2025, 1 yıl"                          │
│                                                       │
│ Turn 4: "Aylık kira tutarı?"                        │
│ User: "25.000 TRY"                                   │
│                                                       │
│ Turn 5: "Onaylıyor musunuz?"                        │
│ User: "Evet"                                         │
│                                                       │
│ Executes ATOMIC operation:                           │
│ • Creates tenant record                              │
│ • Creates contract record                            │
│ • Updates property status → Occupied                 │
│ • Generates reminder for rent increase               │
│ • ALL in single transaction (rollback on error)      │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ ORCHESTRATOR                                         │
│ • Confirms success                                   │
│ • Returns: "✅ Kiracı ve sözleşme oluşturuldu"       │
│ • Asks: "Sözleşme PDF'i yüklemek ister misiniz?"     │
└──────────────────────────────────────────────────────┘
```

### Example 3: Analytics Query (Parallel Execution)
```
User Query: "Bu yılki performansımı göster"
(Show me this year's performance)

┌──────────────────────────────────────────────────────┐
│ ORCHESTRATOR                                         │
│ • Detects: Comprehensive analytics request           │
│ • Agents needed: Analytics Agent + Financial Agent   │
│ • Execution: Parallel (independent queries)          │
└──────────────────────────────────────────────────────┘
         ↓                ↓               ↓              ↓
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ Analytics  │  │ Financial  │  │ Analytics  │  │ Financial  │
│ Agent      │  │ Agent      │  │ Agent      │  │ Agent      │
│            │  │            │  │            │  │            │
│ Property   │  │ Financial  │  │ Commission │  │ Cash Flow  │
│ Stats      │  │ Summary    │  │ Breakdown  │  │ Forecast   │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
         ↓                ↓               ↓              ↓
            ┌───────────────────────────────────────┐
            │ ORCHESTRATOR                          │
            │ • Waits for all parallel results      │
            │ • Aggregates into comprehensive report│
            │ • Formats with charts and tables      │
            │ • Returns full dashboard view         │
            └───────────────────────────────────────┘
```

---

## Agent Decision Flow

```
                    USER QUERY
                        ↓
            ┌───────────────────────┐
            │ Intent Classification │
            └───────────────────────┘
                        ↓
        ┌───────────────┴───────────────┐
        │                               │
    [QUERY]                         [ACTION]
        │                               │
        ↓                               ↓
┌──────────────┐              ┌──────────────────┐
│ Which entity?│              │ Single or Multi? │
└──────────────┘              └──────────────────┘
        │                               │
        ├─ Property → Property Agent    ├─ Single → Direct Agent
        ├─ Tenant → Tenant Agent        └─ Multi → Orchestrated
        ├─ Financial → Financial Agent
        ├─ Inquiry → Inquiry Agent
        ├─ Calendar → Calendar Agent
        ├─ Reminder → Reminder Agent
        └─ Analytics → Analytics Agent

Examples:
• "Mülkleri göster" → Property Agent (QUERY)
• "Sözleşme oluştur" → Tenant Agent (ACTION - Multi-turn)
• "Bu ay ne kadar kazandım?" → Financial Agent (QUERY)
• "Boş mülkler için talep var mı?" → Property + Inquiry (QUERY - Multi-agent)
```

---

## Conversation Context Management

```
┌─────────────────────────────────────────────────────┐
│                CONVERSATION STATE                    │
│                                                      │
│  Session ID: abc-123                                 │
│  User ID: user-456                                   │
│  Language: Turkish                                   │
│  Currency: TRY                                       │
│                                                      │
│  Conversation History (Last 5 turns):                │
│  ┌────────────────────────────────────────────────┐ │
│  │ User: "Mülkleri göster"                        │ │
│  │ Agent: [Lists 42 properties]                   │ │
│  │ User: "Sadece Kadıköy"                         │ │
│  │ Agent: [Lists 12 Kadıköy properties]           │ │
│  │ User: "Boş olanlar?"                           │ │
│  │ Agent: [Lists 5 empty Kadıköy properties]      │ │
│  │ User: "Birincisini göster"                     │ │
│  │ Agent: [Shows details of property #1]          │ │
│  │ User: "Fotoğraflarını ekle"  ← CURRENT         │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Active Context:                                     │
│  • Current Property: property-id-123                 │
│  • Current Filters: {city: "Kadıköy", status: "Empty"}│
│  • Last Agent: Property Agent                        │
│                                                      │
│  Orchestrator can resolve:                           │
│  "Birincisini" → property-id-123 (from history)      │
│  "Fotoğraf ekle" → uploadPhoto(property-id-123)      │
└─────────────────────────────────────────────────────┘
```

---

## Error Handling & Rollback

```
User Action: "Yeni sözleşme oluştur" (Multi-step transaction)

┌──────────────────────────────────────────────────────┐
│ Tenant Agent: createTenantWithContract()             │
│                                                       │
│ Step 1: ✅ Create tenant record                      │
│ Step 2: ✅ Create contract record                    │
│ Step 3: ❌ Update property status (FAILED)           │
│         Error: Property has existing active contract │
│                                                       │
│ ROLLBACK TRIGGERED:                                  │
│ • Delete contract record (created in Step 2)         │
│ • Delete tenant record (created in Step 1)           │
│ • Restore database to pre-transaction state          │
│                                                       │
│ Response to User:                                    │
│ "❌ Sözleşme oluşturulamadı:                         │
│  Bu mülk için zaten aktif bir sözleşme var.          │
│  Önce mevcut sözleşmeyi arşivleyin."                 │
└──────────────────────────────────────────────────────┘
```

---

## Security & Privacy Flow

```
┌─────────────────────────────────────────────────────┐
│                 USER AUTHENTICATES                   │
│             (Supabase Auth - JWT Token)              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              ORCHESTRATOR RECEIVES QUERY             │
│         Extracts user_id from session token          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           SPECIALIST AGENT EXECUTES TOOL             │
│         All queries filtered by user_id              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              SUPABASE ROW LEVEL SECURITY             │
│   SELECT * FROM properties WHERE user_id = auth.uid()│
│   → User can ONLY see their own properties           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│               RESPONSE TO USER                       │
│         Contains ONLY user's own data                │
└─────────────────────────────────────────────────────┘

CRITICAL OPERATIONS (Require Confirmation):
• Delete property/owner/tenant/contract
• Archive contract
• Mark property as Sold (irreversible via commission RPC)
• Bulk operations

CONFIRMATION FLOW:
User: "Mülkü sil"
Agent: "⚠️ DİKKAT: [Shows details + related records]
        Emin misiniz?"
User: "Evet, eminim"
Agent: [Executes deletion]
```
