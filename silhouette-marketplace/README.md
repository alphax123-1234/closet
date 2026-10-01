# Silhouette Marketplace: setup

```
silhouette-marketplace/
├── .gitignore
├── backend/    (Express API, holds the secret Fal key)
└── frontend/   (Next.js + Tailwind, public values only)
```

## 1. Git
```bash
cd silhouette-marketplace
git init
git add .
git status          # confirm no .env or node_modules appear
git commit -m "chore: initial project structure"
```
Check `.env` is ignored: `git check-ignore -v backend/.env`

## 2. Backend
```bash
cd backend
npm install
cp .env.example .env     # then paste your real FAL_KEY into .env
npm run dev              # http://localhost:4000
```
Quick test:
```bash
curl -X POST http://localhost:4000/api/try-on \
  -H "Content-Type: application/json" \
  -d '{"mannequinUrl":"https://.../model.png","garmentUrl":"https://.../shirt.png","clothingCategory":"tops"}'
```

## 3. Frontend
Create the Next.js app inside `frontend/` (keep our files: copy them in afterwards, or move them aside first):
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
npm install framer-motion
cp .env.example .env.local
npm run dev              # http://localhost:3000
```
Put `app-page.tsx.txt`'s contents into `app/page.tsx`.
`components/FittingRoomLayout.tsx` and `data/products.ts` should sit at the frontend root (matching the `@/` alias).

## Secret separation
| Value | Lives in | Visible to browser? |
|---|---|---|
| FAL_KEY | backend/.env | No |
| FRONTEND_ORIGIN, PORT | backend/.env | No |
| NEXT_PUBLIC_API_URL, NEXT_PUBLIC_MANNEQUIN_URL | frontend/.env.local | Yes (public by design) |
