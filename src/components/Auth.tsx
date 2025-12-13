import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://46.37.123.72:8080',
    withCredentials: true, // важно для cookies
});

const AuthPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [message, setMessage] = useState('');

    const register = async () => {
        try {
            const res = await api.post('/api/v1/account/register', {
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            });
            setMessage('Регистрация успешна!');
            console.log(res.data);
        } catch (err: any) {
            console.error(err);
            setMessage(err.response?.data?.error || 'Ошибка регистрации');
        }
    };

    const login = async () => {
        try {
            const res = await api.post('/api/v1/account/login', { email, password });
            setMessage('Вход выполнен!');
            console.log(res.data);
        } catch (err: any) {
            console.error(err);
            setMessage(err.response?.data?.error || 'Ошибка входа');
        }
    };

    const logout = async () => {
        try {
            await api.post('/api/v1/account/logout');
            setMessage('Выход выполнен!');
        } catch (err: any) {
            console.error(err);
            setMessage('Ошибка выхода');
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Регистрация / Вход</h1>

            <div className="mb-2">
                <input
                    type="text"
                    placeholder="Имя"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="border p-1 mb-2 w-full"
                />
                <input
                    type="text"
                    placeholder="Фамилия"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="border p-1 mb-2 w-full"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="border p-1 mb-2 w-full"
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="border p-1 mb-2 w-full"
                />
            </div>

            <div className="flex justify-between mb-4">
                <button onClick={register} className="px-3 py-1 bg-blue-500 text-white mr-2">Регистрация</button>
                <button onClick={login} className="px-3 py-1 bg-green-500 text-white mr-2">Вход</button>
                <button onClick={logout} className="px-3 py-1 bg-red-500 text-white">Выход</button>
            </div>

            {message && <div className="mt-2 text-center font-semibold">{message}</div>}
        </div>
    );
};

export default AuthPage;