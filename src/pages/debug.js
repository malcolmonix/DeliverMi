import { useEffect, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { apolloClient } from '../lib/apollo';
import { getAuth } from 'firebase/auth';

const GET_MY_RIDES = gql`
  query GetMyRides {
    myRides {
      id
      rideId
      status
      pickupAddress
      dropoffAddress
      fare
      createdAt
    }
  }
`;

const GET_CUSTOMER_PROFILE = gql`
  query Me {
    me {
      id
      email
      displayName
      phoneNumber
    }
  }
`;

export default function DebugPage() {
  const [connectionStatus, setConnectionStatus] = useState({
    firebase: 'checking',
    graphql: 'checking',
    network: 'checking'
  });
  const [authUser, setAuthUser] = useState(null);
  const [envVars, setEnvVars] = useState({});

  const { data: ridesData, loading: ridesLoading, error: ridesError } = useQuery(GET_MY_RIDES, {
    pollInterval: 5000,
    fetchPolicy: 'network-only'
  });

  const { data: profileData, loading: profileLoading, error: profileError } = useQuery(GET_CUSTOMER_PROFILE, {
    fetchPolicy: 'network-only'
  });

  useEffect(() => {
    // Check Firebase Auth
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          console.log('🔐 Firebase token obtained:', token.substring(0, 50) + '...');
        } catch (e) {
          console.error('❌ Failed to get token:', e);
        }
      }
      setConnectionStatus(prev => ({
        ...prev,
        firebase: user ? 'connected' : 'not authenticated'
      }));
    });

    // Check network
    const checkNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com/favicon.ico');
        setConnectionStatus(prev => ({
          ...prev,
          network: response.ok ? 'online' : 'offline'
        }));
      } catch (error) {
        setConnectionStatus(prev => ({
          ...prev,
          network: 'offline'
        }));
      }
    };

    checkNetwork();

    // Gather environment variables
    setEnvVars({
      graphqlUri: process.env.NEXT_PUBLIC_GRAPHQL_URI || 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
      firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NOT SET',
      firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET',
      mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'SET' : 'NOT SET',
    });

    return () => unsubscribe();
  }, []);

  // Determine GraphQL connection status
  useEffect(() => {
    if (ridesLoading || profileLoading) {
      setConnectionStatus(prev => ({
        ...prev,
        graphql: 'checking'
      }));
    } else if (ridesError || profileError) {
      setConnectionStatus(prev => ({
        ...prev,
        graphql: `error: ${(ridesError || profileError).message || 'Unknown error'}`
      }));
    } else {
      setConnectionStatus(prev => ({
        ...prev,
        graphql: 'connected'
      }));
    }
  }, [ridesLoading, ridesError, profileLoading, profileError]);

  return (
    <div style={{ background: '#1a1a1a', color: '#00ff00', fontFamily: 'monospace', padding: '20px', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>🔧 DeliverMi Debug Console</h1>

      {/* Connection Status */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>📡 Connection Status</h2>
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          <div><strong>Firebase Auth:</strong> {connectionStatus.firebase}</div>
          <div><strong>GraphQL API:</strong> {connectionStatus.graphql}</div>
          <div><strong>Network:</strong> {connectionStatus.network}</div>
        </div>
      </section>

      {/* Environment Configuration */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>🔐 Environment Configuration</h2>
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key}><strong>{key}:</strong> {value}</div>
          ))}
        </div>
      </section>

      {/* Current User */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>👤 Current User</h2>
        {authUser ? (
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <div><strong>UID:</strong> {authUser.uid}</div>
            <div><strong>Email:</strong> {authUser.email}</div>
            <div><strong>Display Name:</strong> {authUser.displayName || 'N/A'}</div>
          </div>
        ) : (
          <div style={{ color: '#ffaa00' }}>Not authenticated</div>
        )}
      </section>

      {/* Customer Profile */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>👨‍💼 Customer Profile</h2>
        {profileLoading && <div>Loading profile...</div>}
        {profileError && <div style={{ color: '#ff0000' }}>Error: {profileError.message}</div>}
        {profileData?.me ? (
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <div><strong>ID:</strong> {profileData.me.id}</div>
            <div><strong>Display Name:</strong> {profileData.me.displayName || 'N/A'}</div>
            <div><strong>Email:</strong> {profileData.me.email}</div>
            <div><strong>Phone:</strong> {profileData.me.phoneNumber || 'N/A'}</div>
          </div>
        ) : !profileLoading && !profileError ? (
          <div style={{ color: '#ffaa00' }}>No profile data</div>
        ) : null}
      </section>

      {/* My Rides */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>🚗 My Rides (Direct from API)</h2>
        {ridesLoading && <div>Loading rides...</div>}
        {ridesError && <div style={{ color: '#ff0000' }}>Error: {ridesError.message}</div>}
        {ridesData?.myRides && (
          <div style={{ marginTop: '10px' }}>
            <div><strong>Total Rides:</strong> {ridesData.myRides.length}</div>
            {ridesData.myRides.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                {ridesData.myRides.map(ride => (
                  <div key={ride.id} style={{ marginTop: '8px', padding: '8px', background: '#1a1a1a', borderRadius: '4px' }}>
                    <div><strong>ID:</strong> {ride.rideId}</div>
                    <div><strong>Status:</strong> {ride.status}</div>
                    <div><strong>From:</strong> {ride.pickupAddress}</div>
                    <div><strong>To:</strong> {ride.dropoffAddress}</div>
                    <div><strong>Fare:</strong> ${ride.fare}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {!ridesLoading && !ridesError && !ridesData?.myRides && (
          <div style={{ color: '#ffaa00' }}>No rides data</div>
        )}
      </section>

      {/* Apollo Client Info */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>🔄 Apollo Client Info</h2>
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          <div><strong>Link URI:</strong> {apolloClient.link?.options?.uri || 'N/A'}</div>
          <div><strong>Cache Size:</strong> {Object.keys(apolloClient.cache.data.data).length} entries</div>
        </div>
      </section>

      {/* Manual GraphQL Test */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>🔬 Manual GraphQL Test</h2>
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={async () => {
              if (!authUser) {
                alert('Not authenticated');
                return;
              }
              const token = await authUser.getIdToken();
              const response = await fetch('https://food-delivery-api-indol.vercel.app/graphql', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  query: '{ me { id email displayName phoneNumber } }'
                })
              });
              const result = await response.json();
              console.log('Manual GraphQL test result:', result);
              alert(JSON.stringify(result, null, 2));
            }}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Me Query with Token
          </button>
        </div>
      </section>

      {/* Timestamp */}
      <div style={{ marginTop: '20px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
