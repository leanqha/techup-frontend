import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

type Props = {
    toggleSidebar?: () => void; // функция для управления sidebar
};

export function Header({ toggleSidebar }: Props) {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {toggleSidebar && (
                    <button
                        onClick={toggleSidebar}
                        className="hamburgerButton"
                        style={{
                            fontSize: 22,
                            background: 'transparent',
                            border: 'none',
                            color: '#111827',
                            cursor: 'pointer',
                        }}
                        aria-label="Toggle sidebar"
                    >
                        ☰
                    </button>
                )}

                <span className="greeting">
                    {greeting}, {profile.first_name} 👋
                </span>
            </div>

            <button
                className="avatar"
                onClick={() => navigate('/profile')}
                aria-label="Go to profile"
            >
                {profile.first_name[0]}
            </button>
        </header>
    );
}