import { useState } from 'react';
import { Authorization } from '../components/auth/Authorization';

type Props = {
    onAuthSuccess: () => void;
};

export function AuthPage({ onAuthSuccess }: Props) {
    const [open, setOpen] = useState(false);

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
                onClick={() => setOpen(true)}
            >
                Открыть авторизацию
            </button>

            {open && (
                <Authorization
                    onClose={() => setOpen(false)}
                    onAuthSuccess={onAuthSuccess}
                />
            )}
        </div>
    );
}