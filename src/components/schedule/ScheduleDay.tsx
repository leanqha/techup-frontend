import type { Lesson } from '../../api/types/schedule';
import { LessonCard } from './LessonCard';
import { toStringDate } from '../../utils/date';

type Props = {
    date: string;
    lessons: Lesson[];
};

export function ScheduleDay({ date, lessons }: Props) {
    return (
        <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>{toStringDate(new Date(date))}</h3>
            {lessons.length > 0 ? (
                lessons.map(lesson => <LessonCard key={lesson.id} lesson={lesson} />)
            ) : (
                <div style={{ padding: 8, fontStyle: 'italic', color: '#555' }}>Пар нет</div>
            )}
        </div>
    );
}