import type { Lesson } from '../../api/types/schedule';
import { LessonCard } from './LessonCard';
import { toStringDate } from '../../utils/date';

type Props = {
    date: string;
    lessons: Lesson[];
    showGroupInLessonCard?: boolean;
};

export function ScheduleDay({ date, lessons, showGroupInLessonCard = false }: Props) {
    const sortedLessons = [...lessons].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
    );

    return (
        <section
            style={{
                marginBottom: 40,
                padding: 16,
                borderRadius: 20,
                background: '#F9FAFB',
            }}
        >
            {/* Заголовок дня */}
            <h3
                style={{
                    margin: '0 0 16px 0',
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#111827',
                }}
            >
                {toStringDate(new Date(date))}
            </h3>

            {/* Список уроков */}
            {sortedLessons.length > 0 ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    {sortedLessons.map(lesson => (
                        <LessonCard key={lesson.id} lesson={lesson} showGroup={showGroupInLessonCard} />
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        padding: 16,
                        borderRadius: 14,
                        background: '#FFFFFF',
                        textAlign: 'center',
                        fontSize: 14,
                        color: '#6B7280',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                >
                    Пар сегодня нет 🎉
                </div>
            )}
        </section>
    );
}