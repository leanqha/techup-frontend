// src/layout/BottomNav.tsx
import { NavLink } from 'react-router-dom';

export function BottomNav() {
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