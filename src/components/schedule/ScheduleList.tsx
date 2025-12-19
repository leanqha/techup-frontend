// src/components/Schedule/ScheduleList.tsx
// src/components/Schedule/ScheduleList.tsx
import type {Lesson} from '../../api/types/schedule';
import { ScheduleDay } from './ScheduleDay';

type Props = {
    lessons: Lesson[];
};

export function ScheduleList({ lessons }: Props) {
    const grouped = lessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
        acc[lesson.date] ??= [];
        acc[lesson.date].push(lesson);
        return acc;
    }, {});

    const dates = Object.keys(grouped).sort();

    return (
        <div>
            {dates.map(date => (
                <ScheduleDay
                    key={date}
                    date={date}
                    lessons={grouped[date]}
                />
            ))}
        </div>
    );
}