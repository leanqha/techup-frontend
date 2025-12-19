import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type {Profile} from './api/types/types.ts';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import {Layout} from "./layout/Layout.tsx";

function App() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/v1/account/secure/profile', {
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            } else {
                setProfile(null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/auth"
                    element={
                        profile
                            ? <Navigate to="/" replace />
                            : <AuthPage onAuthSuccess={fetchProfile} />
                    }
                />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute profile={profile}>
                            <Layout profile={profile!}>
                                <HomePage />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute profile={profile}>
                            <Layout profile={profile!}>
                                <ProfilePage profile={profile!} />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;