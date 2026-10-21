// Popover editor for a placed slot: precise start/end times, type, teacher and
// classroom, plus delete. Opens on a tap/click of a slot (drags move it instead).
import { useState } from 'react';
import type { LessonTypeRecord } from '../../../api/adminSchedule';
import type { SlotRecord } from '../../../api/schedulePlanner';
import type { Profile } from '../../../api/types/types';
import { CloseIcon } from '../../icons';

export type SlotPatch = Partial<
    Pick<SlotRecord, 'start_time' | 'end_time' | 'type' | 'teacher_id' | 'teacher_name' | 'classroom'>
>;

type Props = {
    slot: SlotRecord;
    lessonTypes: LessonTypeRecord[];
    teachers: Profile[];
    classrooms: string[];
    onChange: (patch: SlotPatch) => void;
    onDelete: () => void;
    onClose: () => void;
};

function formatTeacher(t: Profile): string {
    const parts = [t.last_name, t.first_name, t.middle_name].filter(Boolean);
    return parts.length ? parts.join(' ') : t.email || `#${t.id}`;
}

export function PlannerSlotEditor({ slot, lessonTypes, teachers, classrooms, onChange, onDelete, onClose }: Props) {
    // Initialised from props; the parent remounts this editor (via key) when the
    // slot or its times change externally, so no effect-based syncing is needed.
    const [start, setStart] = useState(slot.start_time);
    const [end, setEnd] = useState(slot.end_time);
    const [error, setError] = useState<string | null>(null);

    const commitTimes = () => {
        if (end <= start) {
            setError('Время окончания должно быть позже начала');
            return;
        }
        setError(null);
        if (start !== slot.start_time || end !== slot.end_time) {
            onChange({ start_time: start, end_time: end });
        }
    };

    return (
        <div className="planner-editor__backdrop" onPointerDown={onClose}>
            <div
                className="planner-editor glass"
                role="dialog"
                aria-label={`Настройка занятия: ${slot.subject}`}
                onPointerDown={e => e.stopPropagation()}
            >
                <div className="planner-editor__head">
                    <h4 className="planner-editor__title">{slot.subject}</h4>
                    <button type="button" className="planner-editor__close" aria-label="Закрыть" onClick={onClose}>
                        <CloseIcon size={18} />
                    </button>
                </div>

                <div className="planner-editor__times">
                    <label className="planner-field">
                        Начало
                        <input type="time" value={start} step={300} onChange={e => setStart(e.target.value)} onBlur={commitTimes} />
                    </label>
                    <label className="planner-field">
                        Конец
                        <input type="time" value={end} step={300} onChange={e => setEnd(e.target.value)} onBlur={commitTimes} />
                    </label>
                </div>
                {error && <p className="planner-editor__error">{error}</p>}

                <label className="planner-field">
                    Тип
                    <select value={slot.type} onChange={e => onChange({ type: e.target.value })}>
                        {slot.type && !lessonTypes.some(t => t.name === slot.type) && (
                            <option value={slot.type}>{slot.type}</option>
                        )}
                        {lessonTypes.map(t => (
                            <option key={t.id} value={t.name}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="planner-field">
                    Преподаватель
                    <select
                        value={slot.teacher_id != null ? String(slot.teacher_id) : ''}
                        onChange={e => {
                            const id = e.target.value ? Number(e.target.value) : null;
                            const teacher = teachers.find(t => t.id === id);
                            onChange({ teacher_id: id, teacher_name: teacher ? formatTeacher(teacher) : '' });
                        }}
                    >
                        <option value="">Не назначен</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                                {formatTeacher(t)}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="planner-field">
                    Аудитория
                    <input
                        type="text"
                        list="planner-classrooms"
                        defaultValue={slot.classroom}
                        placeholder="напр. А-101"
                        onBlur={e => {
                            if (e.target.value !== slot.classroom) onChange({ classroom: e.target.value.trim() });
                        }}
                    />
                    <datalist id="planner-classrooms">
                        {classrooms.map(name => (
                            <option key={name} value={name} />
                        ))}
                    </datalist>
                </label>

                <div className="planner-editor__actions">
                    <button type="button" className="admin-danger-button" onClick={onDelete}>
                        Удалить занятие
                    </button>
                    <button type="button" className="admin-primary-button" onClick={onClose}>
                        Готово
                    </button>
                </div>
            </div>
        </div>
    );
}
