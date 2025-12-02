import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { RIDER_EARNINGS } from '../lib/graphql-operations';

export default function RiderEarnings({ riderId }) {
    const [period, setPeriod] = useState('daily');
    const { data, loading, error, refetch } = useQuery(RIDER_EARNINGS, {
        variables: { riderId, period },
    });

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        refetch({ riderId, period: newPeriod });
    };

    if (loading) return <div style={{ padding: 16 }}>Loading earnings...</div>;
    if (error) return <div style={{ padding: 16, color: 'red' }}>Error: {error.message}</div>;

    const earnings = data?.riderEarnings || {};

    return (
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Earnings</h3>

            {/* Period Selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['daily', 'weekly', 'monthly'].map((p) => (
                    <button
                        key={p}
                        onClick={() => handlePeriodChange(p)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 4,
                            border: '1px solid #ddd',
                            backgroundColor: period === p ? '#4caf50' : 'white',
                            color: period === p ? 'white' : 'black',
                            cursor: 'pointer',
                            fontWeight: 500,
                            textTransform: 'capitalize'
                        }}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Earnings Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div style={{ padding: 12, backgroundColor: '#e3f2fd', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Earnings</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1976d2' }}>
                        ${(earnings.totalEarnings || 0).toFixed(2)}
                    </div>
                </div>

                <div style={{ padding: 12, backgroundColor: '#f3e5f5', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Deliveries</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#7b1fa2' }}>
                        {earnings.deliveryCount || 0}
                    </div>
                </div>

                <div style={{ padding: 12, backgroundColor: '#e8f5e9', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Delivery Fees</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#388e3c' }}>
                        ${(earnings.totalFees || 0).toFixed(2)}
                    </div>
                </div>

                <div style={{ padding: 12, backgroundColor: '#fff3e0', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Tips</div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f57c00' }}>
                        ${(earnings.totalTips || 0).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Average per delivery */}
            {earnings.deliveryCount > 0 && (
                <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fafafa', borderRadius: 6 }}>
                    <div style={{ fontSize: 14, color: '#666' }}>
                        Average per delivery: <strong>${(earnings.totalEarnings / earnings.deliveryCount).toFixed(2)}</strong>
                    </div>
                </div>
            )}
        </div>
    );
}
