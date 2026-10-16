// src/layout/Header.tsx
import { useAuth } from '../context/useAuth';
import { MenuIcon } from '../components/icons';

type Props = {
    toggleSidebar?: () => void; // function to control sidebar overlay
};

export function Header({ toggleSidebar }: Props) {
    const { profile } = useAuth();

    if (!profile) return null;

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? 'Доброе утро' :
            hour < 18 ? 'Добрый день' :
                'Добрый вечер';

    return (
        <header className="header">
            <div className="headerLeft">
                {/* Hamburger button only for mobile */}
                {toggleSidebar && (
                    <button
                        onClick={toggleSidebar}
                        className="hamburgerButton"
                        aria-label="Открыть меню"
                    >
                        <MenuIcon size={22} />
                    </button>
                )}

                <span className="greeting">
                    {greeting}, {profile.first_name} 👋
                </span>
            </div>
        </header>
    );
}
