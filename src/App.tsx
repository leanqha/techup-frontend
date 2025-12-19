import { useState, useEffect } from 'react';

type Profile = {
    id: number;
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
};

function App() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [message, setMessage] = useState('');

    // Проверяем текущего пользователя
    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/v1/account/secure/profile', {
                credentials: 'include', // важно для HTTP-only куки
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            } else {
                setProfile(null);
            }
        } catch (err) {
            setProfile(null);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const register = async () => {
        setMessage('');
        try {
            const res = await fetch('/api/v1/account/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password, firstName, lastName }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Registration successful!');
                fetchProfile();
            } else {
                setMessage(data.error || 'Registration failed');
            }
        } catch {
            setMessage('Server error');
        }
    };

    const login = async () => {
        setMessage('');
        try {
            const res = await fetch('/api/v1/account/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Login successful!');
                fetchProfile();
            } else {
                setMessage(data.error || 'Login failed');
            }
        } catch {
            setMessage('Server error');
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/v1/account/secure/logout', {
                method: 'POST',
                credentials: 'include',
            });
            setProfile(null);
            setMessage('Logged out');
        } catch {
            setMessage('Logout failed');
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>TechUp Frontend</h1>

            {profile ? (
                <div>
                    <h2>Welcome, {profile.firstName} {profile.lastName}</h2>
                    <p>Email: {profile.email}</p>
                    <p>Role: {profile.role}</p>
                    <button onClick={logout}>Logout</button>
                </div>
            ) : (
                <div>
                    <h2>Register</h2>
                    <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    <input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                    <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    <button onClick={register}>Register</button>

                    <h2>Login</h2>
                    <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    <button onClick={login}>Login</button>
                </div>
            )}

            {message && <p>{message}</p>}
        </div>
    );
}

export default App;