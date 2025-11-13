import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { apolloClient } from '../../lib/apollo';

const RIDER_ORDER = gql`
  query RiderOrder($id: ID!) { riderOrder(id: $id) { id orderId restaurant orderItems orderAmount orderStatus expectedTime address instructions pickupCode statusHistory } }
`;

const RIDER_UPDATE_STATUS = gql`
  mutation RiderUpdate($orderId: ID!, $status: String!, $code: String) { riderUpdateOrderStatus(orderId: $orderId, status: $status, code: $code) { id orderStatus isPickedUp } }
`;

const RIDER_REPORT_NOT_READY = gql`
  mutation ReportNotReady($orderId: ID!, $waitedMinutes: Int) { riderReportNotReady(orderId: $orderId, waitedMinutes: $waitedMinutes) }
`;

export default function OrderPage() {
  const router = useRouter();
  const { id } = router.query;
  const [waitMinutes, setWaitMinutes] = useState(8);

  const { data, loading, error, refetch } = useQuery(RIDER_ORDER, { variables: { id }, skip: !id });
  const [updateStatus] = useMutation(RIDER_UPDATE_STATUS);
  const [reportNotReady] = useMutation(RIDER_REPORT_NOT_READY);

  useEffect(() => { if (!loading && id) refetch(); }, [id]);

  if (!id) return <div style={{ padding: 24 }}>Loading...</div>;
  if (loading) return <div style={{ padding: 24 }}>Loading order...</div>;
  if (error) return <div style={{ padding: 24 }}>Error loading order: {error.message}</div>;

  const order = data?.riderOrder;
  if (!order) return <div style={{ padding: 24 }}>Order not found or not assigned to you.</div>;

  const onNotReady = async () => {
    try {
      await reportNotReady({ variables: { orderId: id, waitedMinutes: waitMinutes } });
      alert('Reported not ready to restaurant.');
    } catch (e) { alert('Failed to report: ' + (e.message || e)); }
  };

  const onConfirmPickup = async () => {
    try {
      await updateStatus({ variables: { orderId: id, status: 'PICKED_UP' } });
      alert('Pickup confirmed.');
      refetch();
    } catch (e) { alert('Failed to confirm pickup: ' + (e.message || e)); }
  };

  const onStartDelivery = async () => {
    try {
      await updateStatus({ variables: { orderId: id, status: 'OUT_FOR_DELIVERY' } });
      alert('Delivery started.');
      refetch();
      router.push('/dashboard');
    } catch (e) { alert('Failed to start delivery: ' + (e.message || e)); }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Order {order.orderId || order.id}</h1>
      <div style={{ marginTop: 12 }}><strong>Restaurant:</strong> {order.restaurant}</div>
      <div style={{ marginTop: 8 }}><strong>ETA:</strong> {order.expectedTime || 'Unknown'}</div>
      <div style={{ marginTop: 8 }}><strong>Address:</strong> {order.address}</div>
      <div style={{ marginTop: 12 }}>
        <h3>Items</h3>
        <ul>
          {JSON.parse(order.orderItems || '[]').map((it, i) => (
            <li key={i}>{it.quantity}x {it.title || it.food} — {it.total}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 12 }}>
        <strong>Special Instructions:</strong>
        <div>{order.instructions || '—'}</div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
        <button onClick={onNotReady} style={{ padding: '8px 12px', background: '#ffdd57', borderRadius: 6 }}>Not ready</button>
        <div>
          <label style={{ display: 'block', fontSize: 12 }}>Wait minutes</label>
          <input type="number" value={waitMinutes} onChange={e => setWaitMinutes(Number(e.target.value))} style={{ width: 80 }} />
        </div>
        <button onClick={onConfirmPickup} style={{ padding: '8px 12px', background: '#38a169', color: 'white', borderRadius: 6 }}>Confirm Pickup</button>
        <button onClick={onStartDelivery} style={{ padding: '8px 12px', background: '#3182ce', color: 'white', borderRadius: 6 }}>Start Delivery</button>
      </div>
    </div>
  );
}
