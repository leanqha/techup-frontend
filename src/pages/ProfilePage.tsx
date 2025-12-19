// src/pages/ProfilePage.tsx
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
    const { profile } = useAuth();

    if (!profile) return null;

    return (
        <div style={{ padding: 24, maxWidth: 600 }}>
            <h1>Profile</h1>

            <div style={{ marginTop: 24 }}>
                <p><strong>Full name:</strong> {profile.first_name} {profile.last_name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
            </div>
        </div>
    );
}