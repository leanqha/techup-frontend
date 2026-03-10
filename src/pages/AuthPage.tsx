import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Authorization } from '../components/auth/Authorization';
import './AuthPage.css';

type Props = {
    onAuthSuccess: () => void;
};

export function AuthPage({ onAuthSuccess }: Props) {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const token = new URLSearchParams(location.search).get('token') || '';
    const isResetRoute = location.pathname === '/reset-password';
    const initialMode = isResetRoute ? 'reset' : 'login';
    const hideResetTokenField = isResetRoute;
    const resetToken = isResetRoute ? token : '';

    const handleResetComplete = () => {
        setOpen(true);
        navigate('/auth', { replace: true });
    };

    const openLoginModal = () => {
        setOpen(true);
    };

    const isModalOpen = open || isResetRoute;

    return (
        <main className="auth-page">
            <section className="auth-page-card">
                <h1>Страница авторизации</h1>
                <p>
                    Нажмите кнопку ниже, чтобы открыть то же окно входа и регистрации,
                    что и на гостевой странице.
                </p>

                <div className="auth-page-actions">
                    <button className="auth-open-btn" onClick={openLoginModal}>
                        Открыть авторизацию
                    </button>
                    <Link className="auth-back-link" to="/welcome">
                        На приветственную страницу
                    </Link>
                </div>
            </section>

            {isModalOpen && (
                <Authorization
                    onClose={() => {
                        setOpen(false);
                        if (isResetRoute) {
                            navigate('/auth', { replace: true });
                        }
                    }}
                    onAuthSuccess={onAuthSuccess}
                    onResetComplete={handleResetComplete}
                    initialMode={initialMode}
                    initialResetToken={resetToken}
                    hideResetTokenField={hideResetTokenField}
                />
            )}
        </main>
    );
}