import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RiderEarnings from '../components/RiderEarnings';

export default function EarningsPage() {
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
                <h1 style={{ marginTop: 16 }}>My Earnings</h1>
            </div>

            {/* Earnings Component */}
            <RiderEarnings riderId={userId} />

            {/* Additional Info */}
            <div style={{ marginTop: 32, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                <h3 style={{ marginTop: 0 }}>About Your Earnings</h3>
                <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>Earnings are calculated based on delivery fees and tips from completed deliveries</li>
                    <li>Select different periods (Daily, Weekly, Monthly) to view your performance</li>
                    <li>Tips are separate from delivery fees and go directly to you</li>
                    <li>All amounts are shown in USD</li>
                </ul>
            </div>
        </div>
    );
}
