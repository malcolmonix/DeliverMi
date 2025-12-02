import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import OrderHistory from '../components/OrderHistory';

export default function HistoryPage() {
    const [authLoading, setAuthLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setAuthLoading(false);
            if (!user) {
                router.replace('/login');
            } else {
                setUserId(user.uid);
            }
        });
        return () => unsubscribe();
    }, [router]);

    if (authLoading) return <div style={{ padding: 24 }}>Loading...</div>;

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Link href="/dashboard" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>
                    ← Back to Dashboard
                </Link>
                <h1 style={{ marginTop: 16 }}>Delivery History</h1>
                <p style={{ color: '#666', marginTop: 8 }}>
                    View all your completed deliveries and earnings
                </p>
            </div>

            {/* Order History Component */}
            <OrderHistory riderId={userId} />
        </div>
    );
}
