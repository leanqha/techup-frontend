// src/components/schedule/LessonCard.tsx
import type { Lesson } from '../../api/types/schedule';
import { formatTime } from '../../utils/date';

export function LessonCard({ lesson }: { lesson: Lesson }) {
    const showTeacher = lesson.teacher.id !== 0;
    const showClassroom = lesson.classroom && lesson.classroom !== '0';

    const infoParts = [
        showClassroom ? lesson.classroom : null,
        lesson.group.name,
        showTeacher ? lesson.teacher.full_name : null
    ].filter(Boolean); // убираем null

    return (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            background: '#fff'
        }}>
            <div style={{ fontWeight: 600 }}>{lesson.subject}</div>
            <div>{formatTime(lesson.start_time)} – {formatTime(lesson.end_time)}</div>
            <div>{infoParts.join(' · ')}</div>
        </div>
    );
}