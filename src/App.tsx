import React, { useState } from 'react';
import './App.css';
import Schedule from './components/Schedule'; // твой компонент расписания
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://46.37.123.72:8080',
    withCredentials: true,
});

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [message, setMessage] = useState('');

    const register = async () => {
        try {
            await api.post('/api/v1/account/register', {
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            });
            setMessage('Регистрация успешна!');
            setIsLoggedIn(true);
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Ошибка регистрации');
        }
    };

    const login = async () => {
        try {
            await api.post('/api/v1/account/login', { email, password });
            setMessage('Вход выполнен!');
            setIsLoggedIn(true);
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Ошибка входа');
        }
    };

    const logout = async () => {
        try {
            await api.post('/api/v1/account/logout');
            setIsLoggedIn(false);
            setMessage('Выход выполнен!');
        } catch (err: any) {
            setMessage('Ошибка выхода');
        }
    };

    if (isLoggedIn) {
        return (
            <div className="p-4">
                <button onClick={logout} className="px-3 py-1 bg-red-500 text-white mb-4">Выход</button>
                <Schedule />
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Регистрация / Вход</h1>
            <input type="text" placeholder="Имя" value={firstName} onChange={e => setFirstName(e.target.value)} className="border p-1 mb-2 w-full"/>
            <input type="text" placeholder="Фамилия" value={lastName} onChange={e => setLastName(e.target.value)} className="border p-1 mb-2 w-full"/>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border p-1 mb-2 w-full"/>
            <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="border p-1 mb-2 w-full"/>
            <div className="flex justify-between mb-4">
                <button onClick={register} className="px-3 py-1 bg-blue-500 text-white mr-2">Регистрация</button>
                <button onClick={login} className="px-3 py-1 bg-green-500 text-white">Вход</button>
            </div>
            {message && <div className="mt-2 text-center font-semibold">{message}</div>}
        </div>
    );
}

export default App;