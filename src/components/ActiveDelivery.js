import Link from 'next/link';

export default function ActiveDelivery({ order }) {
    if (!order) return null;

    const statusColor = {
        ASSIGNED: '#3b82f6',
        PICKED_UP: '#f59e0b',
        OUT_FOR_DELIVERY: '#8b5cf6',
    }[order.orderStatus] || '#6b7280';

    const statusIcon = {
        ASSIGNED: '📦',
        PICKED_UP: '🚗',
        OUT_FOR_DELIVERY: '🚚',
    }[order.orderStatus] || '📍';

    return (
        <Link
            href={`/order/${order.id}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
            <div
                style={{
                    background: `linear-gradient(135deg, ${statusColor}22, ${statusColor}11)`,
                    border: `2px solid ${statusColor}`,
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: statusColor,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px',
                            }}
                        >
                            {statusIcon} Active Delivery
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>
                            {order.restaurant}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                            Order #{order.orderId || order.id.slice(-6)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div
                            style={{
                                padding: '6px 12px',
                                background: statusColor,
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                marginBottom: '8px',
                            }}
                        >
                            {order.orderStatus.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                            ${order.paidAmount?.toFixed(2) || order.orderAmount?.toFixed(2)}
                        </div>
                    </div>
                </div>
                {order.address && (
                    <div
                        style={{
                            marginTop: '12px',
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <span>📍</span>
                        <span>{order.address.split(',')[0]}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}
