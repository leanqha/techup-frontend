// src/layout/Layout.tsx
// src/layout/Layout.tsx
import type {ReactNode} from 'react';
import type {Profile} from '../api/types/types.ts';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import './layout.css';

type Props = {
    profile: Profile;
    children: ReactNode;
};

export function Layout({ profile, children }: Props) {
    return (
        <div className="layout">
            <Sidebar />

            <div className="content">
                <Header profile={profile} />
                <main className="page">
                    {children}
                </main>
            </div>
        </div>
    );
}