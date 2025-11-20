import { useQuery, gql } from '@apollo/client';
import Link from 'next/link';
import OrderCard from '../components/OrderCard';
import MapPlaceholder from '../components/MapPlaceholder';
import { useState, useEffect } from 'react';

const GET_AVAILABLE_ORDERS = gql`
  query GetAvailableOrders {
    availableOrders {
      id
      restaurant
      orderAmount
      address
      orderItems {
        title
        quantity
      }
      createdAt
    }
  }
`;

export default function Home() {
  const { data, loading, error } = useQuery(GET_AVAILABLE_ORDERS, {
    pollInterval: 10000, // Poll every 10s for new orders
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAcceptOrder = (orderId) => {
    // TODO: Implement accept order mutation
    console.log('Accepting order:', orderId);
    alert('Accept order functionality coming soon!');
  };

  if (loading) return <div className="loading-screen">Finding orders nearby...</div>;
  if (error) {
    return (
      <div className="error-screen">
        <div style={{ maxWidth: '500px', textAlign: 'center' }}>
          <h2>Unable to Connect to API</h2>
          <p style={{ color: '#888', marginBottom: '20px' }}>
            {error.message}
          </p>
          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            <strong>Troubleshooting:</strong>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li>Make sure the API server is running on port 4000</li>
              <li>Run: <code>cd api && npm run dev</code></li>
              <li>Check that the API is accessible at <code>http://localhost:4000/graphql</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const orders = data?.availableOrders || [];

  return (
    <div className="home-container">
      <div className="map-section">
        {isMounted && <MapPlaceholder />}
      </div>

      <div className="orders-panel">
        <div className="panel-header">
          <h2>Available Orders ({orders.length})</h2>
          <Link href="/dashboard" className="dashboard-link">Dashboard</Link>
        </div>

        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="no-orders">No orders available right now.</div>
          ) : (
            orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={handleAcceptOrder}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
