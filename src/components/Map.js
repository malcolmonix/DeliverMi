import { useState, useEffect } from 'react';

export default function DeliverMiMap({ orders = [] }) {
    // Default center location (New York)
    const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 });
    const [zoom, setZoom] = useState(13);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBhgjYf9GYtWTKeijtMHs4XNA3pqV98mxI';

    useEffect(() => {
        // In production, you'd calculate center based on order locations
        if (orders && orders.length > 0) {
            // For now, keep default center
            // Future: geocode addresses and calculate bounds
        }
    }, [orders]);

    // Create Google Maps Embed URL
    const mapUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center.lat},${center.lng}&zoom=${zoom}&maptype=roadmap`;

    return (
        <div style={{
            height: '100%',
            width: '100%',
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
            background: '#e5e3df'
        }}>
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapUrl}
                allowFullScreen
                title="Delivery Map"
            />

            {/* Order count overlay */}
            {orders.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    fontSize: 14,
                    fontWeight: 500,
                    zIndex: 1000
                }}>
                    📍 {orders.length} order{orders.length !== 1 ? 's' : ''} available
                </div>
            )}
        </div>
    );
}
