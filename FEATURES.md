# KarriärOps - Förbättringar enligt Best Practice

## Genomförda förbättringar

### 1. ✅ Workflow från CRM → ERP → Resurs

**CRM Status-hantering:**
- Deals har status: `PROSPEKT`, `MOTE`, `OFFERT`, `VUNNEN`, `FORLORAD`
- När en deal når status `VUNNEN` kan den flyttas till ERP

**Endpoints:**
- `PATCH /api/crm/deals/:id/stage` - Ändra status på affär
- `POST /api/crm/deals/:id/to-invoice` - Skapa faktura från vunnen affär

**Exempel:**
```json
// Ändra deal-status till VUNNEN
PATCH /api/crm/deals/123/stage
{ "fas": "VUNNEN", "sannolikhet": 100 }

// Skapa faktura från vunnen deal
POST /api/crm/deals/123/to-invoice
{ 
  "beloppSEK": 500000, 
  "forfallodatum": "2026-03-31T00:00:00Z" 
}
```

---

### 2. ✅ HR-modul med status-hantering

**Employee-status:**
- `AKTIV` - Anställd som arbetar
- `ONBOARDING` - Ny anställd i upplärning
- `OFFBOARDING` - Anställd som slutar
- `UPPSAGD` - Avslutad anställning

**Endpoints:**
- `POST /api/hr/employees` - Lägg till ny anställd
- `PATCH /api/hr/employees/:id/status` - Ändra status på anställd
- `GET /api/hr/employees` - Lista alla anställda

**Exempel:**
```json
// Säg upp en anställd
PATCH /api/hr/employees/123/status
{ "status": "UPPSAGD" }
```

---

### 3. ✅ Händelselogg med status-tracking

**Automatisk loggning:**
Systemet loggar automatiskt när:
- Deal-status ändras (OFFERT → VUNNEN)
- Invoice skapas eller betalas
- Employee-status ändras
- Nya rader skapas i CRM/ERP/HR/Resurs

**Event-typer:**
- `DEAL_FAS_ANDRAD` - Deal-status ändrad
- `DEAL_TILL_FAKTURA` - Deal flyttad till ERP
- `INVOICE_STATUS_ANDRAD` - Faktura-status ändrad
- `EMPLOYEE_STATUS_ANDRAD` - Anställd-status ändrad
- `EMPLOYEE_SKAPAD` - Ny anställd
- `DEAL_SKAPAD` - Ny affär
- `INVOICE_SKAPAD` - Ny faktura

**Endpoint:**
- `GET /api/data/events?page=1&pageSize=20` - Hämta händelselogg

---

### 4. ✅ Kundnamn och IDs i alla endpoints

**Förbättrade relationer:**
Alla endpoints returnerar nu relaterad data via MongoDB populate:

- **Deals** visar accountNamn och bransch
- **Contacts** visar account-information
- **Invoices** visar deal-information
- **Projects** visar account-information
- **Assignments** visar employee och project-information

**Exempel:**
```json
// GET /api/crm/deals
{
  "items": [
    {
      "_id": "abc123",
      "namn": "CRM-uppgradering",
      "vardeSEK": 850000,
      "fas": "VUNNEN",
      "accountId": {
        "_id": "account456",
        "namn": "Northwind Sverige AB",
        "bransch": "Retail / E-handel"
      }
    }
  ]
}
```

---

### 5. ✅ Dashboard med KPI-aggregering

**Nya Dashboard-endpoints:**

#### `/api/data/dashboard/overview`
Översikt med totaler och statistik:
- Deals per status (PROSPEKT, VUNNEN etc.)
- Invoices per status (UTKAST, BETALD etc.)
- Employees per status (AKTIV, UPPSAGD etc.)
- Total revenue (summa betalda fakturor)
- Antal aktiva anställda

#### `/api/data/dashboard/consultant-utilization`
Beläggning per konsult:
- Visa varje konsults beläggning i procent
- Lista aktiva projekt per konsult
- Visar om konsult är fullt eller delvis bokad

**Exempel:**
```json
{
  "employeeId": "123",
  "employeeNamn": "Erik Larsson",
  "belaggningPct": 80,
  "assignments": 2,
  "projects": [
    {
      "projectNamn": "Baltic Implementation",
      "belaggningPct": 60,
      "fran": "2024-12-10",
      "till": "2025-03-31"
    }
  ]
}
```

#### `/api/data/dashboard/revenue-by-customer`
Intäkt per kund:
- Total revenue per account
- Antal fakturor per kund
- Sorterad efter högst intäkt

**Exempel:**
```json
[
  {
    "_id": "account123",
    "accountNamn": "Northwind Sverige AB",
    "accountBransch": "Retail",
    "totalRevenue": 2100000,
    "invoiceCount": 5
  }
]
```

#### `/api/data/dashboard/revenue-by-consultant`
Intäkt per konsult (estimerad):
- Uppskattar konsultens bidrag till revenue baserat på beläggning
- Visar antal assignments per konsult

---

## Datamodell med ObjectId-referenser

Alla modeller använder nu MongoDB ObjectId-referenser för relationer:
- `Deal.accountId` → `Account._id`
- `Contact.accountId` → `Account._id`
- `Invoice.dealId` → `Deal._id`
- `Project.accountId` → `Account._id`
- `Assignment.employeeId` → `Employee._id`
- `Assignment.projectId` → `Project._id`

Detta möjliggör:
- Populate-funktionalitet (visa relaterad data)
- Referensintegritet
- Aggregerade queries för KPIs

---

## API-endpoints - Komplett lista

### CRM
- `GET /api/crm/deals` - Lista deals med kundnamn
- `POST /api/crm/deals` - Skapa ny deal
- `PATCH /api/crm/deals/:id/stage` - Ändra deal-status
- `POST /api/crm/deals/:id/to-invoice` - Flytta vunnen deal till ERP

### ERP
- `GET /api/erp/invoices` - Lista fakturor med deal-info
- `POST /api/erp/invoices` - Skapa faktura
- `PATCH /api/erp/invoices/:id/status` - Ändra faktura-status
- `POST /api/erp/invoices/:id/pay` - Markera faktura som betald

### HR
- `GET /api/hr/employees` - Lista anställda
- `POST /api/hr/employees` - Lägg till anställd
- `PATCH /api/hr/employees/:id/status` - Ändra anställd-status

### Resurs
- `GET /api/resurs/projects` - Lista projekt med kundinfo
- `POST /api/resurs/projects` - Skapa projekt
- `GET /api/resurs/assignments` - Lista assignments med employee/project-info
- `POST /api/resurs/assignments` - Skapa assignment

### Dashboard
- `GET /api/data/dashboard/overview` - Översikt med KPIs
- `GET /api/data/dashboard/consultant-utilization` - Beläggning per konsult
- `GET /api/data/dashboard/revenue-by-customer` - Intäkt per kund
- `GET /api/data/dashboard/revenue-by-consultant` - Intäkt per konsult

### Data
- `GET /api/data/events` - Händelselogg med status-ändringar

---

## Användarflöde - Exempel

### Scenario: Från Lead till Leverans

1. **Lead skapas** → `POST /api/crm/leads`
2. **Lead konverteras till Account + Deal** → `POST /api/crm/accounts`, `POST /api/crm/deals`
3. **Deal flyttas genom pipeline:**
   - `PROSPEKT` → `MOTE` → `OFFERT` → `VUNNEN`
   - `PATCH /api/crm/deals/:id/stage`
4. **Deal → Invoice:** → `POST /api/crm/deals/:id/to-invoice`
5. **Projekt skapas:** → `POST /api/resurs/projects`
6. **Konsult tilldelas:** → `POST /api/resurs/assignments`
7. **Faktura betalas:** → `POST /api/erp/invoices/:id/pay`

Alla steg loggas automatiskt i händelseloggen!

---

## Best Practices implementerade

✅ **Datarelationer** - ObjectId-referenser mellan tabeller
✅ **Populate** - Visa relaterad data i responses
✅ **Event Sourcing** - Alla ändringar loggas med tidsstämpel
✅ **Status Workflow** - Tydliga status-övergångar
✅ **KPI Aggregation** - Dashboard med MongoDB aggregation pipeline
✅ **RESTful API** - Konsekvent endpoint-design
✅ **Input Validation** - Zod-schemas för alla inputs
✅ **Authorization** - Rollbaserad åtkomstkontroll (ADMIN, CHEF, MEDARBETARE)

---

## Nästa steg (valfritt)

- Frontend-komponenter för nya endpoints
- Email-notifieringar vid status-ändringar
- Export till Excel/PDF för rapporter
- Grafiska charts för dashboard-data
- Automatiska påminnelser för förfallna fakturor
