// src/layout/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useState } from 'react';

type Props = {
    closeSidebar?: () => void; // for mobile overlay
};

export function Sidebar({ closeSidebar }: Props) {
    const { logout, profile } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const onLogout = async () => {
        await logout();
        navigate('/auth');
        closeSidebar?.();
    };

    const handleNavClick = () => closeSidebar?.();

    return (
        <aside
            className={`sidebar ${collapsed ? 'collapsed' : ''}`}
        >
            {/* Logo + desktop collapse button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>
                    {!collapsed ? 'TechUp' : 'TU'}
                </h2>

                {/* Only show collapse button on desktop */}
                <button
                    className="desktopOnly"
                    onClick={() => setCollapsed(c => !c)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 18,
                    }}
                >
                    {collapsed ? '➡' : '⬅'}
                </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <NavLink to="/" style={navStyle} onClick={handleNavClick} end>
                    {collapsed ? '🏠' : 'Главная'}
                </NavLink>
                <NavLink to="/profile" style={navStyle} onClick={handleNavClick}>
                    {collapsed ? '👤' : 'Профиль'}
                </NavLink>
                <NavLink to="/schedule" style={navStyle} onClick={handleNavClick}>
                    {collapsed ? '📅' : 'Расписание'}
                </NavLink>
                {profile?.role === 'admin' && (
                    <NavLink to="/admin" style={navStyle} onClick={handleNavClick}>
                        {collapsed ? '⚙' : 'Админка'}
                    </NavLink>
                )}
            </nav>

            <button className="logout" onClick={onLogout}>
                {!collapsed ? 'Logout' : '⏻'}
            </button>
        </aside>
    );
}

const navStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: '8px 12px',
    borderRadius: 8,
    display: 'block',
    color: '#fff',
    textDecoration: 'none',
    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    transition: 'background-color 0.2s ease',
});