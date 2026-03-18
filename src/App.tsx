import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { Layout } from './layout/Layout';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { WelcomePage } from './pages/WelcomePage';
import { useAuth } from './context/useAuth.ts';
import { SchedulePage } from './pages/SchedulePage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { AdminMapPage } from './pages/AdminMapPage.tsx';
import { TeachersPage } from './pages/TeachersPage.tsx';

function App() {
    const { profile, refreshProfile } = useAuth();

    return (
        <Routes>
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
                path="/welcome"
                element={
                    profile
                        ? <Navigate to="/" replace />
                        : <WelcomePage onAuthSuccess={refreshProfile} />
                }
            />

            <Route
                path="/auth"
                element={
                    profile
                        ? <Navigate to="/" replace />
                        : <AuthPage onAuthSuccess={refreshProfile} />
                }
            />

            <Route
                path="/reset-password"
                element={
                    profile
                        ? <Navigate to="/" replace />
                        : <AuthPage onAuthSuccess={refreshProfile} />
                }
            />

            <Route
                path="/home"
                element={<Navigate to="/" replace />}
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

            <Route
                path="/teachers"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <TeachersPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <AdminPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/map"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <AdminMapPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<Navigate to={profile ? '/' : '/welcome'} replace />} />
        </Routes>
    );
}

export default App;