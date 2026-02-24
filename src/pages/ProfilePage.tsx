// src/pages/ProfilePage.tsx
import { useAuth } from '../context/useAuth.ts';

export function ProfilePage() {
    const { profile } = useAuth();

    if (!profile) return null;

    return (
        <div style={{ padding: 24, maxWidth: 600 }}>
            <h1>Profile</h1>

            <div style={{ marginTop: 24 }}>
                <p><strong>Full name:</strong> {profile.first_name} {profile.last_name}</p>
                {profile.group_name && <p><strong>Group:</strong> {profile.group_name}</p>}
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
            </div>

            <button
                onClick={() =>
                    window.open(
                        'https://docs.google.com/forms/d/e/1FAIpQLSd76B06oxBRQtjt_L-8EJ-8VZJRUNbXFxXctRZRInKcaqe5zQ/viewform?usp=dialog',
                        '_blank'
                    )
                }
                style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 500,
                }}
            >
                Обратная связь
            </button>
        </div>
    );
}