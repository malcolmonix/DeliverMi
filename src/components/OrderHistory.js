import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { RIDER_ORDER_HISTORY } from '../lib/graphql-operations';

export default function OrderHistory({ riderId }) {
    const [page, setPage] = useState(0);
    const limit = 10;
    const offset = page * limit;

    const { data, loading, error, fetchMore } = useQuery(RIDER_ORDER_HISTORY, {
        variables: { riderId, limit, offset },
    });

    if (loading && page === 0) return <div style={{ padding: 16 }}>Loading order history...</div>;
    if (error) return <div style={{ padding: 16, color: 'red' }}>Error: {error.message}</div>;

    const orders = data?.riderOrderHistory || [];

    const loadMore = () => {
        fetchMore({
            variables: { riderId, limit, offset: offset + limit },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;
                return {
                    riderOrderHistory: [...prev.riderOrderHistory, ...fetchMoreResult.riderOrderHistory],
                };
            },
        });
        setPage(page + 1);
    };

    return (
        <div style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Delivery History</h3>

            {orders.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>
                    No completed deliveries yet
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gap: 12 }}>
                        {orders.map((order) => {
                            const earnings = (order.deliveryCharges || 0) + (order.tipping || 0);
                            const itemCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                            return (
                                <div
                                    key={order.id}
                                    style={{
                                        border: '1px solid #ddd',
                                        borderRadius: 8,
                                        padding: 16,
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div>
                                            <strong style={{ fontSize: 16 }}>{order.restaurant}</strong>
                                            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                                Order #{order.orderId}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#4caf50' }}>
                                                +${earnings.toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#666' }}>
                                                {new Date(order.orderDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                                        {itemCount} item{itemCount !== 1 ? 's' : ''} • {order.address || 'No address'}
                                    </div>

                                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666' }}>
                                        <div>Fee: ${(order.deliveryCharges || 0).toFixed(2)}</div>
                                        <div>Tip: ${(order.tipping || 0).toFixed(2)}</div>
                                        <div>Total Order: ${(order.paidAmount || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Load More Button */}
                    <button
                        onClick={loadMore}
                        disabled={loading || orders.length < (page + 1) * limit}
                        style={{
                            marginTop: 16,
                            padding: '12px 24px',
                            width: '100%',
                            borderRadius: 6,
                            border: '1px solid #ddd',
                            backgroundColor: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 500,
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Loading...' : orders.length < (page + 1) * limit ? 'No more orders' : 'Load More'}
                    </button>
                </>
            )}
        </div>
    );
}
