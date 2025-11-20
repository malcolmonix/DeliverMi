import React from 'react';

const MapPlaceholder = ({ error }) => {
    return (
        <div style={{
            height: '100%',
            width: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'white',
            padding: '20px',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>Map View</h2>
            {error && (
                <p style={{
                    fontSize: '0.9rem',
                    opacity: 0.8,
                    maxWidth: '400px',
                    margin: '10px 0'
                }}>
                    Map is loading... Check available orders below
                </p>
            )}
        </div>
    );
};

export default MapPlaceholder;
