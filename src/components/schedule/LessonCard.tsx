// src/components/schedule/LessonCard.tsx
import type { Lesson, LessonType } from '../../api/types/schedule';
import { formatTime } from '../../utils/date';

function getTypeMeta(type: LessonType) {
    switch (type) {
        case 'lecture':
            return {
                label: 'Лекция',
                accent: '#2563EB',
                bg: '#EFF6FF',
            };
        case 'practice':
            return {
                label: 'Практика',
                accent: '#DC2626',
                bg: '#FEF2F2',
            };
        case 'laboratory':
            return {
                label: 'Лабораторная',
                accent: '#7C3AED',
                bg: '#F5F3FF',
            };
        default:
            return {
                label: '',
                accent: '#6B7280',
                bg: '#F9FAFB',
            };
    }
}

export function LessonCard({ lesson }: { lesson: Lesson }) {
    const showTeacher = lesson.teacher.id !== 0;
    const showClassroom =
        lesson.classroom &&
        lesson.classroom !== '0' &&
        lesson.classroom.trim() !== '';

    const typeMeta = getTypeMeta(lesson.type);

    return (
        <div
            style={{
                position: 'relative',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                background: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                borderLeft: `6px solid ${typeMeta.accent}`,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
        >
            {/* Тип */}
            {typeMeta.label && (
                <span
                    style={{
                        alignSelf: 'flex-start',
                        background: typeMeta.bg,
                        color: typeMeta.accent,
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: 0.3,
                    }}
                >
                    {typeMeta.label}
                </span>
            )}

            {/* Предмет + аудитория */}
            <div
                style={{
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: '#111827',
                    wordBreak: 'break-word',
                }}
            >
                {lesson.subject}
                {showClassroom ? ` · ${lesson.classroom}` : ''}
            </div>

            {/* Время */}
            <div
                style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                }}
            >
                {formatTime(lesson.start_time)} –{' '}
                {formatTime(lesson.end_time)}
            </div>

            {/* Преподаватель */}
            {showTeacher && (
                <div
                    style={{
                        fontSize: 14,
                        color: '#6B7280',
                    }}
                >
                    {lesson.teacher.full_name}
                </div>
            )}
        </div>
    );
}