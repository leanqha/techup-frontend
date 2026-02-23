// src/layout/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useState } from 'react';

export function Sidebar() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [collapsed, setCollapsed] = useState(false);

    const onLogout = async () => {
        await logout();
        navigate('/auth');
    };

    return (
        <aside
            className={`sidebar ${collapsed ? 'collapsed' : ''}`}
            style={{
                width: collapsed ? 60 : 220,
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                height: '100vh',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                    {!collapsed ? 'TechUp' : 'TU'}
                </h2>
                <button
                    onClick={() => setCollapsed(c => !c)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 18,
                        lineHeight: 1,
                    }}
                >
                    {collapsed ? '➡' : '⬅'}
                </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <NavLink to="/" style={navStyle} end>
                    {collapsed ? '🏠' : 'Главная'}
                </NavLink>
                <NavLink to="/profile" style={navStyle}>
                    {collapsed ? '👤' : 'Профиль'}
                </NavLink>
                <NavLink to="/schedule" style={navStyle}>
                    {collapsed ? '📅' : 'Расписание'}
                </NavLink>
                {profile?.role === 'admin' && (
                    <NavLink to="/admin" style={navStyle}>
                        {collapsed ? '⚙' : 'Админка'}
                    </NavLink>
                )}
            </nav>

            <button
                className="logout"
                onClick={onLogout}
                style={{
                    marginTop: 'auto',
                    padding: '8px',
                    borderRadius: 8,
                    backgroundColor: '#DC2626',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                }}
            >
                {!collapsed ? 'Logout' : '⏻'}
            </button>
        </aside>
    );
}

// simple NavLink style
const navStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: '8px 12px',
    borderRadius: 8,
    display: 'block',
    color: '#fff',
    textDecoration: 'none',
    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    transition: 'background-color 0.2s ease',
});