# ScamWatch Intelligence

Real-time scam reporting, threat mapping, identity breach monitoring, and call screening across 5 European countries.

![ScamWatch](https://img.shields.io/badge/ScamWatch-Intelligence-red)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

## Features

| Feature | Description |
|---------|-------------|
| **Threat Map** | Interactive MapLibre GL map with individual threat markers per report. Zoom out for country clusters, zoom in to see threats distributed across real cities. |
| **Call Shield** | Real-time incoming call screening — checks any phone number against the database in <50ms and shows a warning overlay before you answer. Includes simulator for testing. |
| **Number Lookup** | Search any phone number to see if it has been reported as a scam. |
| **Report Scam** | Submit intelligence reports with auto-generated geographic coordinates. |
| **Live Database** | Full dashboard with filters, search, and real-time stats. |
| **Breach Check** | Look up any username, email, or real name in breach databases (HIBP-compatible). |
| **Identity Monitoring** | Authenticated users can save identities to monitor and get breach alerts. |
| **Community Chat** | Open chat room for sharing intelligence. |

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + MapLibre GL
- **Backend:** tRPC 11 + Hono + Drizzle ORM + MySQL (TiDB)
- **Auth:** Kimi OAuth 2.0 + Local email/password with bcrypt + JWT
- **Maps:** MapLibre GL (free, no API key)

## Countries Covered

- Czechia (+420)
- Slovakia (+421)
- United Kingdom (+44)
- Germany (+49)
- Netherlands (+31)

## Quick Start

```bash
# Install dependencies
npm install

# Set up database (requires DATABASE_URL in .env)
npm run db:push

# Seed data
npx tsx db/seed.ts

# Start dev server
npm run dev
```

## External API Keys (Optional)

The app works **without any API keys** using built-in simulated data. Adding real API keys unlocks live data:

### 1. Have I Been Pwned — Real Breach Data
**What it does:** When someone looks up their username or email, it checks against the actual HIBP database of 12+ billion breached accounts.

**Get your key:**
1. Go to **https://haveibeenpwned.com/API/Key**
2. Click **"Subscribe"** ($3.50/month — cheapest plan is fine)
3. Copy your API key
4. Paste it in `.env`:
```
HIBP_API_KEY=your_key_here
```

**File:** `api/routers/identity.ts` — `fetchHIBP()` function

### 2. NumVerify — Phone Number Validation
**What it does:** Validates incoming phone numbers — checks carrier, line type (mobile/landline), country, and whether it's a real number.

**Get your key:**
1. Go to **https://numverify.com/signup**
2. Sign up for a free account (100 free validations/month)
3. Copy your access key from the dashboard
4. Paste it in `.env`:
```
NUMVERIFY_API_KEY=your_key_here
```

**File:** `api/routers/callShield.ts` — `callShield.validatePhone` endpoint

### 3. Abstract API Phone Validation (Alternative)
**What it does:** Same as NumVerify — validates phone numbers with carrier and location data. Use this if NumVerify doesn't work for your region.

**Get your key:**
1. Go to **https://www.abstractapi.com/api/phone-validation**
2. Click **"Start Free"** (500 free requests/month)
3. Copy your API key from the dashboard
4. Paste it in `.env`:
```
ABSTRACT_PHONE_API_KEY=your_key_here
```

**File:** `api/routers/callShield.ts` — fallback in `validatePhone` endpoint

## Environment Variables

Create a `.env` file with:

```env
# Required (provided by init.sh)
DATABASE_URL=mysql://user:pass@host:port/database
APP_ID=your_app_id
APP_SECRET=your_app_secret
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com
OWNER_UNION_ID=your_union_id

# Optional (unlocks real data)
HIBP_API_KEY=          # https://haveibeenpwned.com/API/Key
NUMVERIFY_API_KEY=     # https://numverify.com/signup
ABSTRACT_PHONE_API_KEY= # https://www.abstractapi.com/api/phone-validation
```

## Project Structure

```
.
├── api/                    # Backend (tRPC + Hono)
│   ├── routers/            # tRPC routers — ALL API ENDPOINTS
│   │   ├── report.ts       # Scam reports + map data + stats
│   │   ├── callShield.ts   # Real-time call screening + phone validation
│   │   ├── identity.ts     # Breach lookup (HIBP) + monitoring
│   │   ├── chat.ts         # Chat messages
│   │   └── localAuth.ts    # Email/password auth
│   ├── auth-router.ts      # Kimi OAuth login/logout/me
│   ├── context.ts          # tRPC context (dual auth)
│   ├── middleware.ts       # Auth guards (publicQuery, authedQuery, adminQuery)
│   ├── router.ts           # Root router — register new routers here
│   ├── lib/
│   │   └── env.ts          # Reads .env variables
│   └── boot.ts             # Hono server entry point
├── db/
│   ├── schema.ts           # Drizzle ORM schema (add tables here)
│   └── seed.ts             # Database seeding
├── src/
│   ├── pages/              # Route pages (one per route)
│   ├── components/         # UI components (Layout, etc.)
│   ├── hooks/              # Custom hooks (useAuth)
│   └── providers/          # tRPC provider
└── contracts/              # Shared types/constants
```

## Where to Add New API Endpoints

### Option 1: Add to an existing router
Open any file in `api/routers/` and add a new endpoint:

```typescript
// api/routers/report.ts
myNewEndpoint: publicQuery
  .input(z.object({ name: z.string() }))
  .query(({ input }) => `Hello ${input.name}`),
```

### Option 2: Create a new router
1. Create `api/routers/myRouter.ts`
2. Import and register it in `api/router.ts`:

```typescript
import { myRouter } from "./routers/myRouter";

export const appRouter = createRouter({
  // ... existing routers
  myRouter: myRouter,  // ← Add here
});
```

### Call it from the frontend:
```typescript
const { data } = trpc.myRouter.myNewEndpoint.useQuery({ name: "ScamWatch" });
```

## Call Shield Integration

The Call Shield endpoint accepts a phone number and returns a real-time risk assessment:

```bash
POST /api/trpc/callShield.incomingCallCheck
Content-Type: application/json

{ "phoneNumber": "+420 770 135 902" }
```

Response:
```json
{
  "phoneNumber": "+420 770 135 902",
  "verdict": "danger",
  "riskScore": 94,
  "reason": "Found 1 report for this number. Top threat: investment scam.",
  "detectedCountry": "Czechia",
  "matchedReports": [...],
  "responseTimeMs": 42
}
```

### Phone validation:
```bash
POST /api/trpc/callShield.validatePhone
{ "phoneNumber": "+420 770 135 902" }
```

Returns carrier, line type, country, and validity (requires NumVerify or Abstract API key).

## Map Feature

The map uses two zoom levels:
- **Zoom < 5.5:** Country cluster markers showing total report count with pulsing animation
- **Zoom >= 5.5:** Individual threat markers color-coded by scam type, distributed across real city coordinates

Click any country card to fly to that country and zoom in automatically.

## License

MIT
