// src/layout/Layout.tsx
// src/layout/Layout.tsx
import type {ReactNode} from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import './layout.css';

export function Layout({ children }: { children: ReactNode }) {
    return (
        <div className="layout">
            <Sidebar />

            <div className="content">
                <Header />
                <main className="page">{children}</main>
            </div>
        </div>
    );
}