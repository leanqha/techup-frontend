// src/layout/BottomNav.tsx
import { NavLink } from 'react-router-dom';
import { HomeIcon, CalendarIcon, UserIcon } from '../components/icons';

type NavigatorWithStandalone = Navigator & {
    standalone?: boolean;
};

export function BottomNav() {
    const isPWA =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorWithStandalone).standalone === true;

    if (!isPWA) return null;

    return (
        <nav className="bottomNav">
            <NavLink to="/" end className="bottomNavItem" aria-label="Главная">
                <HomeIcon className="bottomNavIcon" size={24} />
            </NavLink>

            <NavLink to="/schedule" className="bottomNavItem" aria-label="Расписание">
                <CalendarIcon className="bottomNavIcon" size={24} />
            </NavLink>

            <NavLink to="/profile" className="bottomNavItem" aria-label="Профиль">
                <UserIcon className="bottomNavIcon" size={24} />
            </NavLink>
        </nav>
    );
}
