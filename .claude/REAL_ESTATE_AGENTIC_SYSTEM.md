# Real Estate CRM - Agentic Orchestration System
## Natural Language Interface for Real Estate Agents

---

## 🎯 System Overview

This document defines an **AI-powered orchestration system** that allows real estate agents to interact with the CRM using natural language queries in Turkish or English. The system uses a hierarchical agent architecture to handle complex real estate operations through conversational interfaces.

```
User Query (Natural Language)
        ↓
┌───────────────────────────────────────────┐
│     ORCHESTRATOR AGENT                    │
│  "Emlak Asistanı" (Real Estate Assistant)│
│  Routes queries to specialist agents      │
└───────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────┐
│        SPECIALIST AGENTS (7)              │
│  ┌─────────┬─────────┬─────────┬────────┐│
│  │Property │ Tenant  │Financial│Inquiry ││
│  │ Agent   │ Agent   │ Agent   │Agent   ││
│  └─────────┴─────────┴─────────┴────────┘│
│  ┌─────────┬─────────┬─────────┐         │
│  │Calendar │Analytics│Reminder │         │
│  │ Agent   │ Agent   │ Agent   │         │
│  └─────────┴─────────┴─────────┘         │
└───────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────┐
│          TOOLS LAYER                      │
│  (Services, Database, Storage, RPC)       │
└───────────────────────────────────────────┘
```

---

## 🤖 ORCHESTRATOR AGENT

### Name
**"Emlak Asistanı"** (Real Estate Assistant)

### Role
Central routing intelligence that:
1. Receives natural language queries in Turkish or English
2. Analyzes user intent and context
3. Routes to appropriate specialist agent(s)
4. Coordinates multi-agent workflows
5. Aggregates and formats responses
6. Returns conversational answers

### Example Query Routing

| User Query | Intent | Agent(s) Called |
|-----------|--------|-----------------|
| "Boş kiralık mülkleri göster" | List empty rentals | Property Agent |
| "Ahmet için yeni sözleşme oluştur" | Create contract | Tenant Agent + Property Agent |
| "Bu ay kaç para kazandım?" | Financial summary | Financial Agent |
| "Fiyatı 500.000 TL altında olan satılık mülkler?" | Property search | Property Agent |
| "Bugün randevularım neler?" | Today's meetings | Calendar Agent |
| "Hangi sözleşmeler bitiyor?" | Expiring contracts | Reminder Agent |
| "Yeni talebe uygun mülk var mı?" | Inquiry matching | Inquiry Agent |
| "En çok kazandıran mülk hangisi?" | Property analytics | Analytics Agent |

### Capabilities
- Bilingual understanding (Turkish primary, English secondary)
- Context awareness (remembers conversation history)
- Multi-turn dialogues ("Show properties" → "Filter by Istanbul" → "Show only empty ones")
- Disambiguation ("Ahmet" → "Which Ahmet? We have 3 tenants named Ahmet")
- Confirmation for critical actions ("Are you sure you want to delete this property?")

---

## 🏗️ SPECIALIST AGENTS

### 1. **Property Agent** (Mülk Yöneticisi)

**Domain**: Property inventory, owners, photos, status management

**Capabilities**:

**Queries**:
- List properties with filters (status, type, city, owner, price range)
- Get property details by ID or address
- Find properties by owner
- Get properties missing information (photos, location)
- Check property status and history

**Actions**:
- Create new property (rental or sale)
- Update property information (price, status, location, notes)
- Upload/delete/reorder photos
- Change property status (Empty ↔ Occupied, Available ↔ Sold)
- Add/update listing URL
- Create/update property owners

**Business Logic**:
- Automatically triggers inquiry matching when property becomes Empty/Available
- Validates max 10 photos per property
- Ensures property status aligns with active contracts

**Tools**:
```typescript
// Properties Tools
- propertiesService.getAll()
- propertiesService.getRentalProperties()
- propertiesService.getSaleProperties()
- propertiesService.getById(id)
- propertiesService.getByOwnerId(ownerId)
- propertiesService.create(property)
- propertiesService.update(id, property)
- propertiesService.delete(id)
- propertiesService.getStats()
- propertiesService.getPropertiesWithMissingInfo()

// Photos Tools
- photosService.uploadPhoto(propertyId, file)
- photosService.deletePhoto(photoId)
- photosService.reorderPhotos(propertyId, photoIds)
- photosService.getPhotoCount(propertyId)

// Owners Tools
- ownersService.getAll()
- ownersService.getById(id)
- ownersService.create(owner)
- ownersService.update(id, owner)
- ownersService.getOwnersWithPropertyCount()
```

**Example Interactions**:
```
User: "Beşiktaş'ta kiralık mülklerim var mı?"
Agent: "Evet, Beşiktaş'ta 3 kiralık mülkünüz var:
1. Barbaros Bulvarı No:45 - Boş - 15.000 TRY/ay
2. Yıldız Mahallesi - Dolu - 12.500 TRY/ay
3. Akaretler Sokak - Pasif - 18.000 TRY/ay"

User: "Birincisinin fotoğraflarını göster"
Agent: [Shows 8 photos of Barbaros property]

User: "Bu mülkü satılık yap, fiyat 3.5 milyon TRY"
Agent: "Bu mülk şu anda 'Kiralık' olarak kayıtlı. 'Satılık' yapmak istediğinizden emin misiniz? Bu işlem mevcut kiralama bilgilerini etkileyebilir."
User: "Evet, eminim"
Agent: "✅ Mülk başarıyla 'Satılık' olarak güncellendi.
Satış fiyatı: 3.500.000 TRY
Durum: Müsait
Aktif talep eşleştirme yapıldı: 2 potansiyel alıcı bulundu."
```

---

### 2. **Tenant Agent** (Kiracı Yöneticisi)

**Domain**: Tenants, contracts, contract lifecycle management

**Capabilities**:

**Queries**:
- List tenants (all, assigned, unassigned)
- Get tenant details and contract history
- Find tenants by name, phone, property
- List contracts (active, expiring, archived)
- Get contract details with PDF access
- Check tenant payment history (if integrated)

**Actions**:
- Create new tenant
- Update tenant information
- Create contract (links tenant to property)
- Create tenant + contract atomically
- Update contract (rent amount, dates, status)
- Upload/replace contract PDF
- Archive contract (tenant leaving)
- Mark contract as inactive
- Renew contract (create new from old)
- Delete tenant (if no contracts)

**Business Logic**:
- Atomic tenant+contract creation with rollback
- Automatically updates property status when contract created/archived
- Validates one active contract per property
- Generates reminders for rent increases and expiration

**Tools**:
```typescript
// Tenant Tools
- tenantsService.getAll()
- tenantsService.getById(id)
- tenantsService.getUnassigned()
- tenantsService.create(tenant)
- tenantsService.update(id, tenant)
- tenantsService.createTenantWithContract(data)
- tenantsService.getStats()

// Contract Tools
- contractsService.getAll()
- contractsService.getById(id)
- contractsService.getByTenantId(tenantId)
- contractsService.getByPropertyId(propertyId)
- contractsService.getActiveContracts()
- contractsService.getExpiringContracts(days)
- contractsService.create(contract)
- contractsService.createWithStatusUpdate(contract)
- contractsService.update(id, contract)
- contractsService.delete(id)
- contractsService.uploadContractPdfAndPersist(file, contractId)
- contractsService.deleteContractPdf(filePath)
- contractsService.getStats()
```

**Example Interactions**:
```
User: "Mehmet Yılmaz için sözleşme oluştur"
Agent: "Mehmet Yılmaz için sözleşme oluşturulacak. Aşağıdaki bilgilere ihtiyacım var:
1. Hangi mülk için? (Mülk adresini söyleyin veya listeden seçin)
2. Başlangıç tarihi?
3. Bitiş tarihi?
4. Aylık kira tutarı?"

User: "Nişantaşı'ndaki mülk, 1 Ocak 2025, 1 yıl, 25.000 TRY"
Agent: "Anladım:
📍 Mülk: Nişantaşı, Teşvikiye Cad. No:12
👤 Kiracı: Mehmet Yılmaz
📅 Başlangıç: 1 Ocak 2025
📅 Bitiş: 1 Ocak 2026
💰 Kira: 25.000 TRY/ay
Onaylıyor musunuz?"

User: "Evet"
Agent: "✅ Sözleşme başarıyla oluşturuldu!
Sözleşme No: #SZ-2025-001
Mülk durumu 'Boş' → 'Dolu' olarak güncellendi
Kira artış hatırlatıcısı 11 Aralık 2025 için ayarlandı
Sözleşme PDF'i yüklemek ister misiniz?"
```

---

### 3. **Financial Agent** (Mali İşler Yöneticisi)

**Domain**: Income, expenses, commissions, budgets, financial reporting

**Capabilities**:

**Queries**:
- Get transactions by filters (date, type, category, property, amount)
- View monthly/yearly financial summaries
- Check budget vs actual spending
- Get category breakdowns
- View cash flow forecast
- List recurring expenses and upcoming bills
- Get commission earnings (rental/sale breakdown)
- Calculate financial ratios (profit margin, expense ratio)
- View top expense categories

**Actions**:
- Create income/expense transaction
- Update/delete transaction
- Upload receipt for transaction
- Create recurring expense
- Mark recurring bill as paid
- Create commission (rental or sale)
- Record sale commission + mark property sold
- Create custom expense category
- Set category budgets
- Export transactions to CSV

**Analytics**:
- Monthly income/expense trends
- Category spending analysis
- Budget performance
- Commission tracking
- Cash flow projections (30-day forecast)
- Yearly financial summary
- Financial health score

**Tools**:
```typescript
// Transaction Tools
- financialTransactionsService.getTransactions(filters)
- financialTransactionsService.getTransactionById(id)
- financialTransactionsService.createTransaction(data)
- financialTransactionsService.updateTransaction(id, data)
- financialTransactionsService.deleteTransaction(id)

// Category Tools
- financialTransactionsService.getCategories(type)
- financialTransactionsService.createCategory(data)
- financialTransactionsService.updateCategory(id, data)
- financialTransactionsService.getCategoryBreakdown(startDate, endDate, type)
- financialTransactionsService.getTopCategories(type, limit, month)

// Recurring Expense Tools
- financialTransactionsService.getRecurringExpenses(filters)
- financialTransactionsService.createRecurringExpense(data)
- financialTransactionsService.updateRecurringExpense(id, data)
- financialTransactionsService.markBillAsPaid(recurringExpenseId)
- financialTransactionsService.getUpcomingRecurringExpenses(daysAhead)

// Analytics Tools
- financialTransactionsService.getMonthlySummary(month)
- financialTransactionsService.getMonthlyTrends(months)
- financialTransactionsService.getFinancialDashboard()
- financialTransactionsService.getFinancialRatios(month)
- financialTransactionsService.getBudgetVsActual(month)
- financialTransactionsService.getYearlySummary(year)
- financialTransactionsService.getCashFlowForecast()
- financialTransactionsService.exportTransactionsToCSV(filters)

// Commission Tools
- commissionsService.getAll()
- commissionsService.getAllWithProperties()
- commissionsService.getByDateRange(startDate, endDate)
- commissionsService.getByType(type)
- commissionsService.create(commission)
- commissionsService.createSaleCommission(propertyId, salePrice, currency)
- commissionsService.getStats(currency)
- commissionsService.getMonthlyBreakdown(year, currency)
```

**Example Interactions**:
```
User: "Bu ay ne kadar kazandım?"
Agent: "Kasım 2024 Mali Özet:
💰 Toplam Gelir: 127.500 TRY
  - Kira komisyonları: 85.000 TRY (4 sözleşme)
  - Satış komisyonları: 42.500 TRY (1 satış)

💸 Toplam Gider: 28.300 TRY
  - Ofis kirası: 15.000 TRY
  - Bakım/onarım: 8.500 TRY
  - Diğer: 4.800 TRY

📊 Net Kar: 99.200 TRY
📈 Kar Marjı: %77.8"

User: "En çok nereye harcama yapıyorum?"
Agent: "Son 3 aydaki en yüksek gider kategorileriniz:
1. Ofis Kirası: 45.000 TRY (Bütçe: 45.000 TRY) ✅
2. Mülk Bakımı: 31.200 TRY (Bütçe: 25.000 TRY) ⚠️ %25 aşım
3. Pazarlama: 18.500 TRY (Bütçe: 20.000 TRY) ✅
4. Ulaşım: 12.800 TRY (Bütçe belirlenmemiş)

Mülk Bakımı kategorisinde bütçe aşımı var. Detay görmek ister misiniz?"
```

---

### 4. **Inquiry Agent** (Talep Yöneticisi)

**Domain**: Client inquiries, property matching, lead management

**Capabilities**:

**Queries**:
- List inquiries (all, rental, sale, active, contacted, closed)
- Get inquiry details with matched properties
- View matches for specific inquiry
- Check unread match count
- Find inquiries by client name, budget, location

**Actions**:
- Create new inquiry (rental or sale)
- Update inquiry information
- Delete inquiry
- Mark inquiry as contacted
- Mark inquiry as closed
- Manually create property-inquiry match
- Mark match notification as sent

**Business Logic**:
- **Automatic Matching Algorithm**:
  - Runs when inquiry created
  - Re-runs when new properties become available
  - Matches based on:
    - Property type (rental ↔ rental inquiry, sale ↔ sale inquiry)
    - Property status (Empty for rental, Available for sale)
    - Location (city, district)
    - Budget range (inquiry min/max vs property rent/price)
- Creates `inquiry_matches` records
- Tracks notification and contact status per match

**Tools**:
```typescript
// Inquiry Tools
- inquiriesService.getAll()
- inquiriesService.getRentalInquiries()
- inquiriesService.getSaleInquiries()
- inquiriesService.getById(id)
- inquiriesService.create(inquiry)
- inquiriesService.update(id, inquiry)
- inquiriesService.delete(id)
- inquiriesService.getActiveInquiries(type)
- inquiriesService.getStats()

// Matching Tools
- inquiriesService.checkMatchesForNewProperty(propertyId)
- inquiriesService.createMatch(inquiryId, propertyId)
- inquiriesService.getMatchesByInquiry(inquiryId)
- inquiriesService.markAsContacted(inquiryId)
- inquiriesService.markNotificationSent(matchId)
- inquiriesService.getUnreadMatchesCount()
```

**Example Interactions**:
```
User: "Ayşe Demir için yeni talep ekle"
Agent: "Ayşe Demir için talep oluşturulacak. Bilgileri alalım:
1. Kiralık mı satılık mı arıyor?
2. Hangi bölgelerde?
3. Bütçesi ne kadar?"

User: "Kiralık, Kadıköy veya Moda, 15.000-20.000 TRY arası"
Agent: "Bilgiler kaydedildi. Telefon numarası var mı?"
User: "0532 123 45 67"

Agent: "✅ Talep oluşturuldu!
👤 Müşteri: Ayşe Demir (0532 123 45 67)
🏠 Aranan: Kiralık
📍 Bölge: Kadıköy, Moda
💰 Bütçe: 15.000-20.000 TRY

🔍 Eşleştirme yapılıyor...

✨ 5 uygun mülk bulundu:
1. Kadıköy, Bahariye Cad. - 18.000 TRY - 3+1 - Boş
2. Moda, Rıhtım Cad. - 17.500 TRY - 2+1 - Boş
3. Kadıköy, Söğütlüçeşme - 16.000 TRY - 3+1 - Boş
4. Moda, Caferağa Mah. - 19.500 TRY - 2+1 - Boş
5. Kadıköy, Feneryolu - 15.500 TRY - 3+1 - Boş

Müşteriyle iletişime geçmek ister misiniz?"
```

---

### 5. **Calendar Agent** (Takvim Yöneticisi)

**Domain**: Meetings, appointments, property viewings, reminders

**Capabilities**:

**Queries**:
- List meetings (today, this week, upcoming, date range)
- Get meeting details
- Find meetings by property, tenant, owner
- Get next X upcoming meetings
- Check today's schedule

**Actions**:
- Schedule new meeting
- Update meeting details
- Cancel/delete meeting
- Reschedule meeting
- Link meeting to property/tenant/owner
- Set meeting reminder (X minutes before)

**Business Logic**:
- Sends reminders based on user preferences
- Can link meetings to CRM entities for context
- Supports external clients (not in system)

**Tools**:
```typescript
// Meeting Tools
- meetingsService.getAll()
- meetingsService.getById(id)
- meetingsService.create(meeting)
- meetingsService.update(id, meeting)
- meetingsService.delete(id)
- meetingsService.getByDateRange(startDate, endDate)
- meetingsService.getUpcoming(limit)

// Notification Tools
- userPreferencesService.getPreferences() // For reminder settings
```

**Example Interactions**:
```
User: "Bugün randevularım neler?"
Agent: "Bugün 3 randevunuz var:

1. ⏰ 10:00 - Mülk Gösterimi
   📍 Beşiktaş, Barbaros Bulvarı
   👤 Müşteri: Can Yılmaz (0533 444 55 66)
   📝 Satılık mülk gösterimi

2. ⏰ 14:30 - Sözleşme İmzalama
   📍 Ofis
   👤 Kiracı: Zeynep Kaya
   📝 Nişantaşı mülk sözleşmesi

3. ⏰ 17:00 - Mal Sahibi Toplantısı
   📍 Cafe, Etiler
   👤 Mal Sahibi: Ahmet Öztürk
   📝 Portföy değerlendirmesi

İlk randevunuza 45 dakika kaldı! Hazır mısınız?"
```

---

### 6. **Analytics Agent** (Analiz Uzmanı)

**Domain**: Statistics, reports, insights, forecasting

**Capabilities**:

**Property Analytics**:
- Occupancy rates (rental properties)
- Average rent by location
- Sale completion rates
- Properties by status breakdown
- Inventory trends over time

**Financial Analytics**:
- Income/expense trends
- Commission earnings analysis
- Category spending patterns
- Budget performance
- Profit margins
- Cash flow forecasting
- Year-over-year comparisons

**Portfolio Analytics**:
- Top performing properties (by commission)
- Most profitable owners
- Tenant retention rates
- Average contract duration
- Property vacancy duration

**Inquiry Analytics**:
- Match success rates
- Average time to match
- Popular locations/budgets
- Inquiry conversion rates

**Operational Analytics**:
- Reminder response times
- Contract renewal rates
- Data quality scores (missing info)

**Tools**:
```typescript
// Property Stats
- propertiesService.getStats()
- propertiesService.getPropertiesWithMissingInfo()

// Tenant Stats
- tenantsService.getStats()
- tenantsService.getTenantsWithMissingInfo()

// Contract Stats
- contractsService.getStats()
- contractsService.getExpiringContracts(days)

// Financial Stats & Reports
- financialTransactionsService.getFinancialDashboard()
- financialTransactionsService.getMonthlySummary(month)
- financialTransactionsService.getMonthlyTrends(months)
- financialTransactionsService.getFinancialRatios(month)
- financialTransactionsService.getBudgetVsActual(month)
- financialTransactionsService.getYearlySummary(year)
- financialTransactionsService.getCashFlowForecast()
- financialTransactionsService.getCategoryBreakdown(startDate, endDate, type)
- financialTransactionsService.getTopCategories(type, limit, month)

// Commission Stats
- commissionsService.getStats(currency)
- commissionsService.getMonthlyBreakdown(year, currency)

// Inquiry Stats
- inquiriesService.getStats()
- inquiriesService.getUnreadMatchesCount()

// Owner Stats
- ownersService.getOwnersWithPropertyCount()
```

**Example Interactions**:
```
User: "Portföyümün genel durumunu göster"
Agent: "📊 Portföy Özeti (Kasım 2024)

🏢 MÜLKLER
Toplam: 42 mülk
├─ Kiralık: 28 mülk
│  ├─ Dolu: 21 (%75 doluluk)
│  ├─ Boş: 5
│  └─ Pasif: 2
└─ Satılık: 14 mülk
   ├─ Müsait: 8
   ├─ Teklifte: 4
   └─ Satıldı: 2

👥 KİRACILAR & SÖZLEŞMELER
Aktif sözleşme: 21
30 gün içinde bitenler: 3 ⚠️
Yenileme oranı: %87

💰 MALİ DURUM (Bu Ay)
Gelir: 127.500 TRY
Gider: 28.300 TRY
Net: 99.200 TRY (+%78)

📈 TRENDLER
Doluluk: ↗️ %75 (geçen ay %71)
Ortalama kira: 16.840 TRY
En yüksek talep: Kadıköy, Beşiktaş

🎯 AKSİYON GEREKTİRENLER
- 3 sözleşme yenileme görüşmesi
- 5 boş mülk için talep eşleştirme
- 2 mülkte eksik fotoğraf"
```

---

### 7. **Reminder Agent** (Hatırlatıcı Yöneticisi)

**Domain**: Contract reminders, follow-ups, task management

**Capabilities**:

**Queries**:
- List all reminders (upcoming, overdue, scheduled)
- Get reminders by urgency (expired, urgent, soon, upcoming)
- Find reminders for specific property/tenant
- Check overdue reminders
- View scheduled reminders for next X days

**Actions**:
- Mark reminder as contacted
- Unmark reminder (reopen)
- Update reminder settings (enable/disable, days before, expected new rent)
- Snooze reminder (custom date)

**Reminder Types**:
1. **Rent Increase Reminders**
   - Triggered by contract end date approaching
   - Customizable days before end (default: 30 days)
   - Can set expected new rent amount
   - Reminder notes field

2. **Contract Expiration Reminders**
   - Always triggered 30 days before end
   - Prompts renewal or termination decision

**Urgency Categories**:
- **Expired**: Contract already ended (>0 days past)
- **Urgent**: ≤30 days until end
- **Soon**: 31-60 days until end
- **Upcoming**: 61-90 days until end (or custom threshold)

**Tools**:
```typescript
// Reminder Tools
- remindersService.getAllReminders()
- remindersService.getActiveReminders()
- remindersService.getUpcomingReminders(daysAhead)
- remindersService.getOverdueReminders()
- remindersService.getScheduledReminders()
- remindersService.getExpiredContracts()
- remindersService.categorizeReminders(reminders)
- remindersService.getReminderUrgencyCategory(daysUntilEnd)

// Actions
- remindersService.markAsContacted(contractId)
- remindersService.markAsNotContacted(contractId)
- remindersService.updateReminderSettings(contractId, settings)
```

**Example Interactions**:
```
User: "Hangi sözleşmeler yakında bitiyor?"
Agent: "📅 Yaklaşan Sözleşme Hatırlatıcıları

🔴 ACİL (30 gün içinde)
1. Nişantaşı, Teşvikiye Cad. - Mehmet Yılmaz
   Bitiş: 15 Aralık 2024 (18 gün kaldı)
   Mevcut kira: 25.000 TRY
   Yeni kira önerisi: 28.000 TRY
   ❌ Henüz görüşülmedi

2. Kadıköy, Moda - Ayşe Demir
   Bitiş: 28 Aralık 2024 (31 gün kaldı)
   Mevcut kira: 18.000 TRY
   ✅ Görüşüldü (Yenileyecek)

🟡 YAKIN (60 gün içinde)
3. Beşiktaş, Barbaros Bulv. - Can Öztürk
   Bitiş: 5 Ocak 2025 (49 gün kaldı)
   Mevcut kira: 22.000 TRY
   ❌ Henüz görüşülmedi

İlk sıraya göre öncelik verin. Mehmet Yılmaz ile görüşmek ister misiniz?"
```

---

## 🔧 TOOLS LAYER

### Service Tools by Category

#### Property Operations
```typescript
// Properties
- getAll, getRentalProperties, getSaleProperties
- getById, getByOwnerId
- create, update, delete
- getStats, getPropertiesWithMissingInfo

// Photos
- uploadPhoto, deletePhoto, reorderPhotos, getPhotoCount

// Owners
- getAll, getById, create, update, delete
- getOwnersWithPropertyCount, getOwnersWithMissingInfo
```

#### Tenant & Contract Operations
```typescript
// Tenants
- getAll, getById, getUnassigned
- create, update, delete
- createTenantWithContract (ATOMIC)
- getStats, getTenantsWithMissingInfo

// Contracts
- getAll, getById, getByTenantId, getByPropertyId
- getActiveContracts, getExpiringContracts
- create, createWithStatusUpdate (RPC)
- update, delete (RPC)
- uploadContractPdfAndPersist, deleteContractPdf
- getStats
```

#### Financial Operations
```typescript
// Transactions
- getTransactions (filters), getTransactionById
- createTransaction, updateTransaction, deleteTransaction

// Categories
- getCategories, getCategoryById
- createCategory, updateCategory, deleteCategory
- getCategoryBreakdown, getTopCategories

// Recurring Expenses
- getRecurringExpenses, getRecurringExpenseById
- createRecurringExpense, updateRecurringExpense, deleteRecurringExpense
- processDueRecurringExpenses, markBillAsPaid
- getUpcomingRecurringExpenses

// Reports
- getMonthlySummary, getMonthlyTrends
- getFinancialDashboard, getFinancialRatios
- getBudgetVsActual, getYearlySummary
- getCashFlowForecast
- exportTransactionsToCSV

// Commissions
- getAll, getAllWithProperties, getByDateRange, getByType
- create, createSaleCommission (RPC)
- delete
- getStats, getMonthlyBreakdown
```

#### Inquiry & Matching Operations
```typescript
// Inquiries
- getAll, getRentalInquiries, getSaleInquiries
- getById, create, update, delete
- getActiveInquiries, getStats

// Matching
- checkMatchesForNewProperty (AUTO)
- createMatch, getMatchesByInquiry
- markAsContacted, markNotificationSent
- getUnreadMatchesCount
```

#### Calendar Operations
```typescript
// Meetings
- getAll, getById
- create, update, delete
- getByDateRange, getUpcoming
```

#### Reminder Operations
```typescript
// Reminders
- getAllReminders, getActiveReminders
- getUpcomingReminders, getOverdueReminders
- getScheduledReminders, getExpiredContracts
- categorizeReminders, getReminderUrgencyCategory

// Actions
- markAsContacted, markAsNotContacted
- updateReminderSettings
```

#### User Preferences
```typescript
// Preferences
- getPreferences, updatePreferences
- updateLanguage, updateCurrency, updateMeetingReminder
```

---

## 🔀 ORCHESTRATOR ROUTING LOGIC

### Query Analysis Steps

1. **Language Detection**: Turkish or English
2. **Intent Classification**: Query, Action, Analytics, or Mixed
3. **Entity Extraction**: Properties, tenants, contracts, dates, amounts, locations
4. **Context Loading**: User preferences, recent conversation, current filters
5. **Agent Selection**: One or more specialist agents
6. **Execution Plan**: Sequential or parallel agent calls
7. **Response Formatting**: Natural language with i18n

### Routing Decision Tree

```
User Query → Intent Analysis
│
├─ Property-related?
│  ├─ List/Search → Property Agent (query)
│  ├─ Create/Update → Property Agent (action)
│  └─ Stats → Analytics Agent
│
├─ Tenant/Contract-related?
│  ├─ List/Search → Tenant Agent (query)
│  ├─ Create Contract → Tenant Agent + Property Agent (multi-step)
│  ├─ Renew Contract → Tenant Agent (action)
│  └─ Expiring contracts → Reminder Agent
│
├─ Financial-related?
│  ├─ Transactions → Financial Agent (query/action)
│  ├─ Reports → Financial Agent (analytics)
│  ├─ Commissions → Financial Agent
│  └─ Budget → Financial Agent (analytics)
│
├─ Inquiry-related?
│  ├─ Create Inquiry → Inquiry Agent (auto-triggers matching)
│  ├─ View Matches → Inquiry Agent (query)
│  └─ Match Stats → Analytics Agent
│
├─ Calendar-related?
│  ├─ Schedule → Calendar Agent (action)
│  ├─ View Schedule → Calendar Agent (query)
│  └─ Meeting Stats → Analytics Agent
│
├─ Reminder-related?
│  ├─ View Reminders → Reminder Agent (query)
│  ├─ Mark Contacted → Reminder Agent (action)
│  └─ Reminder Stats → Analytics Agent
│
└─ General Analytics?
   └─ Analytics Agent (comprehensive)
```

### Multi-Agent Coordination Examples

**Complex Query**: "Boş mülklerim için aktif talep var mı?"
```
Execution Plan:
1. Property Agent: Get empty properties
2. Inquiry Agent: Get active inquiries
3. Inquiry Agent: Check matches for each empty property
4. Orchestrator: Aggregate results
Response: "5 boş mülkünüz için toplam 12 aktif talep eşleşmesi bulundu..."
```

**Complex Action**: "Yeni kiracı ekle ve sözleşme yap"
```
Execution Plan:
1. Tenant Agent: Collect tenant information (multi-turn)
2. Property Agent: Verify property is Empty
3. Tenant Agent: Collect contract details (multi-turn)
4. Tenant Agent: Create tenant + contract atomically
5. Property Agent: Confirm status update to Occupied
6. Reminder Agent: Confirm reminder created
Response: "✅ Kiracı ve sözleşme başarıyla oluşturuldu..."
```

**Complex Analytics**: "Bu yılki performansımı göster"
```
Execution Plan (parallel):
1. Analytics Agent: Get financial summary
2. Analytics Agent: Get property stats
3. Analytics Agent: Get commission breakdown
4. Analytics Agent: Get inquiry stats
5. Orchestrator: Format comprehensive report
Response: [Formatted dashboard with all metrics]
```

---

## 📊 AGENT INTERACTION PATTERNS

### Pattern 1: Simple Query (Single Agent)
```
User: "Kadıköy'de kaç mülküm var?"
→ Property Agent.query(location="Kadıköy")
→ Response: "Kadıköy'de 12 mülkünüz var (8 kiralık, 4 satılık)"
```

### Pattern 2: Multi-Turn Dialogue (Context Retention)
```
User: "Mülklerimi göster"
→ Property Agent.list()
→ Response: "42 mülkünüz var. Nasıl filtrelemek istersiniz?"

User: "Sadece boş kiralıklar"
→ Property Agent.list(status="Empty", type="rental")
→ Response: "5 boş kiralık mülk bulundu: [list]"

User: "Bunlardan Beşiktaş'takiler?"
→ Property Agent.list(status="Empty", type="rental", city="Beşiktaş")
→ Response: "Beşiktaş'ta 2 boş kiralık mülk: [list]"
```

### Pattern 3: Clarification (Disambiguation)
```
User: "Ahmet'in sözleşmesi ne zaman bitiyor?"
→ Orchestrator detects ambiguity (multiple "Ahmet" in DB)
→ Response: "3 Ahmet var:
   1. Ahmet Yılmaz (Kiracı - Nişantaşı)
   2. Ahmet Öztürk (Mal Sahibi - 5 mülk)
   3. Ahmet Demir (Kiracı - Kadıköy)
   Hangisini kastediyorsunuz?"

User: "Birinci"
→ Tenant Agent.getContracts(tenantName="Ahmet Yılmaz")
→ Response: "Ahmet Yılmaz'ın sözleşmesi 15 Aralık 2024'te bitiyor (18 gün kaldı)"
```

### Pattern 4: Confirmation (Critical Actions)
```
User: "Barbaros'taki mülkü sil"
→ Property Agent identifies property
→ Response: "⚠️ DİKKAT: Bu mülk silinecek:
   📍 Beşiktaş, Barbaros Bulvarı No:45
   💰 Kira: 15.000 TRY
   📸 8 fotoğraf

   Bu mülkle ilişkili:
   - 1 aktif sözleşme
   - 2 geçmiş sözleşme
   - 3 talep eşleşmesi

   Tüm ilişkili kayıtlar silinecek. Emin misiniz?"

User: "Evet, eminim"
→ Property Agent.delete(id)
→ Response: "✅ Mülk ve ilişkili kayıtlar silindi"
```

### Pattern 5: Progressive Disclosure (Complex Forms)
```
User: "Yeni mülk ekle"
→ Property Agent starts multi-turn form
→ "Yeni mülk ekleyelim. Kiralık mı satılık mı?"

User: "Kiralık"
→ "Anladım, kiralık mülk. Adresi nedir?"

User: "Nişantaşı, Teşvikiye Cad. No:12"
→ "Teşekkürler. Mal sahibi kim? (Yeni ekle veya mevcut listeden seç)"

User: "Mehmet Öztürk"
→ "Mehmet Öztürk seçildi. Aylık kira tutarı?"

User: "25.000 TRY"
→ "Anladım. Mülk durumu? (Boş/Dolu/Pasif)"

User: "Boş"
→ "Bilgiler tamam:
   📍 Nişantaşı, Teşvikiye Cad. No:12
   👤 Mal Sahibi: Mehmet Öztürk
   💰 Kira: 25.000 TRY/ay
   📊 Durum: Boş

   Onaylıyor musunuz?"

User: "Evet"
→ Property Agent.create(data)
→ Inquiry Agent.checkMatches(newPropertyId)
→ "✅ Mülk başarıyla eklendi!
   🔍 2 aktif talep ile eşleşti:
   1. Ayşe Demir - 20.000-30.000 TRY
   2. Can Yılmaz - 22.000-28.000 TRY

   Fotoğraf eklemek ister misiniz?"
```

### Pattern 6: Proactive Assistance
```
User: "Sözleşme oluştur"
→ Orchestrator checks prerequisites
→ Response: "Sözleşme oluşturmak için:
   1. Kiracı bilgisi gerekli
   2. Boş bir mülk gerekli

   Yeni kiracı mı eklemek istiyorsunuz yoksa mevcut kiracılardan biri mi?

   Mevcut Kiracılar (Atanmamış):
   - Zeynep Kaya
   - Can Öztürk

   veya 'Yeni kiracı' deyin"
```

---

## 💬 EXAMPLE USE CASES

### Use Case 1: Morning Briefing
```
User: "Günaydın! Bugün ne yapmalıyım?"

Orchestrator:
→ Calendar Agent: Today's meetings
→ Reminder Agent: Urgent reminders
→ Inquiry Agent: New matches
→ Analytics Agent: Quick stats

Response:
"☀️ Günaydın! Bugün için özet:

📅 RANDEVULAR (3 adet)
10:00 - Mülk gösterimi (Can Yılmaz)
14:30 - Sözleşme imza (Zeynep Kaya)
17:00 - Mal sahibi toplantısı (Ahmet Öztürk)

⚠️ ACİL HATIRLATICILAR (2 adet)
- Mehmet Yılmaz sözleşmesi 18 gün sonra bitiyor
- Ayşe Demir'le kira artışı konuşulmalı

✨ YENİ EŞLEŞMELER (3 adet)
Dün eklediğiniz Kadıköy mülkü 3 talep ile eşleşti

📊 HIZLI İSTATİSTİK
- 5 boş mülk
- 21 aktif sözleşme (%75 doluluk)
- Bu ay net kar: 99.200 TRY

Detay görmek ister misiniz?"
```

### Use Case 2: Property Management
```
User: "Beşiktaş'ta yeni satılık mülk ekle, 3.5 milyon TRY"

Property Agent (multi-turn):
→ "Anladım, Beşiktaş'ta 3.5M TRY satılık mülk.
   Tam adresi söyler misiniz?"

User: "Barbaros Bulvarı No:67, Daire 8"

→ "Teşekkürler. Mal sahibi bilgisi?
   Mevcut mal sahipleri: [Liste]
   veya yeni ekleyelim mi?"

User: "Yeni mal sahibi: Elif Yılmaz, 0532 111 22 33"

→ "Elif Yılmaz eklendi. Başka bilgi eklemek ister misiniz?
   (Örn: daire özellikleri, notlar)"

User: "3+1, 150 m2, deniz manzaralı"

→ Property Agent.create(data)
→ Inquiry Agent.checkMatches(propertyId)

Response:
"✅ Mülk başarıyla eklendi!
📍 Beşiktaş, Barbaros Bulvarı No:67, Daire 8
👤 Mal Sahibi: Elif Yılmaz (0532 111 22 33)
💰 Fiyat: 3.500.000 TRY
📏 3+1, 150 m2, Deniz manzaralı

🔍 Eşleştirme sonucu: 4 aktif alıcı talebi bulundu!
1. Serkan Demir - 3M-4M TRY bütçe
2. Aylin Kaya - 3.2M-3.8M TRY bütçe
3. Burak Öztürk - 3M-3.5M TRY bütçe
4. Canan Yılmaz - 3.5M-4.5M TRY bütçe

Fotoğraf eklemek ister misiniz?"
```

### Use Case 3: Financial Analysis
```
User: "2024 yılı finansal özetimi ver"

Financial Agent + Analytics Agent:
→ getYearlySummary(2024)
→ getMonthlyBreakdown(2024)
→ commissionsService.getMonthlyBreakdown(2024)
→ getFinancialRatios()

Response:
"📊 2024 YILI FİNANSAL ÖZETİ

💰 GELİR (Toplam: 1.485.000 TRY)
├─ Kira Komisyonları: 945.000 TRY (%64)
│  └─ Ortalama: 78.750 TRY/ay
├─ Satış Komisyonları: 485.000 TRY (%33)
│  └─ 7 satış tamamlandı
└─ Diğer Gelir: 55.000 TRY (%3)

💸 GİDER (Toplam: 312.000 TRY)
├─ Ofis Kirası: 180.000 TRY (%58)
├─ Mülk Bakımı: 78.000 TRY (%25)
├─ Pazarlama: 32.000 TRY (%10)
└─ Diğer: 22.000 TRY (%7)

📈 NET KAR: 1.173.000 TRY
📊 Kar Marjı: %79

📉 AYLIK TREND
En iyi ay: Haziran (152K TRY)
En düşük ay: Ocak (68K TRY)
Ortalama: 97.750 TRY/ay

🎯 2025 TAHMİNİ
Mevcut trendlerle: ~1.6M TRY bekleniyor (+%11)

CSV export ister misiniz?"
```

### Use Case 4: Contract Renewal
```
User: "Mehmet Yılmaz'ın sözleşmesini yenile"

Tenant Agent:
→ getContractsByTenant("Mehmet Yılmaz")
→ Detects expiring contract

Response:
"Mehmet Yılmaz'ın mevcut sözleşmesi:
📍 Mülk: Nişantaşı, Teşvikiye Cad. No:12
📅 Başlangıç: 1 Ocak 2024
📅 Bitiş: 1 Ocak 2025 (18 gün kaldı)
💰 Mevcut kira: 25.000 TRY
💡 Önerilen yeni kira: 28.000 TRY

Yeni sözleşme detayları:
1. Başlangıç tarihi? (Varsayılan: 1 Ocak 2025)"

User: "Evet, 1 Ocak 2025"

→ "2. Süre? (Varsayılan: 1 yıl)"

User: "1 yıl"

→ "3. Yeni kira tutarı?"

User: "27.500 TRY"

→ "Bilgiler hazır:
   📅 Yeni süre: 1 Ocak 2025 - 1 Ocak 2026
   💰 Yeni kira: 27.500 TRY (+%10)

   Onaylıyor musunuz?"

User: "Evet"

Tenant Agent:
→ create new contract
→ archive old contract
→ mark reminder as contacted

Response:
"✅ Sözleşme başarıyla yenilendi!
📄 Yeni Sözleşme No: #SZ-2025-045
📅 Süre: 1 Ocak 2025 - 1 Ocak 2026
💰 Kira: 27.500 TRY/ay
📈 Artış: %10

✅ Eski sözleşme arşivlendi
✅ Hatırlatıcı 'görüşüldü' olarak işaretlendi
✅ Yeni hatırlatıcı 2 Aralık 2025 için ayarlandı

Yeni sözleşme PDF'i yüklemek ister misiniz?"
```

### Use Case 5: Inquiry Management
```
User: "Kiralık arayan yeni müşteri var"

Inquiry Agent:
→ Start multi-turn form

Response: "Yeni kiralık talebi oluşturalım. Müşteri bilgileri?"

User: "Selin Aydın, 0533 777 88 99, selin@email.com"

→ "Teşekkürler. Hangi bölgelerde arıyor?"

User: "Kadıköy, Moda, Fenerbahçe"

→ "Anladım. Bütçe aralığı?"

User: "18.000-25.000 TRY"

→ "Başka istekleri var mı? (Oda sayısı, özellikler, vb.)"

User: "Deniz manzaralı, en az 2+1"

→ Inquiry Agent.create(data)
→ Inquiry Agent.matchInquiries(inquiryId)

Response:
"✅ Talep kaydedildi!
👤 Selin Aydın
📱 0533 777 88 99
📧 selin@email.com
📍 Kadıköy, Moda, Fenerbahçe
💰 18.000-25.000 TRY
📋 Deniz manzaralı, en az 2+1

🔍 Eşleşen Mülkler: 7 adet bulundu!

🏆 ÖNE ÇIKAN EŞLEŞMELER:
1. ⭐ Mükemmel Eşleşme
   📍 Moda, Rıhtım Cad. No:34
   💰 22.000 TRY - 3+1, 140 m2
   🌊 Deniz manzaralı, 5. kat
   📸 10 fotoğraf mevcut

2. ⭐ Mükemmel Eşleşme
   📍 Fenerbahçe, Bağdat Cad.
   💰 24.000 TRY - 2+1, 120 m2
   🌊 Deniz manzaralı, 8. kat
   📸 7 fotoğraf mevcut

3. ✅ İyi Eşleşme
   📍 Kadıköy, Bahariye Cad.
   💰 19.500 TRY - 2+1, 110 m2
   📸 6 fotoğraf mevcut

Tüm eşleşmeleri görmek ister misiniz?
Müşteriyle görüşme randevusu ayarlayalım mı?"
```

---

## 🔐 SECURITY & PRIVACY

### Row-Level Security (RLS)
- All queries automatically filtered by `user_id`
- Users can only access their own data
- RLS enforced at database level

### Data Validation
- Input sanitization before DB operations
- Business rule validation (dates, amounts, statuses)
- File upload validation (size, type)

### Sensitive Operations
- Critical actions require confirmation
- Deletions logged for audit trail
- PDF/photo uploads scanned for size limits

### User Context
- Session management via Supabase Auth
- Language preference from user_preferences
- Currency preference for display formatting

---

## 🌐 INTERNATIONALIZATION

### Language Support
- **Primary**: Turkish (tr)
- **Secondary**: English (en)

### Translation Strategy
- All agent responses use i18n keys
- Dynamic translations based on user preference
- Fallback to Turkish if translation missing

### Example Bilingual Responses

**Turkish**:
```
"✅ Mülk başarıyla eklendi!
📍 Kadıköy, Bahariye Cad.
💰 18.000 TRY/ay
🔍 3 talep ile eşleşti"
```

**English**:
```
"✅ Property added successfully!
📍 Kadıköy, Bahariye Street
💰 18,000 TRY/month
🔍 Matched with 3 inquiries"
```

---

## 📱 INTERFACE CONSIDERATIONS

### Chat Interface (Recommended)
- Mobile-first design
- Voice input support (Turkish speech recognition)
- Rich media responses (photos, tables, charts)
- Quick action buttons for common tasks
- Context-aware suggestions

### Alternative Interfaces
1. **Slack/WhatsApp Integration**: Chat-based via messaging platforms
2. **Voice Assistant**: Alexa/Google Home integration
3. **SMS Commands**: Simple queries via text message
4. **Mobile App Widget**: Quick stats and actions

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Core Orchestrator (MVP)
- Build orchestrator agent with basic routing
- Implement Property Agent (most frequently used)
- Implement Inquiry Agent (high-value matching)
- Turkish language support
- Text-based chat interface

### Phase 2: Financial & Analytics
- Implement Financial Agent
- Implement Analytics Agent
- Add complex report generation
- CSV export functionality

### Phase 3: Contract Management
- Implement Tenant Agent
- Implement Reminder Agent
- Multi-step workflows (tenant+contract creation)
- PDF handling

### Phase 4: Calendar & Advanced Features
- Implement Calendar Agent
- Meeting reminders and notifications
- Voice interface support
- WhatsApp integration

### Phase 5: Intelligence & Automation
- Predictive analytics (forecasting)
- Proactive recommendations
- Automated matching improvements
- Learning from user feedback

---

## 📊 SUCCESS METRICS

### User Engagement
- Daily active users
- Queries per session
- Multi-turn conversation length
- Repeat usage rate

### Accuracy Metrics
- Intent classification accuracy (>95% target)
- Entity extraction accuracy (>90% target)
- Successful task completion rate (>85% target)
- User satisfaction ratings

### Business Impact
- Time saved per task (vs manual UI navigation)
- Faster contract renewals
- Higher inquiry match rates
- Improved data quality (fewer missing fields)

### System Performance
- Average query response time (<2 seconds)
- Multi-agent coordination latency
- API call efficiency
- Error rate (<1%)

---

## 🛠️ TECHNICAL STACK RECOMMENDATIONS

### LLM Framework
- **LangChain** or **LlamaIndex** for agent orchestration
- **LangGraph** for complex multi-agent workflows

### LLM Models
- **Orchestrator**: GPT-4 Turbo or Claude Sonnet (complex routing)
- **Specialist Agents**: GPT-3.5 Turbo or Claude Haiku (focused tasks)
- **Turkish Language**: Ensure model supports Turkish well

### Vector Database (Optional)
- **Supabase pgvector** for semantic search
- Property descriptions, inquiry requirements matching
- Conversation history retrieval

### Memory & State
- **Redis** or **Upstash** for conversation context
- Session state management
- Recent entity cache

### Backend Integration
- **Supabase Edge Functions** for agent execution
- **Webhooks** for real-time notifications
- **Serverless** for scalability

---

## 📝 NEXT STEPS

To implement this agentic system:

1. **Design Agent Prompts**: Write detailed system prompts for each specialist agent
2. **Build Orchestrator**: Implement routing logic and intent classification
3. **Create Tools Layer**: Wrap existing services as agent tools
4. **Implement MVP Agents**: Start with Property + Inquiry agents
5. **Build Chat Interface**: Simple text-based UI for testing
6. **Test with Real Queries**: Turkish real estate agent scenarios
7. **Iterate and Improve**: Based on accuracy metrics
8. **Add Remaining Agents**: Financial, Tenant, Calendar, etc.
9. **Production Deploy**: Edge Functions or containerized deployment
10. **Monitor and Optimize**: Track metrics and user feedback

---

**Ready to build your Real Estate AI Assistant!** 🏢🤖

This system will transform how agents interact with your CRM, making it as easy as having a conversation.
