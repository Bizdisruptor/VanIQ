# VanIQ — Van Build Planner

Professional van conversion layout planning tool.

## Stack
- **Frontend**: Vanilla JS, HTML/CSS (no build step needed)
- **Auth**: Supabase Auth (Google OAuth + Email/Password)
- **Database**: Supabase Postgres
- **Billing**: Stripe (Payment Links)
- **Hosting**: Netlify (static)

## File Structure
```
vaniq/
  index.html          ← App shell + HTML structure
  css/
    style.css         ← All styles (app + auth + billing)
  js/
    config.js         ← API keys + plan config (public keys only)
    auth.js           ← Supabase auth, login modal, session
    db.js             ← Project CRUD (Supabase)
    billing.js        ← Stripe checkout, upgrade modal
    app.js            ← Main app logic
  sql/
    schema.sql        ← Supabase DB schema (run once)
  netlify.toml        ← Netlify config
```

## Setup

### 1. Supabase
1. Go to Supabase dashboard → SQL Editor
2. Run `sql/schema.sql` to create tables
3. Go to Authentication → Providers → Enable Google OAuth
   - Add your Google Client ID + Secret
   - Add redirect URL: `https://vaniq.app`
4. Go to Authentication → URL Configuration
   - Site URL: `https://vaniq.app`
   - Redirect URLs: `https://vaniq.app`

### 2. Stripe Payment Links
1. Go to Stripe Dashboard → Payment Links
2. Create link for **Single Build** ($39 one-time)
   - Product: `prod_U86ht3fYuF0jDV`
3. Create link for **Builder** ($159/year)
   - Product: `prod_U86juWq47bGfuG`
4. Update `PAYMENT_LINKS` in `js/billing.js` with the real URLs

### 3. Stripe Webhook (to activate plan after purchase)
After a user pays, you need to flip their `plan` in Supabase.
Options:
- **Netlify Function** (recommended): Create `netlify/functions/stripe-webhook.js`
- **Supabase Edge Function**: Create a webhook handler in Supabase
- **Manual for now**: Check Stripe dashboard and update manually during beta

The webhook should listen for `checkout.session.completed` and:
```js
// Get user_id from client_reference_id
// Get product from line_items
// Update profiles SET plan = 'single' or 'builder' WHERE id = user_id
```

### 4. Netlify Deploy
1. Push this repo to GitHub (VanIQ)
2. Connect repo to Netlify
3. Deploy settings: publish directory = `.` (root), no build command
4. Add custom domain: `vaniq.app`

## Plans
| Plan | Price | Projects |
|------|-------|----------|
| Free | $0 | 0 (in-memory only) |
| Single Build | $39 one-time | 1 |
| Builder | $159/yr | Unlimited |

## Development
No build step. Open `index.html` directly or use any static server:
```
npx serve .
```
