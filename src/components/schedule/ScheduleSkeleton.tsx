import { Skeleton } from '../ui/Skeleton';
import './schedule.css';

// Placeholder that mirrors a LessonCard's layout (type chip + time, subject, meta).
function LessonCardSkeleton() {
    return (
        <div className="lesson-card lesson-card--skeleton" aria-hidden="true">
            <div className="lesson-card__top">
                <Skeleton width={76} height={24} radius="var(--radius-pill)" />
                <Skeleton width={92} height={16} style={{ marginLeft: 'auto' }} />
            </div>
            <Skeleton width="70%" height={18} />
            <Skeleton width="45%" height={14} />
        </div>
    );
}

// Placeholder for a single day section (title + a few lesson cards).
export function ScheduleDaySkeleton({ lessons = 3 }: { lessons?: number }) {
    return (
        <section className="schedule-day" aria-hidden="true">
            <Skeleton width={160} height={20} style={{ marginBottom: 16 }} />
            <div className="schedule-day__list">
                {Array.from({ length: lessons }).map((_, index) => (
                    <LessonCardSkeleton key={index} />
                ))}
            </div>
        </section>
    );
}

// Placeholder for a stretch of days — used while a week's schedule loads.
export function ScheduleSkeleton({
    days = 3,
    lessonsPerDay = 3,
    label = 'Загрузка расписания',
}: {
    days?: number;
    lessonsPerDay?: number;
    label?: string;
}) {
    return (
        <div role="status" aria-busy="true">
            <span className="skeleton-sr-only">{label}</span>
            {Array.from({ length: days }).map((_, index) => (
                <ScheduleDaySkeleton key={index} lessons={lessonsPerDay} />
            ))}
        </div>
    );
}
