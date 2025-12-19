// src/layout/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.ts';

export function Sidebar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const onLogout = async () => {
        await logout();
        navigate('/auth');
    };

    return (
        <aside className="sidebar">
            <h2 className="logo">TechUp</h2>

            <nav>
                <NavLink to="/">Dashboard</NavLink>
                <NavLink to="/profile">Profile</NavLink>
            </nav>

            <button className="logout" onClick={onLogout}>
                Logout
            </button>
        </aside>
    );
}