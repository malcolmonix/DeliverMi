import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';

const RIDER_ORDER = gql`
  query RiderOrder($id: ID!) {
    riderOrder(id: $id) {
      id
      orderId
      restaurant
      orderItems
      orderAmount
      paidAmount
      paymentMethod
      orderStatus
      expectedTime
      address
      instructions
      pickupCode
      isPickedUp
      paymentProcessed
      statusHistory
    }
  }
`;

const RIDER_UPDATE_STATUS = gql`
  mutation RiderUpdate($orderId: ID!, $status: String!, $code: String) {
    riderUpdateOrderStatus(orderId: $orderId, status: $status, code: $code) {
      id
      orderStatus
      isPickedUp
      paymentProcessed
    }
  }
`;

const RIDER_REPORT_NOT_READY = gql`
  mutation ReportNotReady($orderId: ID!, $waitedMinutes: Int) {
    riderReportNotReady(orderId: $orderId, waitedMinutes: $waitedMinutes)
  }
`;

export default function OrderPage() {
  const router = useRouter();
  const { id } = router.query;
  const [waitMinutes, setWaitMinutes] = useState(8);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthChecked(true);
      if (!user) router.replace('/login');
    });
    return () => unsubscribe();
  }, [router]);

  const { data, loading, error, refetch } = useQuery(RIDER_ORDER, {
    variables: { id },
    skip: !id || !authChecked,
    pollInterval: 5000,
  });

  const [updateStatus, { loading: updating }] = useMutation(RIDER_UPDATE_STATUS);
  const [reportNotReady] = useMutation(RIDER_REPORT_NOT_READY);

  if (!authChecked || loading) return <div style={{ padding: 24 }}>Loading order...</div>;
  if (error) return <div style={{ padding: 24 }}>Error: {error.message}</div>;

  const order = data?.riderOrder;
  if (!order) return <div style={{ padding: 24 }}>Order not found or not assigned to you.</div>;

  const items = JSON.parse(order.orderItems || '[]');
  const statusColor = {
    ASSIGNED: '#3b82f6',
    PICKED_UP: '#f59e0b',
    OUT_FOR_DELIVERY: '#8b5cf6',
    DELIVERED: '#10b981',
  }[order.orderStatus] || '#6b7280';

  const handleNotReady = async () => {
    try {
      await reportNotReady({ variables: { orderId: id, waitedMinutes: waitMinutes } });
      alert(`Reported ${waitMinutes} min delay to restaurant.`);
    } catch (e) {
      alert('Error: ' + (e.message || e));
    }
  };

  const handlePickup = async () => {
    try {
      await updateStatus({ variables: { orderId: id, status: 'PICKED_UP' } });
      refetch();
      alert('Marked as picked up!');
    } catch (e) {
      alert('Error: ' + (e.message || e));
    }
  };

  const handleDeliver = async () => {
    if (!deliveryCode) {
      alert('Please enter the delivery code from customer');
      return;
    }
    try {
      await updateStatus({ variables: { orderId: id, status: 'DELIVERED', code: deliveryCode } });
      alert('Delivery completed! Payment processed.');
      router.push('/dashboard');
    } catch (e) {
      alert('Error: ' + (e.message || e));
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}>
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div style={{ background: 'white', padding: 20, borderRadius: 12, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '1.5rem' }}>Order #{order.orderId || order.id.slice(-6)}</h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>{order.restaurant}</p>
          </div>
          <div style={{ padding: '8px 16px', background: statusColor, color: 'white', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' }}>
            {order.orderStatus.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Pickup Code */}
      {order.pickupCode && order.orderStatus !== 'DELIVERED' && (
        <div style={{ background: '#fef3c7', border: '2px dashed #f59e0b', padding: 20, borderRadius: 12, marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: 8, fontWeight: 600 }}>PICKUP CODE</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#b45309', letterSpacing: 6 }}>{order.pickupCode}</div>
          <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: 4 }}>Show this to the restaurant</div>
        </div>
      )}

      {/* Order Items */}
      <div style={{ background: 'white', padding: 20, borderRadius: 12, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Order Items</h2>
        {items.map((item, i) => (
          <div key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #e5e7eb' : 'none', paddingBottom: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <strong>{item.title || item.food}</strong>
                <span style={{ color: '#6b7280', marginLeft: 8 }}>x{item.quantity}</span>
                {item.variation && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{item.variation}</div>}
                {item.specialInstructions && (
                  <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: 4 }}>Note: {item.specialInstructions}</div>
                )}
              </div>
              <div style={{ fontWeight: 600 }}>${(item.total || item.price * item.quantity).toFixed(2)}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Total</span>
          <span>${order.paidAmount.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>Payment: {order.paymentMethod}</div>
      </div>

      {/* Delivery Info */}
      <div style={{ background: 'white', padding: 20, borderRadius: 12, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Delivery Address</h2>
        <p style={{ margin: 0 }}>{order.address}</p>
        {order.instructions && (
          <div style={{ marginTop: 12, padding: 12, background: '#f3f4f6', borderRadius: 8, fontSize: '0.9rem' }}>
            <strong>Instructions:</strong> {order.instructions}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ background: 'white', padding: 20, borderRadius: 12, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Actions</h2>

        {order.orderStatus === 'ASSIGNED' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#6b7280' }}>Wait time (min)</label>
                <input
                  type="number"
                  value={waitMinutes}
                  onChange={(e) => setWaitMinutes(Number(e.target.value))}
                  style={{ width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              <button
                onClick={handleNotReady}
                style={{ padding: '10px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
              >
                Report Delay
              </button>
            </div>
            <button
              onClick={handlePickup}
              disabled={updating}
              style={{
                width: '100%',
                padding: 16,
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: updating ? 'not-allowed' : 'pointer',
                opacity: updating ? 0.6 : 1,
              }}
            >
              ✓ Mark as Picked Up
            </button>
          </div>
        )}

        {(order.orderStatus === 'PICKED_UP' || order.orderStatus === 'OUT_FOR_DELIVERY') && (
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 8, fontWeight: 600 }}>Delivery Code from Customer:</label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={deliveryCode}
              onChange={(e) => setDeliveryCode(e.target.value)}
              style={{ width: '100%', padding: 12, marginBottom: 12, border: '2px solid #d1d5db', borderRadius: 8, fontSize: '1.1rem', textAlign: 'center', letterSpacing: 2 }}
            />
            <button
              onClick={handleDeliver}
              disabled={updating || !deliveryCode}
              style={{
                width: '100%',
                padding: 16,
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: (updating || !deliveryCode) ? 'not-allowed' : 'pointer',
                opacity: (updating || !deliveryCode) ? 0.6 : 1,
              }}
            >
              {updating ? 'Processing...' : '✓ Complete Delivery'}
            </button>
          </div>
        )}

        {order.orderStatus === 'DELIVERED' && (
          <div style={{ padding: 40, textAlign: 'center', background: '#d1fae5', borderRadius: 12 }}>
            <div style={{ fontSize: '3rem' }}>✓</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#065f46', marginTop: 8 }}>Delivery Completed</div>
            <div style={{ fontSize: '0.9rem', color: '#047857', marginTop: 4 }}>Payment has been processed</div>
          </div>
        )}
      </div>
    </div>
  );
}
