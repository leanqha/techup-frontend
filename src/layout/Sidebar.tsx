// src/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

type Props = {
    closeSidebar?: () => void; // controlled by Header hamburger
};

const HomeIcon = () => (
    <svg className="sidebarLinkIcon" viewBox="0 0 24 24" aria-hidden="true">
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

const UserIcon = () => (
    <svg className="sidebarLinkIcon" viewBox="0 0 24 24" aria-hidden="true">
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

const CalendarIcon = () => (
    <svg className="sidebarLinkIcon" viewBox="0 0 24 24" aria-hidden="true">
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

const ShieldIcon = () => (
    <svg className="sidebarLinkIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
            d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const MapIcon = () => (
    <svg className="sidebarLinkIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
            d="M9 5 3 7v12l6-2 6 2 6-2V5l-6 2-6-2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 5v12M15 7v12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export function Sidebar({ closeSidebar }: Props) {
    const { profile } = useAuth();

    const handleNavClick = () => closeSidebar?.();

    return (
        <aside className="sidebar">
            <div className="sidebarTop">
                <div className="sidebarBrand">
                    <div className="sidebarTitle">TechUp</div>
                    <div className="sidebarSubtitle">Портал студента</div>
                </div>

                <nav className="sidebarNav" aria-label="Основная навигация">
                    <NavLink
                        to="/"
                        end
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            `sidebarLink${isActive ? ' active' : ''}`
                        }
                    >
                        <HomeIcon />
                        <span>Главная</span>
                    </NavLink>
                    <NavLink
                        to="/profile"
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            `sidebarLink${isActive ? ' active' : ''}`
                        }
                    >
                        <UserIcon />
                        <span>Профиль</span>
                    </NavLink>
                    <NavLink
                        to="/schedule"
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            `sidebarLink${isActive ? ' active' : ''}`
                        }
                    >
                        <CalendarIcon />
                        <span>Расписание</span>
                    </NavLink>
                    {profile?.role === 'admin' && (
                        <>
                            <NavLink
                                to="/admin"
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                    `sidebarLink${isActive ? ' active' : ''}`
                                }
                            >
                                <ShieldIcon />
                                <span>Админка</span>
                            </NavLink>
                            <NavLink
                                to="/admin/map"
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                    `sidebarLink${isActive ? ' active' : ''}`
                                }
                            >
                                <MapIcon />
                                <span>Карта</span>
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </aside>
    );
}
