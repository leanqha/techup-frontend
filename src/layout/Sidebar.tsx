// src/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
    HomeIcon,
    UserIcon,
    CalendarIcon,
    UsersIcon,
    ShieldIcon,
    MapIcon,
} from '../components/icons';

type Props = {
    closeSidebar?: () => void; // controlled by Header hamburger
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebarLink${isActive ? ' active' : ''}`;

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
                    <NavLink to="/" end onClick={handleNavClick} className={navLinkClass}>
                        <HomeIcon className="sidebarLinkIcon" />
                        <span>Главная</span>
                    </NavLink>
                    <NavLink to="/profile" onClick={handleNavClick} className={navLinkClass}>
                        <UserIcon className="sidebarLinkIcon" />
                        <span>Профиль</span>
                    </NavLink>
                    <NavLink to="/schedule" onClick={handleNavClick} className={navLinkClass}>
                        <CalendarIcon className="sidebarLinkIcon" />
                        <span>Расписание</span>
                    </NavLink>
                    <NavLink to="/teachers" onClick={handleNavClick} className={navLinkClass}>
                        <UsersIcon className="sidebarLinkIcon" />
                        <span>Преподаватели</span>
                    </NavLink>
                    {profile?.role === 'admin' && (
                        <>
                            <NavLink to="/admin" onClick={handleNavClick} className={navLinkClass}>
                                <ShieldIcon className="sidebarLinkIcon" />
                                <span>Админка</span>
                            </NavLink>
                            <NavLink to="/admin/map" onClick={handleNavClick} className={navLinkClass}>
                                <MapIcon className="sidebarLinkIcon" />
                                <span>Карта</span>
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </aside>
    );
}
