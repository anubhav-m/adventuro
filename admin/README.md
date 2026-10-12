# Adventuro admin app

React + Vite. How it is built is described in `CLAUDE.md` in this folder.

```
npm install
cp .env.example .env     # then fill in VITE_GOOGLE_CLIENT_ID
npm run dev              # http://localhost:5174, proxies /api to http://localhost:5000
```

Only accounts listed in the backend's `ADMIN_EMAILS` can sign in.

## Before deploying to Vercel

`vercel.json` rewrites `/api/*` to the backend so the session cookie stays first-party.
Vercel cannot read environment variables inside `vercel.json`, so the backend host is a
placeholder: replace `adventuro-backend.example.com` with the backend's real host on Render.
