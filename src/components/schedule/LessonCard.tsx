// src/components/schedule/LessonCard.tsx
import { useEffect, useState } from 'react';
import type { Lesson, LessonType } from '../../api/types/schedule';
import { deleteLessonNote, fetchLessonNote, saveLessonNote } from '../../api/schedule.ts';
import { formatTime } from '../../utils/date';
import { LessonNoteModal } from './LessonNoteModal';

function getTypeMeta(type: LessonType) {
    switch (type) {
        case 'lecture':
            return {
                label: 'Лекция',
                accent: '#2563EB',
                bg: '#EFF6FF',
            };
        case 'practice':
            return {
                label: 'Практика',
                accent: '#DC2626',
                bg: '#FEF2F2',
            };
        case 'laboratory':
            return {
                label: 'Лабораторная',
                accent: '#7C3AED',
                bg: '#F5F3FF',
            };
        default:
            return {
                label: '',
                accent: '#6B7280',
                bg: '#F9FAFB',
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

    return (
        <>
            <div
                style={{
                    position: 'relative',
                    borderRadius: 16,
                    padding: 16,
                    paddingBottom: 44,
                    marginBottom: 12,
                    background: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    borderLeft: `6px solid ${typeMeta.accent}`,
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                    }}
                >
                    {/* Тип */}
                    {typeMeta.label && (
                        <span
                            style={{
                                alignSelf: 'flex-start',
                                background: typeMeta.bg,
                                color: typeMeta.accent,
                                padding: '4px 10px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                                letterSpacing: 0.3,
                            }}
                        >
                            {typeMeta.label}
                        </span>
                    )}

                    <div
                        style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        {/* Время */}
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: '#374151',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                        </div>
                    </div>
                </div>

                {/* Предмет + аудитория */}
                <div
                    style={{
                        fontSize: 16,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: '#111827',
                        wordBreak: 'break-word',
                    }}
                >
                    {lesson.subject}
                    {showClassroom ? ` · ${lesson.classroom}` : ''}
                </div>

                {/* Преподаватель */}
                {showTeacher && (
                    <div
                        style={{
                            fontSize: 14,
                            color: '#6B7280',
                        }}
                    >
                        {lesson.teacher.full_name}
                    </div>
                )}

                {showGroupName && (
                    <div
                        style={{
                            fontSize: 14,
                            color: '#6B7280',
                        }}
                    >
                        Группа: {lesson.group.name}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleOpenNote}
                    aria-label="Открыть заметку"
                    title={hasExistingNote ? savedNoteText : 'Добавить заметку'}
                    style={{
                        position: 'absolute',
                        right: 16,
                        bottom: 12,
                        maxWidth: 'calc(100% - 32px)',
                        border: 'none',
                        borderRadius: 0,
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        color: hasExistingNote ? '#374151' : '#2563EB',
                        fontSize: 12,
                        lineHeight: '16px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'right',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                    }}
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