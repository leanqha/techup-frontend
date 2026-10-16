// src/components/schedule/LessonCard.tsx
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Lesson, LessonType } from '../../api/types/schedule';
import { deleteLessonNote, fetchLessonNote, saveLessonNote } from '../../api/schedule.ts';
import { formatTime } from '../../utils/date';
import { LessonNoteModal } from './LessonNoteModal';
import './schedule.css';

function getTypeMeta(type: LessonType) {
    switch (type) {
        case 'lecture':
            return {
                label: 'Лекция',
                accent: '#2563eb',
                soft: 'rgba(37, 99, 235, 0.12)',
            };
        case 'practice':
            return {
                label: 'Практика',
                accent: '#dc2626',
                soft: 'rgba(220, 38, 38, 0.12)',
            };
        case 'laboratory':
            return {
                label: 'Лабораторная',
                accent: '#7c3aed',
                soft: 'rgba(124, 58, 237, 0.12)',
            };
        default:
            return {
                label: '',
                accent: '#64748b',
                soft: 'rgba(100, 116, 139, 0.12)',
            };
    }
}

function toNoteText(text: string) {
    return text.trim();
}

export function LessonCard({ lesson, showGroup = false }: { lesson: Lesson; showGroup?: boolean }) {
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [savedNoteText, setSavedNoteText] = useState('');
    const [noteLoading, setNoteLoading] = useState(false);
    const [noteSaving, setNoteSaving] = useState(false);
    const [noteError, setNoteError] = useState<string | null>(null);
    const [hasExistingNote, setHasExistingNote] = useState(false);

    const showTeacher = lesson.teacher.id !== 0;
    const showClassroom =
        lesson.classroom &&
        lesson.classroom !== '0' &&
        lesson.classroom.trim() !== '';
    const showGroupName = showGroup && Boolean(lesson.group?.name);

    const typeMeta = getTypeMeta(lesson.type);

    useEffect(() => {
        let cancelled = false;

        const loadNotePreview = async () => {
            try {
                const note = await fetchLessonNote(lesson.id);
                if (cancelled) return;

                const text = toNoteText(note?.text ?? '');
                const hasNote = text.length > 0;
                setHasExistingNote(hasNote);
                setSavedNoteText(hasNote ? text : '');
            } catch {
                if (cancelled) return;
                setHasExistingNote(false);
                setSavedNoteText('');
            }
        };

        loadNotePreview();

        return () => {
            cancelled = true;
        };
    }, [lesson.id]);

    const handleOpenNote = async () => {
        setIsNoteOpen(true);
        setNoteLoading(true);
        setNoteError(null);

        try {
            const note = await fetchLessonNote(lesson.id);
            const text = toNoteText(note?.text ?? '');
            const hasNote = text.length > 0;
            setNoteText(text);
            setHasExistingNote(hasNote);
            setSavedNoteText(hasNote ? text : '');
        } catch (error: unknown) {
            setNoteError(error instanceof Error ? error.message : 'Ошибка загрузки заметки');
            setNoteText('');
            setHasExistingNote(false);
            setSavedNoteText('');
        } finally {
            setNoteLoading(false);
        }
    };

    const handleSaveNote = async () => {
        const normalizedText = toNoteText(noteText.trim());
        setNoteSaving(true);
        setNoteError(null);

        try {
            if (!normalizedText) {
                if (hasExistingNote) {
                    await deleteLessonNote(lesson.id);
                    setHasExistingNote(false);
                    setSavedNoteText('');
                }
                setIsNoteOpen(false);
                return;
            }

            await saveLessonNote(lesson.id, normalizedText);
            setHasExistingNote(true);
            setSavedNoteText(normalizedText);
            setIsNoteOpen(false);
        } catch (error: unknown) {
            setNoteError(error instanceof Error ? error.message : 'Ошибка сохранения заметки');
        } finally {
            setNoteSaving(false);
        }
    };

    const cardStyle = {
        '--lesson-accent': typeMeta.accent,
        '--lesson-accent-soft': typeMeta.soft,
    } as CSSProperties;

    return (
        <>
            <div className="lesson-card" style={cardStyle}>
                <div className="lesson-card__top">
                    {typeMeta.label && (
                        <span className="lesson-card__type">{typeMeta.label}</span>
                    )}
                    <div className="lesson-card__time">
                        {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                    </div>
                </div>

                {/* Предмет + аудитория */}
                <div className="lesson-card__subject">
                    {lesson.subject}
                    {showClassroom ? ` · ${lesson.classroom}` : ''}
                </div>

                {/* Преподаватель */}
                {showTeacher && (
                    <div className="lesson-card__meta">{lesson.teacher.full_name}</div>
                )}

                {showGroupName && (
                    <div className="lesson-card__meta">Группа: {lesson.group.name}</div>
                )}

                <button
                    type="button"
                    onClick={handleOpenNote}
                    aria-label="Открыть заметку"
                    title={hasExistingNote ? savedNoteText : 'Добавить заметку'}
                    className={`lesson-card__note${hasExistingNote ? ' lesson-card__note--filled' : ''}`}
                >
                    {hasExistingNote ? savedNoteText : 'Добавить заметку'}
                </button>
            </div>

            <LessonNoteModal
                open={isNoteOpen}
                lessonTitle={lesson.subject}
                value={noteText}
                isLoading={noteLoading}
                isSaving={noteSaving}
                error={noteError}
                onChange={setNoteText}
                onClose={() => {
                    if (!noteSaving) {
                        setIsNoteOpen(false);
                        setNoteError(null);
                    }
                }}
                onSave={handleSaveNote}
            />
        </>
    );
}