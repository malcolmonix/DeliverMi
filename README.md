# DeliverMi - Consumer Ride Booking Application

Consumer ride booking application for the Food Delivery & Ride Booking ecosystem. DeliverMi enables customers to book rides (Uber/Bolt style), track riders in real-time, and complete ride journeys with interactive Mapbox maps.

## Features

### ✅ Completed Features
- **Interactive Map**: Mapbox GL integration with full map controls
- **Ride Booking**: Request rides with pickup and dropoff location selection
- **Address Search**: Geocoding and autocomplete for address search
- **Route Visualization**: Real-time route display between pickup and dropoff
- **Fare Calculation**: Automatic fare calculation based on distance and duration
- **Real-time Tracking**: Live rider location updates via Firestore
- **Status Updates**: Real-time ride status synchronization
- **Authentication**: Email/password and Google sign-in
- **Error Handling**: Comprehensive error handling and user feedback

### 🚧 Planned Features
- Ride history view
- Ride rating system
- Push notifications (FCM configured, needs testing)
- Earnings tracking
- Multiple payment methods

## Tech Stack

- **Framework**: Next.js 14.2.33
- **GraphQL Client**: Apollo Client
- **Authentication**: Firebase Auth
- **Real-time**: Firebase Firestore
- **Maps**: Mapbox GL JS (react-map-gl)
- **Styling**: Tailwind CSS + CSS Modules
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

Create `.env.local` file (copy from `.env.local.example`):

```env
# Firebase Config (must match other apps)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# API Endpoint
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:4000/graphql

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFsY29sbW9uaXgiLCJhIjoiY21pbmM2dnk3MTcydjNmczVsMnA1N3RlbyJ9.ZcElr4lOdzhEywm-570cCg
```

### Development

```bash
npm run dev
```

App runs on `http://localhost:9010`

### Mobile Testing

**Important:** Location services require HTTPS or localhost for security reasons.

#### Testing on Mobile Devices:

1. **Option 1: Using HTTPS (Recommended)**
   - Deploy to Vercel, Netlify, or another hosting service with HTTPS
   - Access via `https://your-domain.com`

2. **Option 2: Using ngrok for Local Development**
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start your app
   npm run dev
   
   # In another terminal, create HTTPS tunnel
   ngrok http 9010
   
   # Access the https:// URL provided by ngrok on your mobile device
   ```

3. **Option 3: Manual Location Entry**
   - If HTTPS is not available, you can still use the app
   - Tap directly on the map to set pickup and dropoff locations
   - The "Use My Location" button will show a helpful error message

**Note:** If you see "Location permission denied" on mobile, ensure you're accessing the app via HTTPS or use the manual location selection by tapping the map.

## Ride Booking Flow

DeliverMi enables customers to book rides independently:

```
DeliverMi (Customer) → API → RiderMi (Rider) → DeliverMi (Tracking)
```

1. **DeliverMi**: Customer selects pickup and dropoff locations
2. **API**: Creates ride request (Status: REQUESTED)
3. **RiderMi**: Rider sees and accepts ride (Status: ACCEPTED)
4. **Real-time**: Rider location updates every 5 seconds
5. **DeliverMi**: Customer tracks rider in real-time
6. **RiderMi**: Rider marks picked up (Status: PICKED_UP)
7. **RiderMi**: Rider completes ride (Status: COMPLETED)

## Key Pages

- `/` - Home with interactive map and ride booking
- `/login` - Authentication (Email/Password & Google Sign-In)

## GraphQL Operations

### Queries
- `ride(id)` - Get specific ride details
- `myRides` - Get current user's ride history

### Mutations
- `requestRide(input)` - Create new ride request
- `updateRideStatus(rideId, status)` - Update ride status (for cancellation)

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
