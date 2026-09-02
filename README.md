# Asian Spices Monorepo

## Apps
- `apps/mobile` - Expo React Native app
- `apps/api` - Next.js API backend

## Packages
- `packages/shared` - shared types/utilities (optional)

## Install
```bash
npm install
```

## Run
```bash
npm run api:dev
npm run mobile:start
```

## Database (API)
```bash
npm run api:db:generate
npm run api:db:push
```

## Initialize Git (first time)
```bash
git init
git add .
git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -m "initial monorepo setup"
```

## Connect remote later
```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```
