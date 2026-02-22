// src/components/schedule/LessonCard.tsx
import type { Lesson, LessonType } from '../../api/types/schedule';
import { formatTime } from '../../utils/date';

function getTypeMeta(type: LessonType) {
    switch (type) {
        case 'lecture':
            return {
                label: 'Лекция',
                bg: '#DBEAFE',      // мягкий фон
                color: '#2563EB',   // синий
            };
        case 'practice':
            return {
                label: 'Практика',
                bg: '#FEE2E2',
                color: '#DC2626',   // красный
            };
        case 'laboratory':
            return {
                label: 'Лабораторная',
                bg: '#EDE9FE',
                color: '#7C3AED',   // фиолетовый
            };
        default:
            return {
                label: '',
                bg: '#F3F4F6',
                color: '#374151',
            };
    }
}

export function LessonCard({ lesson }: { lesson: Lesson }) {
    const showTeacher = lesson.teacher.id !== 0;
    const showClassroom = lesson.classroom && lesson.classroom !== '0';

    const typeMeta = getTypeMeta(lesson.type);

    return (
        <div
            style={{
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
                background: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
            }}
        >
            {/* Первая строка: бейдж + предмет */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                    style={{
                        background: typeMeta.bg,
                        color: typeMeta.color,
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600
                    }}
                >
                    {typeMeta.label}
                </span>

                <span style={{ fontWeight: 600 }}>
                    {lesson.subject}
                    {showClassroom ? ` · ${lesson.classroom}` : ''}
                </span>
            </div>

            {/* Время */}
            <div style={{ fontSize: 14, color: '#374151' }}>
                {formatTime(lesson.start_time)} – {formatTime(lesson.end_time)}
            </div>

            {/* Преподаватель */}
            {showTeacher && (
                <div style={{ fontSize: 14, color: '#6B7280' }}>
                    {lesson.teacher.full_name}
                </div>
            )}
        </div>
    );
}