import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>DeliverMi — Rider App (Prototype)</h1>
      <p>This is a minimal rider interface prototype. Use the links below to get started.</p>
      <ul>
        <li><Link href="/login">Login / Register</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
      </ul>
    </div>
  );
}
