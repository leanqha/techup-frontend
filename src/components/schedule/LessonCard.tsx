import type { Lesson } from '../../api/types/schedule';
import { formatTime } from '../../utils/date';

export function LessonCard({ lesson }: { lesson: Lesson }) {
    return (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            background: '#fff'
        }}>
            <div style={{ fontWeight: 600 }}>{lesson.subject} {lesson.classroom}</div>
            <div>{formatTime(lesson.start_time)} – {formatTime(lesson.end_time)}</div>
            <div>{lesson.teacher.full_name}</div>
        </div>
    );
}