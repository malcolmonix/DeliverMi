import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UPDATE_RIDER_STATUS } from '../lib/graphql-operations';

export default function StatusToggle() {
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(false);
    const [updateRiderStatus] = useMutation(UPDATE_RIDER_STATUS);

    // Load initial status from Firestore
    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const loadStatus = async () => {
            try {
                const riderRef = doc(db, 'riders', user.uid);
                const snap = await getDoc(riderRef);
                if (snap.exists()) {
                    setIsOnline(snap.data().available || false);
                }
            } catch (err) {
                console.warn('Failed to load rider status', err);
            }
        };

        loadStatus();
    }, []);

    const handleToggle = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        const newStatus = !isOnline;

        try {
            // Update via GraphQL (updates SQLite + Firestore)
            await updateRiderStatus({ variables: { isOnline: newStatus } });

            // Update local state
            setIsOnline(newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: isOnline ? '#e8f5e9' : '#fff3e0',
            border: `1px solid ${isOnline ? '#4caf50' : '#ff9800'}`
        }}>
            <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: isOnline ? '#4caf50' : '#ff9800'
            }} />
            <span style={{ fontWeight: 500 }}>
                {isOnline ? 'Online' : 'Offline'}
            </span>
            <button
                onClick={handleToggle}
                disabled={loading}
                style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: 'none',
                    backgroundColor: isOnline ? '#ff9800' : '#4caf50',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    opacity: loading ? 0.6 : 1
                }}
            >
                {loading ? 'Updating...' : isOnline ? 'Go Offline' : 'Go Online'}
            </button>
        </div>
    );
}
