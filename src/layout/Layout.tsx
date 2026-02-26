// src/layout/Layout.tsx
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import './layout.css';

export function Layout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    return (
        <div className="layout">
            {/* Sidebar overlay for mobile */}
            <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
                <Sidebar closeSidebar={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <div className="content">
                <Header toggleSidebar={toggleSidebar} />
                <main className="page">{children}</main>
            </div>

            {/* Overlay to close sidebar */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <BottomNav />
        </div>
    );
}