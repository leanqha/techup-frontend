import { createPortal } from 'react-dom';
import { CloseIcon } from '../icons/CloseIcon';
import './LessonNoteModal.css';

type LessonNoteModalProps = {
    open: boolean;
    lessonTitle: string;
    value: string;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    onChange: (value: string) => void;
    onClose: () => void;
    onSave: () => void;
};

export function LessonNoteModal({
    open,
    lessonTitle,
    value,
    isLoading,
    isSaving,
    error,
    onChange,
    onClose,
    onSave,
}: LessonNoteModalProps) {
    if (!open) return null;

    return createPortal(
        <div className="lesson-note-modal__overlay" onClick={onClose}>
            <div
                className="lesson-note-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`Заметка: ${lessonTitle}`}
                onClick={event => event.stopPropagation()}
            >
                <div className="lesson-note-modal__header">
                    <h3>Заметка к занятию</h3>
                    <button
                        type="button"
                        className="lesson-note-modal__close"
                        onClick={onClose}
                        aria-label="Закрыть окно"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <p className="lesson-note-modal__subtitle">{lessonTitle}</p>

                <textarea
                    className="lesson-note-modal__textarea"
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    placeholder="Введите заметку..."
                    disabled={isLoading || isSaving}
                    rows={8}
                />

                {error && <p className="lesson-note-modal__error">{error}</p>}

                <div className="lesson-note-modal__actions">
                    <button
                        type="button"
                        className="lesson-note-modal__button lesson-note-modal__button--secondary"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        className="lesson-note-modal__button lesson-note-modal__button--primary"
                        onClick={onSave}
                        disabled={isLoading || isSaving}
                    >
                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
