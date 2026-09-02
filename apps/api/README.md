# Next.js backend setup for mobile auth

## 1) Install deps
npm install

## 2) Configure env
copy .env.example .env

## 3) Prepare Prisma User table
npx prisma generate
npx prisma db push

## 4) Run backend
npm run dev

Health: http://localhost:3000/api/health

## Auth endpoints
- POST /api/auth/signup
  body: { "name", "email", "password", "confirmPassword" }
- POST /api/auth/login
  body: { "email", "password" }

## Expo app env (`apps/mobile/.env`)
For real phone, use your PC LAN IP, not localhost:
EXPO_PUBLIC_NEXT_API_URL=http://192.168.1.73:3000
