# Pharma VRM frontend

## Local development

Run `npm ci` and `npm run dev`. Vite proxies `/api` to `VRM_API_PROXY_TARGET` when it is set in `.env`, or to `http://localhost:5080` otherwise. Keep `VITE_API_BASE_URL=/api/v1` to make API requests through the proxy.

## Vercel deployment

Deploy this repository as a Vite project with the repository root as the project root. `vercel.json` forwards `/api/*` to `https://vrm-api.lokaverse.ai/api/*` and serves `index.html` for React Router paths. The frontend uses same-origin API requests so its session and CSRF cookies work with the backend's `SameSite=Strict` policy.

Leave `VITE_API_BASE_URL` unset in Vercel, or set it to `/api/v1`. Vite's local `server.proxy` and the ignored `.env` file do not configure Vercel. If the API host changes, update the destination in `vercel.json` and redeploy.

After deployment, `/api/v1/auth/me` should return `401` before login, and `/api/v1/organisation/branding` should return `200`. A Vercel `404` for these paths means the deployment has not picked up `vercel.json` or the Vercel project root is incorrect.

### Browser security headers

`vercel.json` supplies the same Content Security Policy, frame protection, content-type protection, and referrer policy as `nginx.conf`. Vercel does not read the Nginx configuration. The policy allows the bundled app scripts and same-origin API calls, blocks inline scripts and external script hosts, and prevents other sites from framing the app. Inline styles, embedded font data, and HTTPS images remain allowed for the existing theme, bundled fonts, charts, and branding.

After redeploying, verify the document response with:

```sh
curl -sSI https://frontend-tau-lime-43.vercel.app/login
```

Expect `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.

### Google Safe Browsing warning

The red Chrome phishing warning is a Google Safe Browsing classification. Security headers, a successful build, and a working HTTPS connection do not remove that classification or establish that every deployed URL is safe.

1. Check the [current site status](https://transparencyreport.google.com/safe-browsing/search?url=frontend-tau-lime-43.vercel.app) and the [Security Issues report](https://search.google.com/search-console/security-issues). Use the URL-prefix property `https://frontend-tau-lime-43.vercel.app/`. If it is not verified, obtain Google's HTML verification file and place the original file in `public/`, redeploy, then verify ownership. Check that the file is served with its original contents instead of the SPA fallback.
2. Review all issues and sample URLs in the report, including external resources and unexpected deployments. Fix identified problems before requesting review. The configured organisation logo should use a stable URL controlled by the organisation; the temporary Pixelvault URL observed during diagnosis returned an error.
3. Deploy the reviewed changes to the existing Vercel project. Check the headers above, the login page, and the API responses using browser requests. Requests made with curl's default user agent can receive a Cloudflare bot challenge; that alone does not prove the browser's API requests fail.
4. In Search Console, select **Request review** and describe the actual findings, fixes, and verification. If the classification appears mistaken, Google's [incorrect phishing warning form](https://safebrowsing.google.com/safebrowsing/report_error/?url=https%3A%2F%2Ffrontend-tau-lime-43.vercel.app%2Flogin) is also available. Do not claim an issue was removed unless it was found and fixed.
5. Wait for Google's response, then check both the site status and Chrome. Review and warning updates are not immediate. See [Google's instructions](https://support.google.com/webmasters/answer/9044101).

Review draft, to adapt **after deploying and resolving any findings in the Security Issues report**:

> This URL hosts the Pharma VRM workspace for Lokaverse.Ai. Accounts are issued by our organisation administrator. The login uses our workspace authentication API via a same-origin HTTPS route to vrm-api.lokaverse.ai. We clarified the organisation and workspace password on the sign-in page and added a Content Security Policy and frame protection to the Vercel deployment. We verified the production build, normal API access, mobile layout, and blocking of injected scripts in Chrome. Please review the phishing classification for https://frontend-tau-lime-43.vercel.app/login.
