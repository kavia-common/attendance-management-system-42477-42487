# Attendance Frontend (React)

Modern, lightweight UI built with React (CRA + CRACO) using the Ocean Professional theme.

## Features

- Dashboard: quick stats (API health, total users, today's records)
- Users: list and create
- Attendance: list, filter by user/date, add new log (status + date)
- Routing: React Router v6 with routes `/`, `/users`, `/attendance`
- Central API client targeting Flask backend at `http://localhost:3001` (configurable)

## Environment

Create `.env.local` (see `.env.local.example`):

```
REACT_APP_API_BASE=http://localhost:3001
# PORT=3000
```

- In cloud previews both frontend and backend are exposed over HTTPS. Keep REACT_APP_API_BASE pointing to the backend URL (the platform maps http://localhost:3001 appropriately).
- In local development, the dev proxy (src/setupProxy.js) forwards /api requests to the backend on port 3001 to avoid CORS/mixed-content.

Ensure the backend allows CORS and is reachable on port 3001.

## Scripts

- `npm start` — dev server (CRACO)
- `npm test` — tests
- `npm run build` — production build

## Notes

- Styling in `src/theme.css` (Ocean Professional: blue `#2563EB`, amber `#F59E0B`)
- No heavy UI libraries; pure CSS components
- CSS minification adjustments present to support Node 18
- React Fast Refresh is intentionally disabled to avoid runtime `$RefreshSig` errors. Env flags: `FAST_REFRESH=false`, `REACT_APP_DISABLE_FAST_REFRESH=true`. CRACO removes the refresh plugin and Babel transform.
