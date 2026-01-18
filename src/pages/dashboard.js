import { useEffect, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import StatusToggle from '../components/StatusToggle';
import NavigationButtons from '../components/NavigationButtons';
import BottomSheet from '../components/BottomSheet';
import styles from '../styles/Dashboard.module.css';

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('../components/Map'), { ssr: false });

const AVAILABLE_ORDERS = gql`
  query AvailableOrders {
    availableOrders {
      id
      orderId
      restaurant
      orderItems { title quantity price }
      address
      orderStatus
      paidAmount
    }
  }
`;

const ASSIGN_RIDER = gql`
  mutation AssignRider($orderId: ID!) {
    assignRider(orderId: $orderId) {
      id
      orderId
      pickupCode
      riderId
      orderStatus
    }
  }
`;

export default function Dashboard() {
  const { data, loading, refetch } = useQuery(AVAILABLE_ORDERS, { pollInterval: 5000 });
  const [assignRider, { loading: assigning }] = useMutation(ASSIGN_RIDER);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthLoading(false);
      if (!user) {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (authLoading || loading) {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  const auth = getAuth();
  const orders = data?.availableOrders || [];

  const handleAcceptOrder = async (orderId) => {
    try {
      await assignRider({ variables: { orderId } });
      refetch();
      alert('Order accepted! Check your assigned orders.');
    } catch (error) {
      alert('Failed to accept order: ' + error.message);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>DeliverMi Dashboard</h1>
        <StatusToggle />
      </div>

      {/* Navigation Links */}
      <div className={styles.navLinks}>
        <Link href="/earnings" className={styles.navLink}>
          💰 Earnings
        </Link>
        <Link href="/history" className={styles.navLink}>
          📜 History
        </Link>
      </div>

      {/* Main Content: Two-Column Layout */}
      <div className={styles.mainGrid}>
        {/* Left Sidebar: Available Orders */}
        <div className={styles.sidebar}>
          <h2 className={styles.sectionTitle}>
            Available Orders ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No orders available right now</h3>
              <p>Check back soon for new delivery opportunities!</p>
            </div>
          ) : (
            orders.map((order) => {
              const itemCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <h3 className={styles.restaurantName}>{order.restaurant}</h3>
                    <span className={styles.orderStatus}>{order.orderStatus}</span>
                  </div>

                  <div className={styles.orderDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>🛍️</span>
                      <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>📍</span>
                      <span>{order.address || 'Address not available'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>💵</span>
                      <span>₦{(order.paidAmount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className={styles.orderActions}>
                    <button
                      className={styles.acceptButton}
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={assigning}
                    >
                      {assigning ? 'Accepting...' : 'Accept Order'}
                    </button>
                  </div>

                  {/* Navigation Buttons - shown after clicking (or can be always shown) */}
                  {/* For now, displaying for all orders - would typically show only after accepting */}
                  <NavigationButtons
                    destination={{
                      lat: 40.7128, // Placeholder - would come from geocoded address
                      lon: -74.0060,
                      address: order.address
                    }}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Map */}
        <div className={styles.mapContainer}>
          <Map orders={orders} />
        </div>
      </div>

      {/* Bottom Sheet for Mobile */}
      <BottomSheet>
        <h2 className={styles.sectionTitle}>
          Available Orders ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No orders available right now</h3>
            <p>Check back soon for new delivery opportunities!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => {
              const itemCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <h3 className={styles.restaurantName}>{order.restaurant}</h3>
                    <span className={styles.orderStatus}>{order.orderStatus}</span>
                  </div>

                  <div className={styles.orderDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>🛍️</span>
                      <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>📍</span>
                      <span>{order.address || 'Address not available'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>💵</span>
                      <span>₦{(order.paidAmount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className={styles.orderActions}>
                    <button
                      className={styles.acceptButton}
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={assigning}
                    >
                      {assigning ? 'Accepting...' : 'Accept Order'}
                    </button>
                  </div>

                  <NavigationButtons
                    destination={{
                      lat: 40.7128,
                      lon: -74.0060,
                      address: order.address
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
