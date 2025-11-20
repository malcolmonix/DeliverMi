import { useEffect, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ActiveDelivery from '../components/ActiveDelivery';

const AVAILABLE_ORDERS = gql`
  query AvailableOrders {
    availableOrders {
      id
      orderId
      restaurant
      orderItems { title quantity }
      address
      orderStatus
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

const UPDATE_BY_RIDER = gql`
  mutation RiderUpdate($orderId: ID!, $status: String!, $code: String) {
    riderUpdateOrderStatus(orderId: $orderId, status: $status, code: $code) {
      id
      orderStatus
      paymentProcessed
    }
  }
`;

export default function Dashboard() {
  const { data, loading, refetch } = useQuery(AVAILABLE_ORDERS, { pollInterval: 5000 });
  const [assignRider] = useMutation(ASSIGN_RIDER);
  const [updateByRider] = useMutation(UPDATE_BY_RIDER);
  const [selected, setSelected] = useState(null);
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

  // load rider profile from Firestore
  const [riderProfile, setRiderProfile] = useState(null);
  useEffect(() => {
    const a = getAuth();
    const load = async () => {
      const u = a.currentUser;
      if (!u) return;
      try {
        const ref = doc(db, 'riders', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setRiderProfile(snap.data());
      } catch (err) {
        console.warn('Failed to load rider profile', err.message || err);
      }
    };
    load();
  }, []);

  if (authLoading || loading) return <div style={{ padding: 24 }}>Loading...</div>;

  const orders = data?.availableOrders || [];

  // Find active order (assigned to this rider)
  const auth = getAuth();
  const activeOrder = orders.find(o => o.riderId === auth.currentUser?.uid && ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.orderStatus));

  return (
    <div style={{ padding: 24 }}>
      <h2>Rider Dashboard</h2>

      {riderProfile && (
        <div style={{ marginBottom: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <strong>Rider:</strong> {riderProfile.name} ({riderProfile.email})
          <div>Available: {riderProfile.available ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* Active Delivery Banner */}
      {activeOrder && <ActiveDelivery order={activeOrder} />}

      <h3>Available Deliveries</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {orders.map(o => (
          <div key={o.id} style={{ border: '1px solid #ddd', padding: 12 }}>
            <strong>{o.restaurant}</strong>
            <div>Items: {o.orderItems.map(i => `${i.title} x${i.quantity}`).join(', ')}</div>
            <div>Address: {o.address}</div>
            <div>Status: {o.orderStatus}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={async () => { const res = await assignRider({ variables: { orderId: o.id } }); setSelected(res.data.assignRider); refetch(); }}>Accept</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ marginTop: 24 }}>
          <h3>Assigned Order</h3>
          <div>Order: {selected.orderId}</div>
          <div>Pickup Code: {selected.pickupCode}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={async () => { await updateByRider({ variables: { orderId: selected.id, status: 'PICKED_UP' } }); alert('Marked picked up'); }}>Mark Picked Up</button>
            <button onClick={async () => { const code = prompt('Enter delivery code from customer'); try { await updateByRider({ variables: { orderId: selected.id, status: 'DELIVERED', code } }); alert('Delivered and payment processed'); setSelected(null); refetch(); } catch (e) { alert(e.message); } }} style={{ marginLeft: 8 }}>Mark Delivered</button>
          </div>
        </div>
      )}
    </div>
  );
}
