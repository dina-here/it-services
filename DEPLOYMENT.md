# Deployment (publik demo-länk)

Målet: **en URL** du kan lägga på LinkedIn där vem som helst kan klicka och se POC:en.

Den enklaste vägen är att köra **en enda server** som:
1) exponerar API:t och  
2) serverar den byggda React-appen som statiska filer.

Då får du **en** publikt delbar länk.

---

## Alternativ A (rekommenderat): Fly.io (Docker) + MongoDB Atlas

### 1) Skapa en MongoDB Atlas-databas
- Skapa en cluster i Atlas och hämta en **SRV connection string** på formatet `mongodb+srv://...` citeturn0search3turn0search11  
- Lägg till en databas-användare och tillåt IP-access (för demo kan du temporärt tillåta 0.0.0.0/0).

### 2) Bygg en “production image” (serverar både web + api)
I repo-rot:
- `Dockerfile.prod` bygger web och api och serverar allt via Express.

### 3) Deploy på Fly.io
Fly har officiellt stöd för att deploya direkt från en Dockerfile med `fly launch` citeturn0search1

**Grova steg:**
1. Installera `flyctl` och logga in
2. Kör i repo-rot:
   ```bash
   fly launch
   ```
3. Sätt secrets (env):
   ```bash
   fly secrets set MONGO_URL="mongodb+srv://..." JWT_SECRET="en_stark_hemlighet" CORS_ORIGIN="https://din-app.fly.dev"
   ```
4. Deploy:
   ```bash
   fly deploy
   ```

När det är klart får du en publik URL.

---

## Alternativ B: Render (Docker) + MongoDB Atlas

Render kan deploya tjänster från Docker citeturn0search12

1) Skapa en **Web Service** på Render kopplat till ditt GitHub-repo  
2) Välj “Docker” och peka på `Dockerfile.prod`  
3) Sätt env:
- `MONGO_URL`
- `JWT_SECRET`
- `CORS_ORIGIN` (samma domän i prod)
4) Deploy.

---

## Tips: “Läs-läge” för publik demo
Om du vill att vem som helst ska kunna se data utan att logga in:
- skapa en endpoint i API som bara ger **read-only** demo-data, eller
- skapa en “Guest”-roll med begränsade rättigheter.

(Just nu kräver UI inloggning för att hålla POC:en enkel och säker.)

---

## Saker att tänka på
- **Lägg aldrig riktiga secrets i GitHub.** Använd Render/Fly secrets.
- Begränsa Atlas IP-access när du är klar.
- Byt lösenord/secret i prod.

