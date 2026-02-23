import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

type Props = {
    closeSidebar?: () => void;
};

export function Sidebar({ closeSidebar }: Props) {
    const { profile, logout } = useAuth();
    const navigate = useNavigate();

    const onLogout = async () => {
        await logout();
        navigate('/auth');
        closeSidebar?.();
    };

    const handleNavClick = () => closeSidebar?.();

    return (
        <aside className="sidebar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Логотип */}
                <div style={{ marginBottom: 16, flexShrink: 0 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600 }}>TechUp</h2>
                </div>

                {/* Навигация */}
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
                    {/* Logout как пункт меню */}
                    <button onClick={onLogout} style={{
                        marginTop: 16,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}>
                        Logout
                    </button>
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