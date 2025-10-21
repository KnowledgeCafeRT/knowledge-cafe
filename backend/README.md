# Knowledge Cafe Backend

A real backend API for the Knowledge Cafe website with PostgreSQL database integration.

## 🚀 Features

- **Real Database**: PostgreSQL via Supabase
- **User Management**: Registration, profiles, preferences
- **Order System**: Create, track, and manage orders
- **Pfand System**: Cup deposit tracking and returns
- **Push Notifications**: Real-time order updates
- **Favorites System**: Save favorite menu items
- **Security**: Rate limiting, CORS, input validation

## 🛠 Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API to get your keys
4. Go to SQL Editor and run the schema from `database/schema.sql`

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `VAPID_PUBLIC_KEY` - For push notifications
- `VAPID_PRIVATE_KEY` - For push notifications
- `VAPID_EMAIL` - Your email for VAPID

### 4. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

### 5. Run Locally

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## 📊 Database Schema

- **users** - User accounts and profiles
- **orders** - Customer orders
- **pfand_transactions** - Cup deposit/return tracking
- **notification_subscriptions** - Push notification subscriptions
- **user_favorites** - Saved favorite items

## 🔌 API Endpoints

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders/user/:id` - Get user orders

### Users
- `POST /api/users` - Create/update user
- `GET /api/users/email/:email` - Get user by email
- `PATCH /api/users/:id` - Update user profile
- `GET /api/users/:id/pfand` - Get user Pfand data
- `GET /api/users/:id/favorites` - Get user favorites
- `POST /api/users/:id/favorites` - Add favorite
- `DELETE /api/users/:id/favorites/:itemId` - Remove favorite

### Pfand (Cup Deposits)
- `POST /api/pfand/return` - Process cup return (staff only)
- `GET /api/pfand/outstanding` - Get customers with outstanding cups
- `GET /api/pfand/stats` - Get Pfand statistics

### Notifications
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `DELETE /api/notifications/unsubscribe` - Unsubscribe
- `GET /api/notifications/vapid-key` - Get VAPID public key
- `POST /api/notifications/test` - Send test notification

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Set environment variables in Vercel dashboard

### Deploy to Railway

1. Connect your GitHub repo to Railway
2. Set environment variables
3. Deploy automatically

## 🔒 Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Input validation
- SQL injection prevention
- Row Level Security (RLS) in database

## 📱 Frontend Integration

Update your frontend API calls to use the new endpoints:

```javascript
// Old (localStorage)
localStorage.setItem('orders', JSON.stringify(orders));

// New (API)
fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

## 🐛 Troubleshooting

- Check Supabase connection in dashboard
- Verify environment variables
- Check server logs for errors
- Ensure database schema is properly set up
