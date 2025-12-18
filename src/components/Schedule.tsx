import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface Lesson {
    id: number;
    group_id: number;
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    teacher: string;
    classroom: string;
}

interface NewLesson {
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    teacher: string;
    classroom: string;
}

const API_BASE_URL = 'https://nonimpregnated-turner-acknowledgingly.ngrok-free.dev';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [message, setMessage] = useState('');

    const [accessToken, setAccessToken] = useState<string | null>(null);

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [groupId, setGroupId] = useState<number>(1);
    const [fromDate, setFromDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [toDate, setToDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [note, setNote] = useState<string>('');

    const [newLesson, setNewLesson] = useState<NewLesson>({
        date: '',
        start_time: '',
        end_time: '',
        subject: '',
        teacher: '',
        classroom: '',
    });

    // Универсальный axios с Bearer токеном
    const api = axios.create({
        baseURL: API_BASE_URL,
    });

    api.interceptors.request.use(config => {
        if (accessToken) {
            config.headers!['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    });

    const register = async () => {
        try {
            await api.post('/api/v1/account/register', {
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            });

            setMessage('Регистрация успешна! Выполняется вход...');
            await login(); // Автоматический логин
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Ошибка регистрации');
        }
    };

    const login = async () => {
        try {
            const res = await api.post('/api/v1/account/login', { email, password });
            const tokens = res.data; // { access_token, refresh_token }
            setAccessToken(tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
            setIsLoggedIn(true);
            setMessage('Вход выполнен!');
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Ошибка входа');
        }
    };

    const logout = async () => {
        setAccessToken(null);
        localStorage.removeItem('refresh_token');
        setIsLoggedIn(false);
        setMessage('Выход выполнен!');
    };

    const fetchLessons = async () => {
        try {
            const res = await api.get<Lesson[]>(`/api/v1/schedule/lessons`, {
                params: { group_id: groupId, from: fromDate, to: toDate },
            });
            setLessons(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error('Error fetching lessons:', err);
            setLessons([]);
            setMessage('Ошибка при получении занятий');
        }
    };

    const fetchNote = async (lessonId: number) => {
        try {
            const res = await api.get(`${API_BASE_URL}/api/v1/lessons/${lessonId}/note`);
            setNote(res.data?.text || '');
        } catch (err: any) {
            console.error('Error fetching note:', err);
            setNote('');
        }
    };

    const saveNote = async () => {
        if (!selectedLesson) return;
        try {
            await api.post(`${API_BASE_URL}/api/v1/lessons/${selectedLesson.id}/note`, { text: note });
            alert('Заметка сохранена');
            fetchNote(selectedLesson.id);
        } catch (err: any) {
            console.error('Error saving note:', err);
            alert('Ошибка при сохранении заметки');
        }
    };

    const addLesson = async () => {
        try {
            await api.post('/api/v1/admin/lesson', { ...newLesson, group_id: groupId });
            alert('Занятие добавлено');
            setNewLesson({ date: '', start_time: '', end_time: '', subject: '', teacher: '', classroom: '' });
            fetchLessons();
        } catch (err: any) {
            console.error('Error adding lesson:', err);
            alert('Ошибка при добавлении занятия');
        }
    };

    useEffect(() => {
        if (isLoggedIn) fetchLessons();
    }, [groupId, fromDate, toDate, isLoggedIn]);

    if (isLoggedIn) {
        return (
            <div className="p-4">
                <button onClick={logout} className="px-3 py-1 bg-red-500 text-white mb-4">Выход</button>

                <div className="mb-4">
                    <label className="mr-2">Group ID:</label>
                    <input type="number" value={groupId} onChange={e => setGroupId(Number(e.target.value))} className="border p-1" />
                    <label className="ml-4 mr-2">From:</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border p-1" />
                    <label className="ml-4 mr-2">To:</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border p-1" />
                    <button onClick={fetchLessons} className="ml-4 px-2 py-1 bg-blue-500 text-white">Обновить</button>
                </div>

                <h2 className="text-xl font-semibold mb-2">Добавить новое занятие</h2>
                <div className="mb-4 border p-2">
                    <input type="date" value={newLesson.date} onChange={e => setNewLesson({ ...newLesson, date: e.target.value })} className="border p-1 mr-2" />
                    <input type="time" value={newLesson.start_time} onChange={e => setNewLesson({ ...newLesson, start_time: e.target.value })} className="border p-1 mr-2" />
                    <input type="time" value={newLesson.end_time} onChange={e => setNewLesson({ ...newLesson, end_time: e.target.value })} className="border p-1 mr-2" />
                    <input type="text" placeholder="Предмет" value={newLesson.subject} onChange={e => setNewLesson({ ...newLesson, subject: e.target.value })} className="border p-1 mr-2" />
                    <input type="text" placeholder="Преподаватель" value={newLesson.teacher} onChange={e => setNewLesson({ ...newLesson, teacher: e.target.value })} className="border p-1 mr-2" />
                    <input type="text" placeholder="Аудитория" value={newLesson.classroom} onChange={e => setNewLesson({ ...newLesson, classroom: e.target.value })} className="border p-1 mr-2" />
                    <button onClick={addLesson} className="px-2 py-1 bg-green-500 text-white">Добавить</button>
                </div>

                <table className="w-full border mb-4">
                    <thead>
                    <tr>
                        <th className="border px-2">Дата</th>
                        <th className="border px-2">Время</th>
                        <th className="border px-2">Предмет</th>
                        <th className="border px-2">Преподаватель</th>
                        <th className="border px-2">Аудитория</th>
                    </tr>
                    </thead>
                    <tbody>
                    {lessons.length > 0 ? (
                        lessons.map(lesson => (
                            <tr key={lesson.id} onClick={() => { setSelectedLesson(lesson); fetchNote(lesson.id); }} className="cursor-pointer hover:bg-gray-100">
                                <td className="border px-2">{lesson.date}</td>
                                <td className="border px-2">{lesson.start_time} - {lesson.end_time}</td>
                                <td className="border px-2">{lesson.subject}</td>
                                <td className="border px-2">{lesson.teacher}</td>
                                <td className="border px-2">{lesson.classroom}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={5} className="text-center">Нет занятий</td></tr>
                    )}
                    </tbody>
                </table>

                {selectedLesson && (
                    <div className="mt-4 border p-4">
                        <h2 className="text-xl font-semibold mb-2">Заметка для занятия: {selectedLesson.subject}</h2>
                        <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full h-24 border p-2 mb-2" />
                        <button onClick={saveNote} className="px-3 py-1 bg-green-500 text-white">Сохранить</button>
                    </div>
                )}
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