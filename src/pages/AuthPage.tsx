import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Authorization } from '../components/auth/Authorization';
import './AuthPage.css';

type Props = {
    onAuthSuccess: () => void;
};

export function AuthPage({ onAuthSuccess }: Props) {
    const location = useLocation();
    const navigate = useNavigate();

    const token = new URLSearchParams(location.search).get('token') || '';
    const isResetRoute = location.pathname === '/reset-password';

    return (
        <main className="auth-page">
            <section className="auth-page-card">
                <h1>{isResetRoute ? 'Сброс пароля' : 'Регистрация'}</h1>
                <p>
                    {isResetRoute
                        ? 'Введите новый пароль, чтобы завершить восстановление доступа.'
                        : 'Создайте аккаунт, чтобы получить доступ к расписанию и личному кабинету.'}
                </p>

                {!isResetRoute && (
                    <Link className="auth-back-link" to="/welcome">
                        На приветственную страницу
                    </Link>
                )}

                <Authorization
                    onAuthSuccess={onAuthSuccess}
                    onResetComplete={() => navigate('/auth', { replace: true })}
                    initialMode={isResetRoute ? 'reset' : 'register'}
                    initialResetToken={isResetRoute ? token : ''}
                    hideResetTokenField={isResetRoute}
                    variant="inline"
                    lockedMode={isResetRoute ? 'reset' : 'register'}
                />
            </section>
        </main>
    );
}