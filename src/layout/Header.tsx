// src/layout/Header.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.ts';

export function Header() {
    const { profile } = useAuth();
    const navigate = useNavigate();

    if (!profile) return null;

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? 'Доброе утро' :
            hour < 18 ? 'Добрый день' :
                'Добрый вечер';

    return (
        <header className="header">
            <div className="greeting">
                {greeting}, {profile.first_name} 👋
            </div>

            <button
                className="avatar"
                onClick={() => navigate('/profile')}
            >
                {profile.first_name[0]}
            </button>
        </header>
    );
}