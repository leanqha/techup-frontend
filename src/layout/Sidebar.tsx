// src/layout/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

type Props = {
    closeSidebar?: () => void; // controlled by Header hamburger
};

export function Sidebar({ closeSidebar }: Props) {
    const { logout, profile } = useAuth();
    const navigate = useNavigate();

    const onLogout = async () => {
        await logout();
        navigate('/auth');
        closeSidebar?.();
    };

    const handleNavClick = () => closeSidebar?.();

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>TechUp</h2>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <NavLink to="/" style={navStyle} onClick={handleNavClick} end>
                    🏠 Главная
                </NavLink>
                <NavLink to="/profile" style={navStyle} onClick={handleNavClick}>
                    👤 Профиль
                </NavLink>
                <NavLink to="/schedule" style={navStyle} onClick={handleNavClick}>
                    📅 Расписание
                </NavLink>
                {profile?.role === 'admin' && (
                    <NavLink to="/admin" style={navStyle} onClick={handleNavClick}>
                        ⚙ Админка
                    </NavLink>
                )}
            </nav>

            <button className="logout" onClick={onLogout}>
                Logout
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