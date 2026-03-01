import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Authorization } from '../components/auth/Authorization';

type Props = {
    onAuthSuccess: () => void;
};

export function AuthPage({ onAuthSuccess }: Props) {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [initialMode, setInitialMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
    const [resetToken, setResetToken] = useState('');
    const [hideResetTokenField, setHideResetTokenField] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token') || '';
        if (location.pathname === '/reset-password') {
            setInitialMode('reset');
            setResetToken(token);
            setHideResetTokenField(true);
            setOpen(true);
        }
    }, [location.pathname, location.search]);

    const handleResetComplete = () => {
        setInitialMode('login');
        setHideResetTokenField(false);
        setResetToken('');
        setOpen(true);
        navigate('/auth', { replace: true });
    };

    return (
        <div style={{ textAlign: 'center', marginTop: 120 }}>
            <button
                style={{
                    padding: '14px 28px',
                    fontSize: 16,
                    borderRadius: 8,
                    border: 'none',
                    background: '#111',
                    color: '#fff',
                    cursor: 'pointer',
                }}
                onClick={() => {
                    setInitialMode('login');
                    setHideResetTokenField(false);
                    setResetToken('');
                    setOpen(true);
                }}
            >
                Открыть авторизацию
            </button>

            {open && (
                <Authorization
                    onClose={() => setOpen(false)}
                    onAuthSuccess={onAuthSuccess}
                    onResetComplete={handleResetComplete}
                    initialMode={initialMode}
                    initialResetToken={resetToken}
                    hideResetTokenField={hideResetTokenField}
                />
            )}
        </div>
    );
}