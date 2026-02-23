// src/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

type Props = {
    closeSidebar?: () => void; // controlled by Header hamburger
};

export function Sidebar({ closeSidebar }: Props) {
    const { profile } = useAuth();

    const handleNavClick = () => closeSidebar?.();

    return (
        <aside
            className="sidebar"
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100vh',
                padding: '16px',
            }}
        >
            {/* Top part with logo and nav */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Logo */}
                <div style={{ marginBottom: 16, flexShrink: 0 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600 }}>TechUp</h2>
                </div>

                {/* Nav links */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <NavLink to="/" style={navStyle} onClick={handleNavClick} end>
                        Главная
                    </NavLink>
                    <NavLink to="/profile" style={navStyle} onClick={handleNavClick}>
                        Профиль
                    </NavLink>
                    <NavLink to="/schedule" style={navStyle} onClick={handleNavClick}>
                        Расписание
                    </NavLink>
                    {profile?.role === 'admin' && (
                        <NavLink to="/admin" style={navStyle} onClick={handleNavClick}>
                            Админка
                        </NavLink>
                    )}
                </nav>
            </div>
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