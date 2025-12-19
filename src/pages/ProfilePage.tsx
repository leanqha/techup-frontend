// src/pages/ProfilePage.tsx
// src/pages/ProfilePage.tsx
import type {Profile} from '../api/types/types.ts';

type Props = {
    profile: Profile;
};

export function ProfilePage({ profile }: Props) {
    return (
        <div style={{ padding: 24, maxWidth: 600 }}>
            <h1>Profile</h1>

            <div style={{ marginTop: 24 }}>
                <p><strong>Full name:</strong> {profile.firstName} {profile.lastName}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
            </div>
        </div>
    );
}