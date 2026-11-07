# MACOF Holding — Monorepo

Site vitrine + tableau de bord d'administration du groupe MACOF Holding.

## Structure

```
macof_holding_final/
├── frontend/   → Site public + dashboard admin (React 19, Vite, Tailwind, TanStack Query)
└── backend/    → API (Hono, Drizzle ORM, Neon PostgreSQL serverless, zod, JWT)
```

## Développement local

```bash
# Backend (port 3001)
cd backend
npm install
cp .env.example .env        # renseigner DATABASE_URL + JWT_SECRET (min 32 caractères)
npm run dev

# Frontend (port 5173)
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:3001/api/v1
npm run dev
```

## Variables d'environnement (backend)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion Neon PostgreSQL (obligatoire) |
| `JWT_SECRET` | Signature des tokens admin — **min 32 caractères** (obligatoire, le serveur refuse de démarrer sinon) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob — stockage des images (production) |
| `GEMINI_API_KEY` | Chatbot vocal d'administration |
| `DJOMY_CLIENT_SECRET` | Signature du webhook de paiement Djomy |
| `SMTP_PASSWORD` | Fallback SMTP (la config principale est en base, table `settings`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Uniquement pour `npm run db:seed` |

## Déploiement (Vercel)

- **Backend** : projet Vercel sur `backend/` (framework Hono, driver Neon serverless)
- **Frontend** : projet Vercel sur `frontend/` avec `VITE_API_URL` = URL du backend

## Sécurité — bonnes pratiques de ce repo

- Aucune clé en dur : tout passe par les variables d'environnement
- Routes d'écriture protégées par JWT + rôles (`admin` / `gestionnaire`)
- Validation zod sur toutes les entrées admin
- Rate limiting sur le login, comparaisons à temps constant (webhook)
- `.env` ignoré par git à la racine, dans `frontend/` et `backend/`
