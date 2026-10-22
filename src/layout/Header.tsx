// src/layout/Header.tsx
import { useAuth } from '../context/useAuth';
import { MenuIcon, DownloadIcon } from '../components/icons';
import { usePwaInstall } from '../hooks/usePwaInstall';

type Props = {
    toggleSidebar?: () => void; // function to control sidebar overlay
};

export function Header({ toggleSidebar }: Props) {
    const { profile } = useAuth();
    const { canInstall, promptInstall } = usePwaInstall();

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? 'Доброе утро' :
            hour < 18 ? 'Добрый день' :
                'Добрый вечер';

    // The bar renders even before the profile is loaded (auth-boot) so it keeps
    // its height and the page below it doesn't drop in once the greeting fills.
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

                {profile && (
                    <span className="greeting">
                        {greeting}, {profile.first_name} 👋
                    </span>
                )}
            </div>

            {profile && canInstall && (
                <button
                    onClick={() => void promptInstall()}
                    className="installButton"
                    aria-label="Установить приложение"
                >
                    <DownloadIcon size={18} />
                    <span className="installButtonLabel">Установить</span>
                </button>
            )}
        </header>
    );
}
