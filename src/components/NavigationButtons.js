export default function NavigationButtons({ destination }) {
    if (!destination || !destination.lat || !destination.lon) {
        return null;
    }

    const { lat, lon, address } = destination;

    const openGoogleMaps = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
        window.open(url, '_blank');
    };

    const openWaze = () => {
        const url = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
        window.open(url, '_blank');
    };

    return (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
                onClick={openGoogleMaps}
                style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#357ae8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#4285f4'}
            >
                🗺️ Google Maps
            </button>
            <button
                onClick={openWaze}
                style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#33ccff',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#00b8e6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#33ccff'}
            >
                🚗 Waze
            </button>
        </div>
    );
}
