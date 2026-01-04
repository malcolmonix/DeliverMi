import { gql } from '@apollo/client';

// Ride Queries
export const GET_RIDE_STATUS = gql`
  query GetRideStatus($id: ID!) {
    ride(id: $id) {
      id
      rideId
      status
      pickupAddress
      pickupLat
      pickupLng
      dropoffAddress
      dropoffLat
      dropoffLng
      fare
      distance
      duration
      rider {
        id
        displayName
        latitude
        longitude
        phoneNumber
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_RIDES = gql`
  query GetMyRides {
    myRides {
      id
      rideId
      status
      pickupAddress
      dropoffAddress
      fare
      createdAt
    }
  }
`;

// Ride Mutations
export const REQUEST_RIDE = gql`
  mutation RequestRide($input: RideInput!) {
    requestRide(input: $input) {
      id
      rideId
      userId
      status
      pickupAddress
      pickupLat
      pickupLng
      dropoffAddress
      dropoffLat
      dropoffLng
      fare
      distance
      duration
      createdAt
    }
  }
`;

export const UPDATE_RIDE_STATUS = gql`
  mutation UpdateRideStatus($rideId: ID!, $status: String!) {
    updateRideStatus(rideId: $rideId, status: $status) {
      id
      rideId
      status
      updatedAt
    }
  }
`;

// Rate a ride after completion
export const RATE_RIDE = gql`
  mutation RateRide($rideId: ID!, $rating: Int!, $feedback: String) {
    rateRide(rideId: $rideId, rating: $rating, feedback: $feedback) {
      id
      rideId
      rating
      feedback
    }
  }
`;

// Cancel a ride
export const CANCEL_RIDE = gql`
  mutation CancelRide($rideId: ID!, $reason: String) {
    cancelRide(rideId: $rideId, reason: $reason) {
      id
      rideId
      status
    }
  }
`;

// Set delivery confirmation code (customer generates this)
export const SET_DELIVERY_CODE = gql`
  mutation SetDeliveryCode($rideId: ID!, $code: String!) {
    setDeliveryCode(rideId: $rideId, code: $code) {
      id
      rideId
      deliveryCode
      status
    }
  }
`;

// Rider/Driver Queries and Mutations (for dashboard features)
export const RIDER_ORDER_HISTORY = gql`
  query RiderOrderHistory($riderId: ID!, $limit: Int, $offset: Int) {
    riderOrderHistory(riderId: $riderId, limit: $limit, offset: $offset) {
      id
      orderId
      restaurant
      orderItems {
        title
        quantity
        price
      }
      address
      orderDate
      deliveryCharges
      tipping
      paidAmount
    }
  }
`;

export const RIDER_EARNINGS = gql`
  query RiderEarnings($riderId: ID!, $period: String) {
    riderEarnings(riderId: $riderId, period: $period) {
      totalEarnings
      deliveryCount
      totalFees
      totalTips
    }
  }
`;

export const UPDATE_RIDER_STATUS = gql`
  mutation UpdateRiderStatus($isOnline: Boolean!) {
    updateRiderStatus(isOnline: $isOnline) {
      id
      isOnline
      updatedAt
    }
  }
`;

// Available rides for drivers
export const AVAILABLE_RIDES = gql`
  query AvailableRides {
    availableRides {
      id
      rideId
      status
      pickupAddress
      pickupLat
      pickupLng
      dropoffAddress
      dropoffLat
      dropoffLng
      fare
      distance
      duration
      createdAt
    }
  }
`;

// Driver accepts a ride
export const ACCEPT_RIDE = gql`
  mutation AcceptRide($rideId: ID!) {
    acceptRide(rideId: $rideId) {
      id
      rideId
      status
      rider {
        id
        displayName
      }
    }
  }
`;
