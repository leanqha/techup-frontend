import { useEffect, useRef, useState } from 'react';
import './Authorization.css';
import { forgotPassword, resetPassword } from '../../api/account.ts';

type Props = {
    onClose?: () => void;
    onAuthSuccess: () => void;
    onResetComplete?: () => void;
    initialMode?: 'login' | 'register' | 'forgot' | 'reset';
    initialResetToken?: string;
    hideResetTokenField?: boolean;
    variant?: 'modal' | 'inline';
    lockedMode?: 'login' | 'register' | 'forgot' | 'reset';
};

export function Authorization({
    onClose,
    onAuthSuccess,
    onResetComplete,
    initialMode = 'login',
    initialResetToken = '',
    hideResetTokenField = false,
    variant = 'modal',
    lockedMode,
}: Props) {
    const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [resetToken, setResetToken] = useState(initialResetToken);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const newPasswordRef = useRef<HTMLInputElement | null>(null);
    const emailRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    useEffect(() => {
        setResetToken(initialResetToken);
    }, [initialResetToken]);

    useEffect(() => {
        if (lockedMode) {
            setMode(lockedMode);
            setMessage('');
        }
    }, [lockedMode]);

    const validateEmail = (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const isLoginValid = validateEmail(email) && password.length >= 8;
    const isRegisterValid =
        validateEmail(email) &&
        password.length >= 8 &&
        firstName.trim().length > 0 &&
        lastName.trim().length > 0;
    const isForgotValid = validateEmail(email);
    const isResetValid =
        resetToken.trim().length > 0 &&
        newPassword.length >= 8 &&
        newPassword === confirmPassword;
    const isAuthMode = mode === 'login' || mode === 'register';
    const isModeLocked = Boolean(lockedMode);

    const switchMode = (nextMode: 'login' | 'register' | 'forgot' | 'reset') => {
        if (isModeLocked) return;
        setMode(nextMode);
        setMessage('');
        setLoading(false);
        if (nextMode !== 'reset') {
            setResetToken(initialResetToken);
            setNewPassword('');
            setConfirmPassword('');
        }
        if (nextMode === 'forgot') {
            setPassword('');
        }
    };

    useEffect(() => {
        if (mode === 'reset') {
            newPasswordRef.current?.focus();
        }
    }, [mode]);

    useEffect(() => {
        if (mode === 'forgot') {
            emailRef.current?.focus();
        }
    }, [mode]);

    useEffect(() => {
        if (mode === 'reset' && hideResetTokenField && !resetToken.trim()) {
            setMessage('Токен сброса не найден');
        }
    }, [hideResetTokenField, mode, resetToken]);

    const handleSubmit = async () => {
        setMessage('');
        setLoading(true);

        try {
            if (mode === 'forgot') {
                const data = await forgotPassword({ email });
                setMessage(data.message);
                return;
            }

            if (mode === 'reset') {
                const data = await resetPassword({
                    token: resetToken.trim(),
                    new_password: newPassword,
                });
                setMessage(data.message);
                setMode('login');
                setPassword('');
                setNewPassword('');
                setConfirmPassword('');
                onResetComplete?.();
                return;
            }

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
            if (variant === 'modal') {
                onClose?.();
            }
        } catch (err) {
            console.error(err);
            setMessage(err instanceof Error ? err.message : 'Сетевая ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void handleSubmit();
    };

    const title =
        mode === 'forgot'
            ? 'Сброс пароля'
            : mode === 'reset'
                ? 'Новый пароль'
                : mode === 'register'
                    ? 'Регистрация'
                    : 'Авторизация';

    const content = (
        <div className={`auth-slider${variant === 'inline' ? ' auth-inline' : ''}`}>
            <div className="auth-header">
                <h2>{title}</h2>
                {variant === 'modal' && (
                    <button className="close-btn" type="button" onClick={() => onClose?.()}>
                        ✕
                    </button>
                )}
            </div>

            {isAuthMode && !isModeLocked && (
                <div className="tabs">
                    <button
                        className={mode === 'login' ? 'active' : ''}
                        type="button"
                        onClick={() => switchMode('login')}
                    >
                        Вход
                    </button>
                    <button
                        className={mode === 'register' ? 'active' : ''}
                        type="button"
                        onClick={() => switchMode('register')}
                    >
                        Регистрация
                    </button>
                </div>
            )}

            <form className="form" onSubmit={handleFormSubmit}>
                {mode === 'register' && (
                    <>
                        <input
                            name="first_name"
                            placeholder="Имя"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <input
                            name="last_name"
                            placeholder="Фамилия"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </>
                )}

                {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                    <input
                        ref={emailRef}
                        name="email"
                        type="email"
                        autoComplete={mode === 'forgot' ? 'username' : 'email'}
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={email && !validateEmail(email) ? 'error' : ''}
                    />
                )}

                {(mode === 'login' || mode === 'register') && (
                    <input
                        type="password"
                        name={mode === 'login' ? 'current-password' : 'new-password'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        placeholder="Пароль (мин. 8 символов)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={password && password.length < 8 ? 'error' : ''}
                    />
                )}

                {mode === 'reset' && (
                    <>
                        {!hideResetTokenField && (
                            <input
                                name="reset_token"
                                placeholder="Токен из письма"
                                value={resetToken}
                                onChange={(e) => setResetToken(e.target.value)}
                            />
                        )}
                        <input
                            ref={newPasswordRef}
                            type="password"
                            name="new-password"
                            autoComplete="new-password"
                            placeholder="Новый пароль (мин. 8 символов)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={newPassword && newPassword.length < 8 ? 'error' : ''}
                        />
                        <input
                            type="password"
                            name="confirm-password"
                            autoComplete="new-password"
                            placeholder="Подтвердите пароль"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={
                                confirmPassword && confirmPassword !== newPassword ? 'error' : ''
                            }
                        />
                    </>
                )}

                <button
                    className="submit-btn"
                    type="submit"
                    disabled={
                        loading ||
                        (mode === 'login'
                            ? !isLoginValid
                            : mode === 'register'
                                ? !isRegisterValid
                                : mode === 'forgot'
                                    ? !isForgotValid
                                    : !isResetValid)
                    }
                >
                    {loading
                        ? 'Загрузка...'
                        : mode === 'login'
                            ? 'Войти'
                            : mode === 'register'
                                ? 'Зарегистрироваться'
                                : mode === 'forgot'
                                    ? 'Отправить ссылку'
                                    : 'Сбросить пароль'}
                </button>

                {mode === 'login' && !isModeLocked && (
                    <button
                        type="button"
                        className="link-btn"
                        onClick={() => switchMode('forgot')}
                    >
                        Забыли пароль?
                    </button>
                )}

                {mode === 'forgot' && !isModeLocked && (
                    <div className="link-row">
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => switchMode('login')}
                        >
                            Назад ко входу
                        </button>
                    </div>
                )}

                {mode === 'reset' && !isModeLocked && (
                    <button
                        type="button"
                        className="link-btn"
                        onClick={() => switchMode('login')}
                    >
                        Назад ко входу
                    </button>
                )}

                {message && <div className="server-error">{message}</div>}
            </form>
        </div>
    );

    if (variant === 'inline') {
        return <div className="auth-inline-wrap">{content}</div>;
    }

    return (
        <div className="auth-overlay" onClick={() => onClose?.()}>
            <div onClick={(event) => event.stopPropagation()}>{content}</div>
        </div>
    );
}
