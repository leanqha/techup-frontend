import { useState } from 'react';
import './Authorization.css';
import { fetchWithRefresh } from '../../api/fetchWithRefresh';

type Props = {
    onClose: () => void;
    onAuthSuccess: () => void;
};

export function Authorization({ onClose, onAuthSuccess }: Props) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const validateEmail = (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const isLoginValid = validateEmail(email) && password.length >= 8;
    const isRegisterValid =
        validateEmail(email) &&
        password.length >= 8 &&
        firstName.trim().length > 0 &&
        lastName.trim().length > 0;

    const handleSubmit = async () => {
        setMessage('');
        setLoading(true);

        const url =
            mode === 'login'
                ? '/api/v1/account/login'
                : '/api/v1/account/register';

        const body =
            mode === 'login'
                ? { email, password }
                : {
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                setMessage(data.error || 'Ошибка авторизации');
                return;
            }

            onAuthSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setMessage('Сетевая ошибка');
        } finally {
            setLoading(false);
        }
    };

    // Пример использования fetchWithRefresh внутри компонента
    const testProtectedRequest = async () => {
        try {
            const res = await fetchWithRefresh('/api/v1/account/secure/profile');
            if (!res.ok) throw new Error('Не удалось получить профиль');
            const data = await res.json();
            console.log('User profile:', data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-slider" onClick={(e) => e.stopPropagation()}>
                <div className="auth-header">
                    <h2>Авторизация</h2>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="tabs">
                    <button
                        className={mode === 'login' ? 'active' : ''}
                        onClick={() => setMode('login')}
                    >
                        Вход
                    </button>
                    <button
                        className={mode === 'register' ? 'active' : ''}
                        onClick={() => setMode('register')}
                    >
                        Регистрация
                    </button>
                </div>

                <div className="form">
                    {mode === 'register' && (
                        <>
                            <input
                                placeholder="Имя"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                            <input
                                placeholder="Фамилия"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </>
                    )}

                    <input
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={email && !validateEmail(email) ? 'error' : ''}
                    />

                    <input
                        type="password"
                        placeholder="Пароль (мин. 8 символов)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={password && password.length < 8 ? 'error' : ''}
                    />

                    <button
                        className="submit-btn"
                        disabled={loading || (mode === 'login' ? !isLoginValid : !isRegisterValid)}
                        onClick={handleSubmit}
                    >
                        {loading
                            ? 'Загрузка...'
                            : mode === 'login'
                                ? 'Войти'
                                : 'Зарегистрироваться'}
                    </button>

                    <button
                        className="submit-btn"
                        style={{ marginTop: '10px', backgroundColor: '#777' }}
                        onClick={testProtectedRequest}
                    >
                        Проверить защищённый запрос
                    </button>

                    {message && <div className="server-error">{message}</div>}
                </div>
            </div>
        </div>
    );
}