import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './layout/Layout';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { useAuth } from './context/useAuth.ts';
import {SchedulePage} from "./pages/SchedulePage.tsx";

function App() {
    const { profile, refreshProfile } = useAuth();

    return (
        <Routes>
            <Route
                path="/auth"
                element={
                    profile
                        ? <Navigate to="/" replace />
                        : <AuthPage onAuthSuccess={refreshProfile} />
                }
            />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <HomePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ProfilePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/schedule"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <SchedulePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default App;