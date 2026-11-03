# Pharma VRM frontend

## Local development

Run `npm ci` and `npm run dev`. Vite proxies `/api` to `VRM_API_PROXY_TARGET` when it is set in `.env`, or to `http://localhost:5080` otherwise. Keep `VITE_API_BASE_URL=/api/v1` to make API requests through the proxy.

## Vercel deployment

Deploy this repository as a Vite project with the repository root as the project root. `vercel.json` forwards `/api/*` to `https://vrm-api.lokaverse.ai/api/*` and serves `index.html` for React Router paths. The frontend uses same-origin API requests so its session and CSRF cookies work with the backend's `SameSite=Strict` policy.

Leave `VITE_API_BASE_URL` unset in Vercel, or set it to `/api/v1`. Vite's local `server.proxy` and the ignored `.env` file do not configure Vercel. If the API host changes, update the destination in `vercel.json` and redeploy.

After deployment, `/api/v1/auth/me` should return `401` before login, and `/api/v1/organisation/branding` should return `200`. A Vercel `404` for these paths means the deployment has not picked up `vercel.json` or the Vercel project root is incorrect.
