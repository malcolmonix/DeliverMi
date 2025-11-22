import { gql } from '@apollo/client';

// Rider Earnings Query
export const RIDER_EARNINGS = gql`
  query RiderEarnings($riderId: ID, $period: String) {
    riderEarnings(riderId: $riderId, period: $period) {
      totalEarnings
      deliveryCount
      totalTips
      totalFees
      period
    }
  }
`;

// Rider Order History Query
export const RIDER_ORDER_HISTORY = gql`
  query RiderOrderHistory($riderId: ID, $limit: Int, $offset: Int) {
    riderOrderHistory(riderId: $riderId, limit: $limit, offset: $offset) {
      id
      orderId
      restaurant
      orderItems {
        title
        quantity
        price
        total
      }
      orderAmount
      paidAmount
      deliveryCharges
      tipping
      address
      orderStatus
      orderDate
      createdAt
      updatedAt
    }
  }
`;

// Update Rider Status Mutation
export const UPDATE_RIDER_STATUS = gql`
  mutation UpdateRiderStatus($isOnline: Boolean!) {
    updateRiderStatus(isOnline: $isOnline) {
      id
      uid
      email
      displayName
      isOnline
    }
  }
`;
