// src/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';

export function Sidebar() {
    return (
        <aside className="sidebar">
            <h2 className="logo">TechUp</h2>

            <nav>
                <NavLink to="/">Dashboard</NavLink>
                <NavLink to="/profile">Profile</NavLink>
            </nav>
        </aside>
    );
}