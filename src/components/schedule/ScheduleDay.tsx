// src/components/Schedule/ScheduleDay.tsx
// src/components/Schedule/ScheduleDay.tsx
import type {Lesson} from '../../api/types/schedule';
import { LessonCard } from './LessonCard';

type Props = {
    date: string;
    lessons: Lesson[];
};

export function ScheduleDay({ date, lessons }: Props) {
    return (
        <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>{date}</h3>

            {lessons.length === 0 ? (
                <p>Пар нет</p>
            ) : (
                lessons.map(lesson => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                ))
            )}
        </div>
    );
}