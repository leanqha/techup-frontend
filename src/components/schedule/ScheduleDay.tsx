import type { Lesson } from '../../api/types/schedule';
import { LessonCard } from './LessonCard';
import { toStringDate } from '../../utils/date';
import './schedule.css';

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
        <section className="schedule-day">
            <h3 className="schedule-day__title">{toStringDate(new Date(date))}</h3>

            {sortedLessons.length > 0 ? (
                <div className="schedule-day__list">
                    {sortedLessons.map(lesson => (
                        <LessonCard key={lesson.id} lesson={lesson} showGroup={showGroupInLessonCard} />
                    ))}
                </div>
            ) : (
                <div className="schedule-empty">Пар сегодня нет 🎉</div>
            )}
        </section>
    );
}