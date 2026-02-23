import type { ReactNode } from 'react';
import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import './layout.css';

export function Layout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    return (
        <div className="layout">
            {/* Sidebar поверх всего */}
            <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
                <Sidebar closeSidebar={() => setSidebarOpen(false)} />
            </div>

            {/* Overlay для мобильного */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Контент и Header */}
            <div className="content">
                <Header toggleSidebar={toggleSidebar} />
                <main className="page">{children}</main>
            </div>
        </div>
    );
}