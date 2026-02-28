// src/pages/ProfilePage.tsx
import { useAuth } from '../context/useAuth.ts';

export function ProfilePage() {
    const { profile, logout } = useAuth();

    if (!profile) return null;

    return (
        <div style={{ padding: 24, maxWidth: 600 }}>
            <h1>Профиль</h1>

            <div style={{ marginTop: 24 }}>
                <p><strong>ФИО:</strong> {profile.first_name} {profile.last_name}</p>
                {profile.group_name && <p><strong>Группа:</strong> {profile.group_name}</p>}
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Роль:</strong> {profile.role}</p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                    onClick={() => void logout()}
                    style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: '#111827',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 500,
                    }}
                >
                    Выйти
                </button>

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
        </div>
    );
}