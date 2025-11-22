# DeliverMi - Rider Delivery Application

Rider application for the Food Delivery multi-vendor platform. DeliverMi enables delivery riders to view available orders, accept deliveries, and complete the pickup/delivery flow with code verification.

## Features

### ✅ Phase 1 Complete
- **Order Management**: View available READY orders from vendors  
- **Order Details**: Complete order information with pickup codes
- **Delivery Flow**: Accept → Pickup → Deliver workflow
- **Code Verification**: Secure delivery completion with customer codes
- **Real-time Updates**: 5-second polling for status changes
- **Active Delivery Tracking**: Prominent display of current delivery
- **Firebase Authentication**: Email/password and Google sign-in

### 🚧 In Development
- FCM push notifications (configured, needs testing)
- Map integration (Mapbox/Google Maps planned)
- Earnings tracking
- Delivery history
- Rider profile management

## Tech Stack

- **Framework**: Next.js 14.2.33
- **GraphQL Client**: Apollo Client
- **Authentication**: Firebase Auth
- **Real-time**: Firebase Firestore
- **Styling**: CSS Modules + inline styles
- **State**: React hooks + Apollo cache

## Setup

### Prerequisites
- Node.js 18+
- Firebase project configured
- API server running on port 4000

### Installation

```bash
cd DeliverMi
npm install
```

### Environment Variables

Create `.env` file:

```env
# Firebase Config (must match other apps)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# API Endpoint
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:4000/graphql
```

### Development

```bash
npm run dev
```

App runs on `http://localhost:9010`

## Order Flow

DeliverMi integrates into the complete ecosystem flow:

```
ChopChop (Customer) → MenuVerse (Vendor) → DeliverMi (Rider)
```

1. **ChopChop**: Customer places order (Status: CONFIRMED)
2. **MenuVerse**: Vendor accepts (PROCESSING), prepares, marks READY
3. **/notify-ready**: API sends FCM to available riders
4. **DeliverMi**: Rider sees order, accepts (ASSIGNED), picks up (PICKED_UP), delivers (DELIVERED)

## Key Pages

- `/` - Home with map and available orders
- `/dashboard` - Active delivery + available orders list
- `/order/[id]` - Order details with pickup code and actions
- `/login` - Authentication

## GraphQL Operations

### Queries
- `availableOrders` - Returns ONLY READY status orders (no rider assigned)
- `riderOrder(id)` - Get specific order details

### Mutations
- `assignRider(orderId)` - Accept order
- `riderUpdateOrderStatus(orderId, status, code?)` - Update status (PICKED_UP, DELIVERED)
- `riderReportNotReady(orderId, waitedMinutes)` - Report delay

## Testing

See `Docs/COMPLETE-E2E-TEST-PLAN.md` for full test procedures.

## Project Structure

```
DeliverMi/
├── src/
│   ├── components/     # Reusable components
│   ├── lib/           # Apollo + Firebase config
│   ├── pages/         # Next.js pages
│   └── styles/        # Global styles
├── public/            # Static assets + SW
└── .env              # Environment config
```

## Contributing

Part of the Food Delivery multi-app workspace. See root `.github/copilot-instructions.md`.
