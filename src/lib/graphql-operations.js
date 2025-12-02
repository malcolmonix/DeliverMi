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
