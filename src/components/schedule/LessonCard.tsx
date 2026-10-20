// src/components/schedule/LessonCard.tsx
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Lesson, LessonTypeMeta } from '../../api/types/schedule';
import { deleteLessonNote, fetchLessonNote, saveLessonNote } from '../../api/schedule.ts';
import { formatTime } from '../../utils/date';
import { LessonNoteModal } from './LessonNoteModal';
import { useLessonTypes } from './useLessonTypes';
import './schedule.css';

const NEUTRAL_ACCENT = '#64748b';

// Build a translucent variant of a hex color for the type chip / card tint.
function toSoft(hex: string, alpha = 0.12): string {
    const match = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim());
    if (!match) return `rgba(100, 116, 139, ${alpha})`;

    let value = match[1];
    if (value.length === 3) {
        value = value.split('').map(ch => ch + ch).join('');
    }
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Resolve a lesson's type to its label + accent from the catalog, falling back
// to a neutral accent and the raw value for types not (or no longer) in it.
function getTypeMeta(type: string, catalog: Map<string, LessonTypeMeta>) {
    const meta = catalog.get(type);
    const accent = meta?.color || NEUTRAL_ACCENT;
    return {
        label: meta?.name ?? '',
        accent,
        soft: toSoft(accent),
    };
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

    const lessonTypes = useLessonTypes();
    const typeCatalog = useMemo(
        () => new Map(lessonTypes.map(item => [item.name, item])),
        [lessonTypes],
    );
    const typeMeta = getTypeMeta(lesson.type, typeCatalog);

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