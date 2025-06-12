# 🍏 2-Rule AIM – Anti-Inflammatory Meal Planning App

Personalised meal generation, building, and planning that keeps your daily **fructose** intake low and your **Omega-3 : Omega-6** ratio in balance.

---

## ✨ Feature Highlights

| Module                    | Free Plan | Premium Plan |
|---------------------------|-----------|---------------|
| Generate **single** meals | ✅        | ✅            |
| Generate **full-day / week** plans | ❌ | ✅ |
| Save meals / month        | 2         | 42            |
| Meal Builder (custom ingredients) | Limited (no swaps) | Full incl. 12 swaps |
| Grocery list generator    | ❌        | ✅ |
| Fructose & Omega meters   | ✅        | ✅ |
| Multiple dietary filters  | 1         | Unlimited     |
| Family profiles           | ❌        | ✅ (50 % off) |

---

## 🏗️ Tech Stack

* **Next.js 14** + **React 18** + **TypeScript**
* **Tailwind CSS** + shadcn/ui components
* **Supabase** (PostgreSQL, Auth, Edge Functions)
* **OpenAI GPT-4o** – meal generation / ingredient swap
* **USDA FoodData Central** + **Canadian Nutrient File (CNF)** – nutrient lookup
* **Stripe** – subscriptions & billing
* **Radix UI**, **Lucide Icons**

---

## 🔧 Local Setup

### 1 ▪ Prerequisites
* Node .js ≥ 18 LTS
* pnpm / npm / yarn (examples use **npm**)
* Git
* Supabase project
* API keys (OpenAI, USDA, Stripe, RxNorm)

### 2 ▪ Clone & install
```bash
git clone https://github.com/your-org/2-rule-aim.git
cd 2-rule-aim
npm install
```

### 3 ▪ Environment variables

Create `.env.local` at repo root:

```
# ─── Supabase ───────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=🟩_your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=🟩_your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=🟩_service_role_key   # server actions only

# ─── OpenAI ─────────────────────────────────────────────────
OPENAI_API_KEY=🟩_openai_key
OPENAI_ORGANIZATION=🟩_org_id   # optional

# ─── Stripe (Billing) ───────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=🟩
STRIPE_SECRET_KEY=🟩
STRIPE_WEBHOOK_SECRET=🟩

# ─── Nutrition APIs ─────────────────────────────────────────
USDA_API_KEY=🟩_usda_key
# If you host CNF separately:
CNF_DATABASE_URL=postgresql://user:pass@host:port/db

# ─── RxNorm (Medication dropdown) ───────────────────────────
RXNORM_API_KEY=🟩

# ─── App ────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=replace_me
```
**Never commit real secrets.**

### 4 ▪ Database

1. Run `supabase db push` (or use SQL editor) to execute the SQL in `supabase/schema.sql`.
2. Import CNF CSVs into the `cnf_*` tables (or use the provided `scripts/import-cnf.ts`).
3. Optional: `supabase storage` bucket for user avatars.

### 5 ▪ Start dev server
```bash
npm run dev
# http://localhost:3000
```

The first sign-up automatically lands in **Free** tier.

### 6 ▪ Stripe webhook (dev)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Set `STRIPE_WEBHOOK_SECRET` from CLI output.

---

## 📂 Project Structure (trimmed)

```
.
├─ app/
│  ├─ dashboard/          – Fructose & Omega meters
│  ├─ meal-generator/
│  ├─ meal-builder/
│  ├─ saved-meals/
│  ├─ calendar/
│  ├─ grocery-lists/
│  ├─ my-foods/
│  └─ …static pages
├─ components/
│  ├─ ui/                 – shadcn re-exports
│  ├─ providers/          – Supabase, Theme, Subscription
│  └─ analytics.tsx
├─ lib/
│  ├─ meal-generation.ts  – GPT-4o prompts & validators
│  ├─ cnf-integration.ts  – nutrient helpers
│  ├─ constants.ts
│  └─ utils.ts
├─ supabase/
│  ├─ migrations/
│  └─ schema.sql
├─ scripts/               – data import, seed, etc.
└─ README.md
```

---

## 🧪 Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | next dev server |
| `npm run build` | production build |
| `npm run start` | start prod server |
| `npm run lint` | eslint + ts-check |
| `npm run format` | prettier write |
| `npm run supabase` | (optional) local supabase |

---

## 🚀 Deployment

The app is Vercel-ready:

```bash
# vercel.json already provided
vercel deploy --prod
```

* Set the same environment variables in Vercel dashboard.
* Create a Stripe webhook pointing to `https://your-url/api/stripe/webhook`.

---

## 🤝 Contributing

1. Fork → feature branch → PR.
2. Follow existing ESLint / Prettier rules.
3. Describe the change & link issue.

---

## 📜 License

MIT © 2025 Dr. Allan M. Gdanski & Contributors  
See `LICENSE` for details.


