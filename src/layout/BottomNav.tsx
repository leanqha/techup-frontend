// src/layout/BottomNav.tsx
import { NavLink } from 'react-router-dom';

const HomeIcon = () => (
    <svg className="bottomNavIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
            d="M3 10.5L12 3l9 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M5.5 9.5V20a1 1 0 0 0 1 1h4.5v-6h2v6H17.5a1 1 0 0 0 1-1V9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CalendarIcon = () => (
    <svg className="bottomNavIcon" viewBox="0 0 24 24" aria-hidden="true">
        <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        />
        <path
            d="M8 3v4M16 3v4M3 10h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

const UserIcon = () => (
    <svg className="bottomNavIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4 20a8 8 0 0 1 16 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

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
            <NavLink to="/" end className="bottomNavItem" aria-label="Home">
                <HomeIcon />
            </NavLink>

            <NavLink to="/schedule" className="bottomNavItem" aria-label="Schedule">
                <CalendarIcon />
            </NavLink>

            <NavLink to="/profile" className="bottomNavItem" aria-label="Profile">
                <UserIcon />
            </NavLink>
        </nav>
    );
}