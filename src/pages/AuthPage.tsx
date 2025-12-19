import { useState } from 'react';

type Props = {
    onAuthSuccess: () => void;
};

export function AuthPage({ onAuthSuccess }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [message, setMessage] = useState('');

    const login = async () => {
        setMessage('');
        const res = await fetch('/api/v1/account/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
            onAuthSuccess();
        } else {
            const data = await res.json();
            setMessage(data.error || 'Login failed');
        }
    };

    const register = async () => {
        setMessage('');
        const res = await fetch('/api/v1/account/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            }),
        });

        if (res.ok) {
            onAuthSuccess();
        } else {
            const data = await res.json();
            setMessage(data.error || 'Registration failed');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '50px auto' }}>
            <h2>Login</h2>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={login}>Login</button>

            <hr />

            <h2>Register</h2>
            <input placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <input placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={register}>Register</button>

            {message && <p>{message}</p>}
        </div>
    );
}