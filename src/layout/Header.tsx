// src/layout/Header.tsx
import { useNavigate } from 'react-router-dom';
import type {Profile} from '../api/types/types.ts';

type Props = {
    profile: Profile;
};

export function Header({ profile }: Props) {
    const navigate = useNavigate();

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
                title="Профиль"
            >
                {profile.first_name[0]}
            </button>
        </header>
    );
}