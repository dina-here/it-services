# KarriärOps - IT services POC

🚀 Publik länk - Live Demo: https://it-services-2ywb.onrender.com/

Fullstack POC (CRM, ERP, HR, Resurs, Data) byggd i React, TypeScript, Node.js och MongoDB.

## Obs:
Demo körs på Render free tier. Efter ~15 min utan trafik kan första laddningen ta lite längre tid (cold start). Detta är normalt för portfolio-demos.

## Starta projektet lokalt
```bash
docker-compose up --build

KarriärOps är en proof-of-concept för ett modulärt affärssystem för ett IT-/konsultbolag.

## Funktioner
- Dashboard (totala tal, affärer per status, bekäggning / intäkt per konsult, intäkt per kund)
- CRM (leads, accounts, kontakter, affärer) - i framtiden ska utveckla till Kundhantering
- Mini-ERP (fakturor kopplade till affärer) - i framtiden ska utveckla till Affärsprocesser
- HR (anställda, roller, kompetenser)
- Resurssystem (projekt, beläggning/assignments)
- Dataplattform (händelselogg + KPI:er) - i framtiden ska utveckla till Samlad data

## Teknikstack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript + Express
- DB: MongoDB
- DevOps: Docker + Docker Compose, GitHub Actions
- Säkerhet: JWT + RBAC (Admin / Chef / Medarbetare)

## Språk
- Svenska 🇸🇪
- Engelska 🇬🇧 (växlas via knapp i UI)
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
- Admin: `admin@karriarops.se` / `Losen123!`
- Chef: `chef@karriarops.se` / `Losen123!`
- Medarbetare: `medarbetare@karriarops.se` / `Losen123!`

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

## Licens
MIT
