import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Papa from 'papaparse';
import { addDays, format } from 'date-fns';
import { AdminImportForm } from '../components/admin/AdminImportForm';
import { AdminModal } from '../components/admin/AdminModal';
import { AdminPageHeader } from '../components/admin/AdminPageHeader';
import './AdminPage.css';

type Lesson = {
    id: number;
    group: number;
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    teacher_id: number;
    classroom: string;
    type: string;
};

export function AdminPage() {
    const { profile } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [semesterEnd, setSemesterEnd] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (profile?.role !== 'admin') {
        return <p>У вас нет доступа к админке</p>;
    }

    const normalizeTime = (t: string) => {
        const [h, m] = t.trim().split(':');
        return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    };

    const readFileText = async (file: File) => {
        const buffer = await file.arrayBuffer();

        try {
            return new TextDecoder('utf-8').decode(buffer);
        } catch {
            return new TextDecoder('windows-1251').decode(buffer);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Выберите CSV файл');
            return;
        }

        if (!semesterEnd) {
            setMessage('Выберите дату окончания семестра');
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const text = await readFileText(file);

            const parsed = Papa.parse(text, {
                header: true,
                delimiter: ',',
                newline: '\r\n',
                skipEmptyLines: true,
            });

            const rows = (parsed.data as any[]).map(r => {
                const clean: any = {};
                Object.keys(r).forEach(k => {
                    const key = k.replace(/\ufeff/g, '').trim();
                    clean[key] =
                        typeof r[k] === 'string'
                            ? r[k].replace(/\ufeff/g, '').trim()
                            : r[k];
                });
                return clean;
            });

            if (!rows.length) {
                setMessage('CSV пустой или не распознан');
                setLoading(false);
                return;
            }

            const lessons: Lesson[] = [];
            let idCounter = 1;
            const endDate = new Date(semesterEnd);

            rows.forEach(row => {
                if (!row.date) return;

                const [d, m, y] = row.date.split('.');
                let currentDate = new Date(`${y}-${m}-${d}`);

                while (currentDate <= endDate) {
                    lessons.push({
                        id: idCounter++,
                        group: Number(row.group),
                        date: format(currentDate, 'yyyy-MM-dd'),
                        start_time: normalizeTime(row.start_time),
                        end_time: normalizeTime(row.end_time),
                        subject: row.subject || '',
                        teacher_id: Number(row.teacher_id || 0),
                        classroom: row.classroom || '',
                        type: row.type?.trim() || 'other',
                    });

                    currentDate = addDays(currentDate, 14);
                }
            });

            if (!lessons.length) {
                setMessage('Не удалось сформировать занятия');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/v1/admin/schedule/import', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessons),
            });

            if (res.status === 201) {
                setMessage(`Импортировано занятий: ${lessons.length}`);
            } else {
                const data = await res.json();
                setMessage(data.error || 'Ошибка импорта');
            }
        } catch (err) {
            console.error(err);
            setMessage('Ошибка обработки CSV');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <AdminPageHeader onOpenImport={() => setIsModalOpen(true)} />

            <AdminModal
                open={isModalOpen}
                title="Импорт расписания"
                onClose={() => setIsModalOpen(false)}
            >
                <AdminImportForm
                    semesterEnd={semesterEnd}
                    loading={loading}
                    message={message}
                    onFileChange={nextFile => setFile(nextFile)}
                    onSemesterEndChange={setSemesterEnd}
                    onSubmit={handleUpload}
                />
            </AdminModal>
        </div>
    );
}