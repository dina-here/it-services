# KarriärOps (POC)

> **Svenska först**, men applikationen har språkknapp (SV/EN) uppe till höger.

KarriärOps är en **proof-of-concept** för ett modulärt affärssystem för ett IT-/konsultbolag:
- **CRM** (leads, accounts, kontakter, affärer)
- **Mini-ERP** (fakturor kopplade till affärer)
- **HR** (anställda, roller, kompetenser)
- **Resurssystem** (projekt, beläggning/assignments)
- **Dataplattform** (händelselogg + KPI:er)

## Teknik
- Frontend: **React + TypeScript + Vite**
- Backend: **Node.js + TypeScript + Express**
- DB: **MongoDB (Mongoose)**
- DevOps: **Docker + Docker Compose**, **GitHub Actions**
- Säkerhet: **JWT + RBAC** (Admin / Chef / Medarbetare)

---

## Kör lokalt (Docker)
1. Skapa en `.env` för API:
   - Kopiera `apps/api/.env.example` till `apps/api/.env`
2. Starta allt:
   ```bash
   docker compose up --build
   ```
3. Öppna:
   - Web: http://localhost:5173
   - API: http://localhost:4000/health

### Logga in (demo)
Efter seed finns demoanvändare:
- **Admin**: `admin@karriarops.se` / `Losen123!`
- **Chef**: `chef@karriarops.se` / `Losen123!`
- **Medarbetare**: `medarbetare@karriarops.se` / `Losen123!`

> Du kan köra seed manuellt: `npm run seed`

---

## Utveckling utan Docker
1. Installera:
   ```bash
   npm install
   ```
2. Starta API och Web:
   ```bash
   npm run dev
   ```
3. Seeda:
   ```bash
   npm run seed
   ```

---

## Produktion / Publik länk
För att göra POC:en publik (en URL att lägga på LinkedIn) finns en guide i:
- `DEPLOYMENT.md`

---

## Licens
MIT
