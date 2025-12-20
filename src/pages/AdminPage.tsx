// src/pages/AdminPage.tsx
import { useState } from 'react';
import { useAuth } from '../context/useAuth';

export function AdminPage() {
    const { profile } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    if (profile?.role !== 'admin') {
        return <p>У вас нет доступа к админке</p>;
    }

    const handleUpload = async () => {
        if (!file) {
            setMessage('Выберите файл');
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/v1/admin/schedule/import', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (res.status === 201) {
                setMessage('Расписание успешно импортировано');
            } else {
                const data = await res.json();
                setMessage(data.error || 'Ошибка импорта');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setMessage('Ошибка сервера');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <h1>Админка</h1>

            <div style={{ marginBottom: 12 }}>
                <input
                    type="file"
                    accept=".csv"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
            </div>

            <button onClick={handleUpload} disabled={loading}>
                {loading ? 'Загрузка...' : 'Импортировать расписание'}
            </button>

            {message && <p style={{ marginTop: 12 }}>{message}</p>}
        </div>
    );
}