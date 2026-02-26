// src/layout/BottomNav.tsx
import { NavLink } from 'react-router-dom';

export function BottomNav() {
    const isPWA =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

    if (!isPWA) return null;

    return (
        <nav className="bottomNav">
            <NavLink to="/" end className="bottomNavItem">
                🏠
            </NavLink>

            <NavLink to="/schedule" className="bottomNavItem">
                📅
            </NavLink>

            <NavLink to="/profile" className="bottomNavItem">
                👤
            </NavLink>
        </nav>
    );
}