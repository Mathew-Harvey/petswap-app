# PetSwap — Architecture & Deployment Specification

> **Purpose of this document:** This is the single source of truth for PetSwap's system architecture. Follow it exactly. Do not deviate from or conflate the three services described below. If you are unsure about something, re-read this document before proceeding.

---

## System Overview

PetSwap consists of **three completely separate services**. They have different purposes, different tech stacks, different repos, and different deployment targets. **Never combine them.**

| Service | Purpose | Repo | Hosting | Serves HTML? |
|---|---|---|---|---|
| **petswap-landing** | Marketing site & waitlist signup | `Mathew-Harvey/petswap-landing-page` | Render Static Site or GitHub Pages | Yes — static HTML only |
| **petswap-api** | REST API backend | `Mathew-Harvey/petswap-api` | Render Web Service | **NO — JSON only** |
| **petswap-web** | User-facing web application (SPA) | `Mathew-Harvey/petswap-web` | Render Static Site | Yes — React SPA |

---

## 1. petswap-landing (Marketing Landing Page)

### What it is
A simple, static marketing page. Its only job is to look good and capture waitlist signups via Formspree. It has **no login, no API calls, no database interaction, no React**.

### Tech stack
- Plain HTML + CSS + vanilla JS
- Formspree for form submissions

### Repo structure
```
petswap-landing-page/
├── index.html          # Main landing page
├── css/
│   └── style.css
├── js/
│   └── main.js         # Formspree form handler only
└── images/
```

### Deployment (Render Static Site)
- **Build Command:** (leave empty — no build needed)
- **Publish Directory:** `.` (root of repo)
- **No environment variables needed**
- **No Dockerfile needed**

### Deployment (GitHub Pages — alternative)
- Enable GitHub Pages on the repo, branch: `main`, folder: `/ (root)`
- URL: `https://mathew-harvey.github.io/petswap-landing-page/`
- Ensure there is **no** `<base href>` tag, or set it to `/petswap-landing-page/` if using GitHub Pages

### Key rules
- This site does NOT talk to petswap-api
- This site does NOT have a login or registration flow
- This site does NOT use React, Vite, or any build tools
- The signup form submits directly to Formspree, not to our API

---

## 2. petswap-api (Backend API)

### What it is
A Node.js REST API server. It handles authentication, property listings, bookings, and all database operations. It serves **only JSON responses**. It does **not** serve any HTML, CSS, JS, or static files. It is **not** a web server for any frontend.

### Tech stack
- Node.js + Express
- Prisma ORM
- PostgreSQL (Render managed database)
- JWT authentication

### Repo structure
```
petswap-api/
├── package.json
├── Dockerfile
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── index.js             # Express app entry point
│   ├── routes/
│   │   ├── auth.js          # POST /api/auth/register, POST /api/auth/login
│   │   ├── properties.js    # CRUD /api/properties
│   │   └── bookings.js      # CRUD /api/bookings
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   └── lib/
│       └── prisma.js        # Prisma client instance
└── .env.example
```

### API endpoints
```
POST   /api/auth/register     — Create new user account
POST   /api/auth/login        — Login, returns JWT token
GET    /api/properties         — List all properties
POST   /api/properties         — Create property (auth required)
GET    /api/properties/:id     — Get single property
POST   /api/bookings           — Create booking (auth required)
GET    /api/bookings           — Get user's bookings (auth required)
GET    /api/health             — Health check (returns { status: "ok" })
```

### CORS configuration
The API must allow requests from the petswap-web frontend. In `src/index.js`:
```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'https://petswap-web.onrender.com',
    'http://localhost:5173'  // Vite dev server
  ],
  credentials: true
}));
```

### Critical: No static file serving
**Do NOT add any of the following to the API server:**
```javascript
// ❌ NEVER DO THIS IN THE API SERVER
app.use(express.static('client/dist'));
app.get('*', (req, res) => res.sendFile('index.html'));
```
The API returns JSON. Period. The frontend is a completely separate service.

### Deployment (Render Web Service)
- **Build Command:** `npm install && npx prisma generate`
- **Start Command:** `node src/index.js`
- **Dockerfile:** Yes (see below)
- **Environment:** Node

### Environment variables (set in Render dashboard)
| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string from Render DB | Yes |
| `JWT_SECRET` | Random secure string (32+ characters) | Yes |
| `NODE_ENV` | `production` | Yes |
| `PORT` | `10000` (Render default) | Yes |
| `ALLOWED_ORIGINS` | `https://petswap-web.onrender.com` | Yes |

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copy application code
COPY src/ ./src/

EXPOSE 10000

CMD ["node", "src/index.js"]
```

### Database setup
After first deploy with DATABASE_URL connected:
```bash
npx prisma db push
```
This creates all tables. Only needs to run once (or when schema changes).

---

## 3. petswap-web (Frontend Web Application)

### What it is
A React single-page application (SPA) that provides the user interface for PetSwap. Users interact with this to register, login, browse properties, and make bookings. It communicates with petswap-api via HTTP requests. It is **not** the landing page.

### Tech stack
- React 18
- Vite (build tool)
- React Router (client-side routing)
- Fetch/Axios for API calls

### Repo structure
```
petswap-web/
├── package.json
├── vite.config.js
├── index.html              # Vite entry point
├── public/
│   └── favicon.ico
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Main app with router
    ├── components/
    │   ├── Navbar.jsx
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── PropertyList.jsx
    │   ├── PropertyCard.jsx
    │   ├── PropertyForm.jsx
    │   ├── BookingForm.jsx
    │   └── Dashboard.jsx
    ├── context/
    │   └── AuthContext.jsx  # JWT token management
    ├── api/
    │   └── client.js        # API base URL + fetch wrapper
    └── styles/
        └── app.css
```

### API client configuration (`src/api/client.js`)
```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Critical: Always build and test before pushing
Before every push to the repo, run:
```bash
npm run build
```
If the build fails, **fix all errors before pushing**. Do not push broken code and hope Render fixes it.

### Deployment (Render Static Site)
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **No Dockerfile needed** (Render handles static site builds natively)

### Environment variables (set in Render dashboard)
| Variable | Value | Required |
|---|---|---|
| `VITE_API_URL` | `https://petswap-api.onrender.com` | Yes |

**Important:** Vite env vars must be prefixed with `VITE_` to be accessible in client code. They are baked in at build time, not runtime.

### Client-side routing (SPA fallback)
Since this is a React SPA with client-side routing, Render needs a rewrite rule so that all paths serve `index.html`. Create a `public/_redirects` file:
```
/*    /index.html   200
```
Or in Render dashboard, add a rewrite rule: `/* → /index.html` (status 200).

---

## Common Mistakes to Avoid

### ❌ Do NOT serve the landing page from the API server
The landing page and the API are completely unrelated. The API should never serve HTML.

### ❌ Do NOT confuse the landing page with the web app frontend
- Landing page = marketing, static HTML, no login, Formspree forms
- Web app = React SPA, login/register, talks to API, dynamic content

### ❌ Do NOT put client and server in the same Dockerfile
Build and deploy them separately. The API has its own Dockerfile. The web app uses Render's native static site build (no Dockerfile).

### ❌ Do NOT use `express.static` to serve the React app from the API
This is a monolith pattern. We are using a decoupled architecture. The React app is its own deployment.

### ❌ Do NOT push code that doesn't build
Always run `npm run build` locally before pushing. Fix syntax errors before deploying.

### ❌ Do NOT forget environment variables
Every deploy needs the right env vars set in Render. Check the tables above.

### ❌ Do NOT create multiple Render services from one repo using render.yaml
Each repo = one service. Keep it simple. No render.yaml needed — configure each service manually in the Render dashboard.

---

## Deployment Checklist

### First-time setup
- [ ] Create `petswap-landing-page` repo with static HTML site
- [ ] Create `petswap-api` repo with Express + Prisma API
- [ ] Create `petswap-web` repo with React + Vite app
- [ ] Create Render PostgreSQL database (`petswap-db`)
- [ ] Create Render Web Service for `petswap-api` — connect to `petswap-api` repo
- [ ] Set `petswap-api` env vars: DATABASE_URL, JWT_SECRET, NODE_ENV, PORT, ALLOWED_ORIGINS
- [ ] Run `npx prisma db push` on first deploy to create tables
- [ ] Create Render Static Site for `petswap-web` — connect to `petswap-web` repo
- [ ] Set `petswap-web` env var: VITE_API_URL=https://petswap-api.onrender.com
- [ ] Set publish directory to `dist`, build command to `npm install && npm run build`
- [ ] Add `_redirects` file for SPA routing
- [ ] Create Render Static Site or GitHub Pages for `petswap-landing-page`
- [ ] Configure Formspree form ID in landing page

### After deployment — verify
- [ ] `https://petswap-landing.onrender.com` → Shows marketing page with styled CSS
- [ ] `https://petswap-api.onrender.com/api/health` → Returns `{ "status": "ok" }`
- [ ] `https://petswap-api.onrender.com/api/properties` → Returns `[]` (empty array)
- [ ] `https://petswap-web.onrender.com` → Shows React app with login/register
- [ ] Register a test user via the web app
- [ ] Login with the test user
- [ ] Create a test property listing

---

## URL Summary

| Service | URL | Type |
|---|---|---|
| Landing Page | `https://petswap-landing.onrender.com` | Static Site |
| API | `https://petswap-api.onrender.com` | Web Service |
| Web App | `https://petswap-web.onrender.com` | Static Site |
| Database | Internal connection string only | PostgreSQL |
